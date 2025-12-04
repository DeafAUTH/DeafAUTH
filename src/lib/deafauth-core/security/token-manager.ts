// DeafAUTH Security - Token Manager
// PASETO (default) and JWT token generation and validation

import type { SecurityConfig } from './types';

// Node.js crypto for server-side usage
let nodeCrypto: typeof import('crypto') | null = null;
try {
  // Dynamic import for Node.js environment
  nodeCrypto = require('crypto');
} catch {
  // Browser environment - will use Web Crypto API
}

/**
 * Token format options
 */
export type TokenFormat = 'paseto' | 'jwt';

/**
 * Token payload interface
 */
export interface TokenPayload {
  sub: string;           // Subject (user ID)
  aud?: string;          // Audience (app ID)
  iss?: string;          // Issuer
  exp?: number;          // Expiration time (Unix timestamp)
  iat?: number;          // Issued at (Unix timestamp)
  nbf?: number;          // Not before (Unix timestamp)
  jti?: string;          // Token ID
  scopes?: string[];     // Granted scopes
  type?: 'access' | 'refresh';  // Token type
  [key: string]: unknown;
}

/**
 * Token generation result
 */
export interface TokenResult {
  token: string;
  format: TokenFormat;
  expiresAt: number;
  payload: TokenPayload;
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  valid: boolean;
  payload?: TokenPayload;
  error?: string;
  expired?: boolean;
}

/**
 * Token manager configuration
 */
export interface TokenManagerConfig {
  format?: TokenFormat;           // Default: 'paseto'
  secretKey?: string;             // Secret key for token signing/encryption
  issuer?: string;                // Token issuer
  audience?: string;              // Token audience
  accessTokenExpiry?: number;     // Access token expiry in seconds (default: 3600)
  refreshTokenExpiry?: number;    // Refresh token expiry in seconds (default: 2592000)
}

/**
 * Generate a secure random string
 */
function generateSecureString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (nodeCrypto) {
    // Node.js environment
    const randomBytes = nodeCrypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
  } else if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generate a unique token ID
 */
function generateTokenId(): string {
  return `${Date.now()}_${generateSecureString(16)}`;
}

/**
 * Get or generate a secret key
 * In production, this should be provided via environment variables
 */
function getSecretKey(providedKey?: string): Buffer {
  const keyString = providedKey || 
    (typeof process !== 'undefined' ? process.env?.DEAFAUTH_SECRET_KEY : undefined) ||
    // Fallback for development - generates a random key per instance
    generateSecureString(32);
  
  // Convert to 32-byte key for AES-256
  if (nodeCrypto) {
    const hash = nodeCrypto.createHash('sha256');
    hash.update(keyString);
    return hash.digest();
  }
  
  // Browser fallback - simple padding
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(keyString);
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = keyBytes[i % keyBytes.length];
  }
  return Buffer.from(key);
}

/**
 * Token Manager
 * 
 * Handles token generation and validation using PASETO (default) or JWT.
 * PASETO v4.local is used for secure authenticated encryption.
 * 
 * @example
 * ```typescript
 * // Using PASETO (default)
 * const tokenManager = new TokenManager({
 *   secretKey: process.env.DEAFAUTH_SECRET_KEY,
 *   issuer: 'deafauth.io',
 * });
 * 
 * // Generate access token
 * const { token, expiresAt } = await tokenManager.generateAccessToken({
 *   sub: 'user_123',
 *   scopes: ['profile:read'],
 * });
 * 
 * // Validate token
 * const result = await tokenManager.validateToken(token);
 * if (result.valid) {
 *   console.log('User ID:', result.payload.sub);
 * }
 * 
 * // Using JWT as alternative
 * const jwtManager = new TokenManager({
 *   format: 'jwt',
 *   secretKey: process.env.DEAFAUTH_SECRET_KEY,
 * });
 * ```
 */
export class TokenManager {
  private config: Required<TokenManagerConfig>;
  private secretKey: Buffer;
  private format: TokenFormat;

  constructor(config: TokenManagerConfig = {}) {
    this.format = config.format ?? 'paseto';
    this.secretKey = getSecretKey(config.secretKey);
    this.config = {
      format: this.format,
      secretKey: config.secretKey ?? '',
      issuer: config.issuer ?? 'deafauth',
      audience: config.audience ?? 'deafauth-api',
      accessTokenExpiry: config.accessTokenExpiry ?? 3600,        // 1 hour
      refreshTokenExpiry: config.refreshTokenExpiry ?? 2592000,   // 30 days
    };
  }

  /**
   * Generate an access token
   */
  async generateAccessToken(payload: Partial<TokenPayload>): Promise<TokenResult> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.config.accessTokenExpiry;

    const fullPayload: TokenPayload = {
      sub: payload.sub ?? '',
      aud: payload.aud ?? this.config.audience,
      iss: this.config.issuer,
      iat: now,
      nbf: now,
      exp,
      jti: generateTokenId(),
      type: 'access',
      scopes: payload.scopes ?? [],
      ...payload,
    };

    const token = await this.createToken(fullPayload);

    return {
      token,
      format: this.format,
      expiresAt: exp * 1000,
      payload: fullPayload,
    };
  }

  /**
   * Generate a refresh token
   */
  async generateRefreshToken(payload: Partial<TokenPayload>): Promise<TokenResult> {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + this.config.refreshTokenExpiry;

    const fullPayload: TokenPayload = {
      sub: payload.sub ?? '',
      aud: payload.aud ?? this.config.audience,
      iss: this.config.issuer,
      iat: now,
      nbf: now,
      exp,
      jti: generateTokenId(),
      type: 'refresh',
      scopes: payload.scopes ?? [],
      ...payload,
    };

    const token = await this.createToken(fullPayload);

    return {
      token,
      format: this.format,
      expiresAt: exp * 1000,
      payload: fullPayload,
    };
  }

  /**
   * Validate a token
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    try {
      // Detect token format
      const detectedFormat = this.detectTokenFormat(token);
      
      if (detectedFormat === 'paseto') {
        return this.validatePasetoToken(token);
      } else if (detectedFormat === 'jwt') {
        return this.validateJwtToken(token);
      }
      
      return { valid: false, error: 'Unknown token format' };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Token validation failed' 
      };
    }
  }

  /**
   * Detect token format from the token string
   */
  private detectTokenFormat(token: string): TokenFormat | null {
    if (token.startsWith('v4.local.') || token.startsWith('v4.public.')) {
      return 'paseto';
    }
    // JWT has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length === 3) {
      return 'jwt';
    }
    return null;
  }

  /**
   * Create a token using the configured format
   */
  private async createToken(payload: TokenPayload): Promise<string> {
    if (this.format === 'paseto') {
      return this.createPasetoToken(payload);
    } else {
      return this.createJwtToken(payload);
    }
  }

  /**
   * Create a PASETO v4.local token
   * Uses authenticated encryption (AES-256-GCM)
   */
  private async createPasetoToken(payload: TokenPayload): Promise<string> {
    const payloadStr = JSON.stringify(payload);
    
    if (nodeCrypto) {
      // Node.js environment - use crypto module
      const iv = nodeCrypto.randomBytes(12);
      const cipher = nodeCrypto.createCipheriv('aes-256-gcm', this.secretKey, iv);
      
      const encrypted = Buffer.concat([
        cipher.update(payloadStr, 'utf8'),
        cipher.final()
      ]);
      const authTag = cipher.getAuthTag();
      
      // Combine iv + encrypted + authTag
      const combined = Buffer.concat([iv, encrypted, authTag]);
      const base64 = combined.toString('base64url');
      
      return `v4.local.${base64}`;
    } else {
      // Browser environment - use Web Crypto API
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadStr);
      
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        this.secretKey,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: nonce },
        cryptoKey,
        data
      );
      
      const combined = new Uint8Array(nonce.length + encrypted.byteLength);
      combined.set(nonce);
      combined.set(new Uint8Array(encrypted), nonce.length);
      
      const base64 = this.base64UrlEncode(combined);
      return `v4.local.${base64}`;
    }
  }

  /**
   * Validate a PASETO token
   */
  private async validatePasetoToken(token: string): Promise<TokenValidationResult> {
    try {
      if (!token.startsWith('v4.local.')) {
        return { valid: false, error: 'Invalid PASETO token format' };
      }
      
      const base64Payload = token.substring(9); // Remove 'v4.local.'
      
      if (nodeCrypto) {
        // Node.js environment
        const combined = Buffer.from(base64Payload, 'base64url');
        const iv = combined.subarray(0, 12);
        const authTag = combined.subarray(-16);
        const encrypted = combined.subarray(12, -16);
        
        const decipher = nodeCrypto.createDecipheriv('aes-256-gcm', this.secretKey, iv);
        decipher.setAuthTag(authTag);
        
        const decrypted = Buffer.concat([
          decipher.update(encrypted),
          decipher.final()
        ]);
        
        const payload = JSON.parse(decrypted.toString('utf8')) as TokenPayload;
        
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return { valid: false, error: 'Token has expired', expired: true, payload };
        }
        
        if (payload.nbf && payload.nbf > now) {
          return { valid: false, error: 'Token is not yet valid', payload };
        }
        
        return { valid: true, payload };
      } else {
        // Browser environment
        const combined = this.base64UrlDecode(base64Payload);
        const nonce = combined.slice(0, 12);
        const ciphertext = combined.slice(12);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          this.secretKey,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: nonce },
          cryptoKey,
          ciphertext
        );
        
        const decoder = new TextDecoder();
        const payloadStr = decoder.decode(decrypted);
        const payload = JSON.parse(payloadStr) as TokenPayload;
        
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return { valid: false, error: 'Token has expired', expired: true, payload };
        }
        
        if (payload.nbf && payload.nbf > now) {
          return { valid: false, error: 'Token is not yet valid', payload };
        }
        
        return { valid: true, payload };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Token decryption failed' 
      };
    }
  }

  /**
   * Create a JWT token (optional alternative)
   */
  private async createJwtToken(payload: TokenPayload): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    
    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signingInput = `${headerB64}.${payloadB64}`;
    
    if (nodeCrypto) {
      // Node.js environment
      const hmac = nodeCrypto.createHmac('sha256', this.secretKey);
      hmac.update(signingInput);
      const signature = hmac.digest('base64url');
      
      return `${signingInput}.${signature}`;
    } else {
      // Browser environment
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        this.secretKey,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        new TextEncoder().encode(signingInput)
      );
      
      const signatureB64 = this.base64UrlEncode(new Uint8Array(signature));
      return `${signingInput}.${signatureB64}`;
    }
  }

  /**
   * Validate a JWT token
   */
  private async validateJwtToken(token: string): Promise<TokenValidationResult> {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid JWT format' };
      }
      
      const [headerB64, payloadB64, signatureB64] = parts;
      const signingInput = `${headerB64}.${payloadB64}`;
      
      if (nodeCrypto) {
        // Node.js environment
        const hmac = nodeCrypto.createHmac('sha256', this.secretKey);
        hmac.update(signingInput);
        const expectedSignature = hmac.digest('base64url');
        
        if (signatureB64 !== expectedSignature) {
          return { valid: false, error: 'Invalid signature' };
        }
        
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as TokenPayload;
        
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return { valid: false, error: 'Token has expired', expired: true, payload };
        }
        
        if (payload.nbf && payload.nbf > now) {
          return { valid: false, error: 'Token is not yet valid', payload };
        }
        
        return { valid: true, payload };
      } else {
        // Browser environment
        const signature = this.base64UrlDecode(signatureB64);
        
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          this.secretKey,
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['verify']
        );
        
        const valid = await crypto.subtle.verify(
          'HMAC',
          cryptoKey,
          signature,
          new TextEncoder().encode(signingInput)
        );
        
        if (!valid) {
          return { valid: false, error: 'Invalid signature' };
        }
        
        const payloadBytes = this.base64UrlDecode(payloadB64);
        const payloadStr = new TextDecoder().decode(payloadBytes);
        const payload = JSON.parse(payloadStr) as TokenPayload;
        
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          return { valid: false, error: 'Token has expired', expired: true, payload };
        }
        
        if (payload.nbf && payload.nbf > now) {
          return { valid: false, error: 'Token is not yet valid', payload };
        }
        
        return { valid: true, payload };
      }
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : 'Token validation failed' 
      };
    }
  }

  /**
   * Base64url encode (for browser)
   */
  private base64UrlEncode(data: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  /**
   * Base64url decode (for browser)
   */
  private base64UrlDecode(str: string): Uint8Array {
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Get the current token format
   */
  getFormat(): TokenFormat {
    return this.format;
  }

  /**
   * Check if using PASETO
   */
  isPaseto(): boolean {
    return this.format === 'paseto';
  }

  /**
   * Check if using JWT
   */
  isJwt(): boolean {
    return this.format === 'jwt';
  }
}

/**
 * Create a PASETO token manager (default)
 */
export function createPasetoTokenManager(config?: Omit<TokenManagerConfig, 'format'>): TokenManager {
  return new TokenManager({ ...config, format: 'paseto' });
}

/**
 * Create a JWT token manager (optional)
 */
export function createJwtTokenManager(config?: Omit<TokenManagerConfig, 'format'>): TokenManager {
  return new TokenManager({ ...config, format: 'jwt' });
}
