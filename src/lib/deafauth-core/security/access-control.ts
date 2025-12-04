// DeafAUTH Security - Access Control
// Third-party application registration and access management

import type {
  ThirdPartyApp,
  AppStatus,
  AccessGrant,
  AuthorizationRequest,
  AuthorizationResponse,
  SecurityConfig,
  SecurityEvent,
  SecurityEventType,
  SecurityActor,
} from './types';
import type { DatabaseAdapter } from '../types';
import { ScopeManager } from './oauth2-scopes';

/**
 * Generate a secure random string
 */
function generateSecureString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
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
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}_${generateSecureString(8)}`;
}

/**
 * Access Control Manager
 * 
 * Manages third-party application registration, authorization grants,
 * and access control for the DeafAUTH system.
 * 
 * @example
 * ```typescript
 * const accessControl = new AccessControlManager(dbAdapter);
 * 
 * // Register a third-party app
 * const app = await accessControl.registerApp({
 *   name: 'My App',
 *   ownerId: 'user_123',
 *   redirectUris: ['https://myapp.com/callback'],
 *   allowedScopes: ['profile:read', 'preferences:read']
 * });
 * 
 * // Process authorization request
 * const authResponse = await accessControl.authorize({
 *   clientId: app.clientId,
 *   redirectUri: 'https://myapp.com/callback',
 *   scopes: ['profile:read'],
 *   state: 'random_state',
 *   responseType: 'code'
 * }, 'user_456');
 * ```
 */
export class AccessControlManager {
  private dbAdapter: DatabaseAdapter | null;
  private config: SecurityConfig;
  private scopeManager: ScopeManager;
  private memoryApps: Map<string, ThirdPartyApp>;
  private memoryGrants: Map<string, AccessGrant>;
  private authCodes: Map<string, { userId: string; appId: string; scopes: string[]; expiresAt: number }>;

  constructor(
    dbAdapter: DatabaseAdapter | null = null,
    config: SecurityConfig = {}
  ) {
    this.dbAdapter = dbAdapter;
    this.config = {
      accessTokenExpiry: config.accessTokenExpiry ?? 3600,        // 1 hour
      refreshTokenExpiry: config.refreshTokenExpiry ?? 2592000,   // 30 days
      authCodeExpiry: config.authCodeExpiry ?? 600,               // 10 minutes
      enableAuditLog: config.enableAuditLog ?? true,
      ...config,
    };
    this.scopeManager = new ScopeManager();
    this.memoryApps = new Map();
    this.memoryGrants = new Map();
    this.authCodes = new Map();
  }

  // ============================================
  // APP REGISTRATION
  // ============================================

  /**
   * Register a new third-party application
   */
  async registerApp(params: {
    name: string;
    description?: string;
    ownerId: string;
    redirectUris: string[];
    allowedScopes: string[];
    webhookUrl?: string;
    metadata?: Record<string, unknown>;
  }): Promise<ThirdPartyApp> {
    // Generate client credentials
    const clientId = `client_${generateSecureString(24)}`;
    const clientSecret = `secret_${generateSecureString(48)}`;

    const app: ThirdPartyApp = {
      id: generateId(),
      name: params.name,
      description: params.description,
      clientId,
      clientSecret,
      redirectUris: params.redirectUris,
      allowedScopes: params.allowedScopes,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ownerId: params.ownerId,
      webhookUrl: params.webhookUrl,
      metadata: params.metadata,
    };

    // Store the app
    if (this.dbAdapter) {
      await this.dbAdapter.insert('third_party_apps', app);
    } else {
      this.memoryApps.set(clientId, app);
    }

    // Log event
    await this.logSecurityEvent('app_registered', {
      type: 'user',
      id: params.ownerId,
    }, {
      type: 'app',
      id: app.id,
      name: app.name,
    });

    return app;
  }

  /**
   * Get an app by client ID
   */
  async getAppByClientId(clientId: string): Promise<ThirdPartyApp | null> {
    if (this.dbAdapter) {
      return this.dbAdapter.findOne<ThirdPartyApp>('third_party_apps', { clientId });
    }
    return this.memoryApps.get(clientId) ?? null;
  }

  /**
   * Update app status (approve, suspend, revoke)
   */
  async updateAppStatus(appId: string, status: AppStatus, actorId: string): Promise<boolean> {
    const updatedAt = new Date().toISOString();
    
    if (this.dbAdapter) {
      await this.dbAdapter.update(
        'third_party_apps',
        { id: appId },
        { status, updatedAt }
      );
    } else {
      const entries = Array.from(this.memoryApps.entries());
      for (const [clientId, app] of entries) {
        if (app.id === appId) {
          this.memoryApps.set(clientId, { ...app, status, updatedAt });
          break;
        }
      }
    }

    // Log event
    const eventType: SecurityEventType = 
      status === 'approved' ? 'app_approved' : 
      status === 'suspended' ? 'app_suspended' : 
      'app_suspended';

    await this.logSecurityEvent(eventType, {
      type: 'user',
      id: actorId,
    }, {
      type: 'app',
      id: appId,
    });

    return true;
  }

  /**
   * Get all apps owned by a user
   */
  async getAppsByOwner(ownerId: string): Promise<ThirdPartyApp[]> {
    if (this.dbAdapter?.find) {
      return this.dbAdapter.find<ThirdPartyApp>('third_party_apps', { ownerId });
    }
    return Array.from(this.memoryApps.values()).filter(app => app.ownerId === ownerId);
  }

  // ============================================
  // AUTHORIZATION
  // ============================================

  /**
   * Validate an authorization request
   */
  async validateAuthorizationRequest(request: AuthorizationRequest): Promise<{
    valid: boolean;
    app?: ThirdPartyApp;
    error?: string;
    errorDescription?: string;
  }> {
    // Get the app
    const app = await this.getAppByClientId(request.clientId);
    
    if (!app) {
      return { valid: false, error: 'invalid_client', errorDescription: 'Client not found' };
    }

    if (app.status !== 'approved') {
      return { valid: false, error: 'unauthorized_client', errorDescription: 'Client is not approved' };
    }

    // Validate redirect URI
    if (!app.redirectUris.includes(request.redirectUri)) {
      return { valid: false, error: 'invalid_redirect_uri', errorDescription: 'Redirect URI not allowed' };
    }

    // Validate scopes
    const validScopes = this.scopeManager.filterAllowedScopes(
      request.scopes,
      app.allowedScopes
    );

    if (validScopes.length === 0) {
      return { valid: false, error: 'invalid_scope', errorDescription: 'No valid scopes requested' };
    }

    return { valid: true, app };
  }

  /**
   * Process an authorization request (after user consent)
   */
  async authorize(
    request: AuthorizationRequest,
    userId: string
  ): Promise<AuthorizationResponse> {
    // Validate the request
    const validation = await this.validateAuthorizationRequest(request);
    if (!validation.valid || !validation.app) {
      return {
        success: false,
        error: validation.error,
        errorDescription: validation.errorDescription,
      };
    }

    const app = validation.app;

    // Filter to allowed scopes
    const grantedScopes = this.scopeManager.filterAllowedScopes(
      request.scopes,
      app.allowedScopes
    );

    if (request.responseType === 'code') {
      // Authorization code flow
      const code = generateSecureString(32);
      const expiresAt = Date.now() + (this.config.authCodeExpiry ?? 600) * 1000;

      this.authCodes.set(code, {
        userId,
        appId: app.id,
        scopes: grantedScopes,
        expiresAt,
      });

      return {
        success: true,
        code,
        scopes: grantedScopes,
      };
    } else {
      // Implicit flow - return tokens directly
      const grant = await this.createAccessGrant(userId, app.id, grantedScopes);

      return {
        success: true,
        accessToken: grant.accessToken,
        expiresIn: this.config.accessTokenExpiry,
        scopes: grantedScopes,
      };
    }
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<AuthorizationResponse> {
    // Validate client credentials
    const app = await this.getAppByClientId(clientId);
    if (!app || app.clientSecret !== clientSecret) {
      return { success: false, error: 'invalid_client', errorDescription: 'Invalid client credentials' };
    }

    // Get and validate code
    const codeData = this.authCodes.get(code);
    if (!codeData) {
      return { success: false, error: 'invalid_grant', errorDescription: 'Invalid authorization code' };
    }

    if (codeData.expiresAt < Date.now()) {
      this.authCodes.delete(code);
      return { success: false, error: 'invalid_grant', errorDescription: 'Authorization code has expired' };
    }

    if (codeData.appId !== app.id) {
      return { success: false, error: 'invalid_grant', errorDescription: 'Code was not issued to this client' };
    }

    // Delete the code (single use)
    this.authCodes.delete(code);

    // Create access grant
    const grant = await this.createAccessGrant(
      codeData.userId,
      app.id,
      codeData.scopes
    );

    return {
      success: true,
      accessToken: grant.accessToken,
      refreshToken: grant.refreshToken,
      expiresIn: this.config.accessTokenExpiry,
      scopes: codeData.scopes,
    };
  }

  // ============================================
  // ACCESS GRANTS
  // ============================================

  /**
   * Create an access grant for a user-app pair
   */
  async createAccessGrant(
    userId: string,
    appId: string,
    scopes: string[]
  ): Promise<AccessGrant> {
    const accessToken = `at_${generateSecureString(48)}`;
    const refreshToken = `rt_${generateSecureString(64)}`;
    const expiresAt = new Date(
      Date.now() + (this.config.accessTokenExpiry ?? 3600) * 1000
    ).toISOString();

    const grant: AccessGrant = {
      id: generateId(),
      userId,
      appId,
      scopes,
      grantedAt: new Date().toISOString(),
      expiresAt,
      accessToken,
      refreshToken,
    };

    // Store the grant
    if (this.dbAdapter) {
      await this.dbAdapter.insert('access_grants', grant);
    } else {
      this.memoryGrants.set(grant.id, grant);
    }

    // Log event
    await this.logSecurityEvent('access_granted', {
      type: 'user',
      id: userId,
    }, {
      type: 'app',
      id: appId,
    });

    return grant;
  }

  /**
   * Validate an access token
   */
  async validateAccessToken(token: string): Promise<{
    valid: boolean;
    grant?: AccessGrant;
    error?: string;
  }> {
    let grant: AccessGrant | null = null;

    if (this.dbAdapter) {
      grant = await this.dbAdapter.findOne<AccessGrant>('access_grants', { accessToken: token });
    } else {
      const grants = Array.from(this.memoryGrants.values());
      for (const g of grants) {
        if (g.accessToken === token) {
          grant = g;
          break;
        }
      }
    }

    if (!grant) {
      return { valid: false, error: 'Token not found' };
    }

    if (grant.revokedAt) {
      return { valid: false, error: 'Token has been revoked', grant };
    }

    if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) {
      return { valid: false, error: 'Token has expired', grant };
    }

    return { valid: true, grant };
  }

  /**
   * Revoke an access grant
   */
  async revokeGrant(grantId: string, actorId: string): Promise<boolean> {
    const revokedAt = new Date().toISOString();

    if (this.dbAdapter) {
      await this.dbAdapter.update(
        'access_grants',
        { id: grantId },
        { revokedAt }
      );
    } else {
      const grant = this.memoryGrants.get(grantId);
      if (grant) {
        this.memoryGrants.set(grantId, { ...grant, revokedAt });
      }
    }

    await this.logSecurityEvent('access_revoked', {
      type: 'user',
      id: actorId,
    }, {
      type: 'resource',
      id: grantId,
    });

    return true;
  }

  /**
   * Get all grants for a user
   */
  async getUserGrants(userId: string): Promise<AccessGrant[]> {
    if (this.dbAdapter?.find) {
      return this.dbAdapter.find<AccessGrant>('access_grants', { userId });
    }
    return Array.from(this.memoryGrants.values()).filter(g => g.userId === userId);
  }

  /**
   * Refresh an access token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthorizationResponse> {
    let grant: AccessGrant | null = null;

    if (this.dbAdapter) {
      grant = await this.dbAdapter.findOne<AccessGrant>('access_grants', { refreshToken });
    } else {
      const grants = Array.from(this.memoryGrants.values());
      for (const g of grants) {
        if (g.refreshToken === refreshToken) {
          grant = g;
          break;
        }
      }
    }

    if (!grant) {
      return { success: false, error: 'invalid_grant', errorDescription: 'Refresh token not found' };
    }

    if (grant.revokedAt) {
      return { success: false, error: 'invalid_grant', errorDescription: 'Grant has been revoked' };
    }

    // Generate new tokens
    const newAccessToken = `at_${generateSecureString(48)}`;
    const newExpiresAt = new Date(
      Date.now() + (this.config.accessTokenExpiry ?? 3600) * 1000
    ).toISOString();

    // Update grant
    if (this.dbAdapter) {
      await this.dbAdapter.update(
        'access_grants',
        { id: grant.id },
        { accessToken: newAccessToken, expiresAt: newExpiresAt }
      );
    } else {
      this.memoryGrants.set(grant.id, {
        ...grant,
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
      });
    }

    await this.logSecurityEvent('token_refreshed', {
      type: 'app',
      id: grant.appId,
    });

    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: grant.refreshToken,
      expiresIn: this.config.accessTokenExpiry,
      scopes: grant.scopes,
    };
  }

  // ============================================
  // AUDIT LOGGING
  // ============================================

  /**
   * Log a security event
   */
  private async logSecurityEvent(
    type: SecurityEventType,
    actor: SecurityActor,
    target?: { type: string; id: string; name?: string },
    details: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.config.enableAuditLog) return;

    const event: SecurityEvent = {
      id: generateId(),
      type,
      timestamp: new Date().toISOString(),
      actor,
      target: target as SecurityEvent['target'],
      details,
      success: true,
    };

    // Store event if database is available
    if (this.dbAdapter) {
      try {
        await this.dbAdapter.insert('security_events', event);
      } catch {
        // Silently fail - audit logging shouldn't break functionality
        console.warn('[DeafAUTH] Failed to log security event');
      }
    }

    // Send to external endpoint if configured
    if (this.config.auditLogEndpoint) {
      try {
        await fetch(this.config.auditLogEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
      } catch {
        // Silently fail
      }
    }
  }
}
