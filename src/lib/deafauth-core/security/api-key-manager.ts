// DeafAUTH Security - API Key Manager
// Secure API key generation, validation, and management

import type {
  ApiKey,
  ApiKeyStatus,
  CreateApiKeyParams,
  ApiKeyValidationResult,
  SecurityConfig,
} from './types';
import type { DatabaseAdapter } from '../types';

/**
 * Secure random string generator for API keys
 * Uses crypto.getRandomValues when available, falls back to Math.random
 */
function generateSecureRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // Use crypto.getRandomValues if available (browser/Node.js with crypto)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}_${generateSecureRandomString(8)}`;
}

/**
 * Hash a string using a simple but effective algorithm
 * For production, use a proper hashing library like bcrypt
 */
async function hashString(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback - base64 encode (not secure, for development only)
  return Buffer.from(input).toString('base64');
}

/**
 * API Key Manager
 * 
 * Handles creation, validation, and lifecycle management of API keys
 * for third-party application access to DeafAUTH.
 * 
 * @example
 * ```typescript
 * const keyManager = new ApiKeyManager(dbAdapter, {
 *   apiKeyPrefix: 'dak_',
 *   apiKeyLength: 32
 * });
 * 
 * // Create a new API key
 * const { key, apiKey } = await keyManager.createApiKey({
 *   name: 'My App',
 *   clientId: 'client_123',
 *   scopes: ['profile:read', 'preferences:read']
 * });
 * 
 * // Validate an API key
 * const result = await keyManager.validateApiKey('dak_abc123...');
 * ```
 */
export class ApiKeyManager {
  private dbAdapter: DatabaseAdapter | null;
  private config: SecurityConfig;
  private memoryStore: Map<string, ApiKey>;

  constructor(
    dbAdapter: DatabaseAdapter | null = null,
    config: SecurityConfig = {}
  ) {
    this.dbAdapter = dbAdapter;
    this.config = {
      apiKeyPrefix: config.apiKeyPrefix ?? 'dak_',
      apiKeyLength: config.apiKeyLength ?? 32,
      defaultApiKeyExpiry: config.defaultApiKeyExpiry ?? 365 * 24 * 60 * 60, // 1 year
      ...config,
    };
    this.memoryStore = new Map();
  }

  /**
   * Create a new API key
   * Returns both the raw key (to give to the user) and the stored record
   */
  async createApiKey(params: CreateApiKeyParams): Promise<{ key: string; apiKey: ApiKey }> {
    // Generate a secure random key
    const rawKey = this.config.apiKeyPrefix + generateSecureRandomString(this.config.apiKeyLength ?? 32);
    
    // Hash the key for storage
    const hashedKey = await hashString(rawKey);
    
    // Calculate expiration
    const expiresIn = params.expiresIn ?? this.config.defaultApiKeyExpiry;
    const expiresAt = expiresIn 
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : undefined;

    const apiKey: ApiKey = {
      id: generateId(),
      key: hashedKey,
      name: params.name,
      description: params.description,
      clientId: params.clientId,
      scopes: params.scopes,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt,
      rateLimit: params.rateLimit,
      metadata: params.metadata,
    };

    // Store the API key
    if (this.dbAdapter) {
      await this.dbAdapter.insert('api_keys', apiKey);
    } else {
      this.memoryStore.set(hashedKey, apiKey);
    }

    return { key: rawKey, apiKey };
  }

  /**
   * Validate an API key
   */
  async validateApiKey(rawKey: string): Promise<ApiKeyValidationResult> {
    // Check prefix
    if (!rawKey.startsWith(this.config.apiKeyPrefix ?? 'dak_')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    // Hash the key for lookup
    const hashedKey = await hashString(rawKey);

    // Find the key
    let apiKey: ApiKey | null = null;
    if (this.dbAdapter) {
      apiKey = await this.dbAdapter.findOne<ApiKey>('api_keys', { key: hashedKey });
    } else {
      apiKey = this.memoryStore.get(hashedKey) ?? null;
    }

    if (!apiKey) {
      return { valid: false, error: 'API key not found' };
    }

    // Check status
    if (apiKey.status !== 'active') {
      return { valid: false, error: `API key is ${apiKey.status}`, key: apiKey };
    }

    // Check expiration
    if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
      return { valid: false, error: 'API key has expired', key: apiKey };
    }

    // Update last used timestamp
    await this.updateLastUsed(hashedKey);

    return { valid: true, key: apiKey };
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<boolean> {
    return this.updateKeyStatus(keyId, 'revoked');
  }

  /**
   * Suspend an API key
   */
  async suspendApiKey(keyId: string): Promise<boolean> {
    return this.updateKeyStatus(keyId, 'suspended');
  }

  /**
   * Reactivate a suspended API key
   */
  async reactivateApiKey(keyId: string): Promise<boolean> {
    return this.updateKeyStatus(keyId, 'active');
  }

  /**
   * Get all API keys for a client
   */
  async getApiKeysByClientId(clientId: string): Promise<ApiKey[]> {
    if (this.dbAdapter?.find) {
      return this.dbAdapter.find<ApiKey>('api_keys', { clientId });
    }
    
    return Array.from(this.memoryStore.values()).filter(
      key => key.clientId === clientId
    );
  }

  /**
   * Delete an API key permanently
   */
  async deleteApiKey(keyId: string): Promise<boolean> {
    if (this.dbAdapter?.delete) {
      await this.dbAdapter.delete('api_keys', { id: keyId });
      return true;
    }
    
    // For memory store, find and delete by ID
    const entries = Array.from(this.memoryStore.entries());
    for (const [hash, key] of entries) {
      if (key.id === keyId) {
        this.memoryStore.delete(hash);
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if a key has required scopes
   */
  hasScopes(apiKey: ApiKey, requiredScopes: string[]): boolean {
    // Check for wildcard scope
    if (apiKey.scopes.includes('*')) {
      return true;
    }

    // Check each required scope
    for (const required of requiredScopes) {
      const hasScope = apiKey.scopes.some(scope => {
        // Exact match
        if (scope === required) return true;
        
        // Wildcard match (e.g., 'profile:*' matches 'profile:read')
        if (scope.endsWith(':*')) {
          const prefix = scope.slice(0, -1);
          return required.startsWith(prefix);
        }
        
        return false;
      });

      if (!hasScope) return false;
    }

    return true;
  }

  /**
   * Update the last used timestamp for a key
   */
  private async updateLastUsed(hashedKey: string): Promise<void> {
    const lastUsedAt = new Date().toISOString();
    
    if (this.dbAdapter) {
      await this.dbAdapter.update(
        'api_keys',
        { key: hashedKey },
        { lastUsedAt }
      );
    } else {
      const key = this.memoryStore.get(hashedKey);
      if (key) {
        this.memoryStore.set(hashedKey, { ...key, lastUsedAt });
      }
    }
  }

  /**
   * Update API key status
   */
  private async updateKeyStatus(keyId: string, status: ApiKeyStatus): Promise<boolean> {
    if (this.dbAdapter) {
      await this.dbAdapter.update(
        'api_keys',
        { id: keyId },
        { status }
      );
      return true;
    }
    
    // For memory store, find and update by ID
    const entries = Array.from(this.memoryStore.entries());
    for (const [hash, key] of entries) {
      if (key.id === keyId) {
        this.memoryStore.set(hash, { ...key, status });
        return true;
      }
    }
    
    return false;
  }
}
