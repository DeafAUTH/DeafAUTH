// DeafAUTH Security Module - Type Definitions
// Security types for third-party access control, API keys, and OAuth2 scopes

// ============================================
// API KEY TYPES
// ============================================

/**
 * API Key status
 */
export type ApiKeyStatus = 'active' | 'revoked' | 'expired' | 'suspended';

/**
 * API Key information
 */
export interface ApiKey {
  id: string;
  key: string;
  name: string;
  description?: string;
  clientId: string;
  scopes: string[];
  status: ApiKeyStatus;
  createdAt: string;
  expiresAt?: string;
  lastUsedAt?: string;
  rateLimit?: RateLimitConfig;
  metadata?: Record<string, unknown>;
  
  // Index signature for compatibility
  [key: string]: unknown;
}

/**
 * API Key creation parameters
 */
export interface CreateApiKeyParams {
  name: string;
  description?: string;
  clientId: string;
  scopes: string[];
  expiresIn?: number; // seconds
  rateLimit?: RateLimitConfig;
  metadata?: Record<string, unknown>;
}

/**
 * API Key validation result
 */
export interface ApiKeyValidationResult {
  valid: boolean;
  key?: ApiKey;
  error?: string;
  remainingQuota?: number;
}

// ============================================
// OAUTH2 SCOPES TYPES
// ============================================

/**
 * OAuth2 scope definition
 */
export interface OAuth2Scope {
  name: string;
  description: string;
  category: ScopeCategory;
  permissions: Permission[];
  requiresConsent: boolean;
  sensitivityLevel: SensitivityLevel;
}

/**
 * Scope categories for organization
 */
export type ScopeCategory = 
  | 'profile'      // User profile access
  | 'identity'     // Deaf identity verification
  | 'preferences'  // Accessibility preferences
  | 'validation'   // Community validation
  | 'admin'        // Administrative access
  | 'readonly'     // Read-only access
  | 'write';       // Write access

/**
 * Sensitivity level for scopes
 */
export type SensitivityLevel = 'public' | 'protected' | 'sensitive' | 'restricted';

/**
 * Individual permission within a scope
 */
export interface Permission {
  resource: string;
  action: PermissionAction;
  conditions?: PermissionCondition[];
}

/**
 * Permission actions
 */
export type PermissionAction = 'read' | 'write' | 'delete' | 'admin' | '*';

/**
 * Conditional permission restrictions
 */
export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'lt' | 'gte' | 'lte';
  value: unknown;
}

// ============================================
// ACCESS CONTROL TYPES
// ============================================

/**
 * Third-party application registration
 */
export interface ThirdPartyApp {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  clientSecret: string;
  redirectUris: string[];
  allowedScopes: string[];
  status: AppStatus;
  createdAt: string;
  updatedAt?: string;
  ownerId: string;
  webhookUrl?: string;
  metadata?: Record<string, unknown>;
  
  // Index signature for compatibility
  [key: string]: unknown;
}

/**
 * App registration status
 */
export type AppStatus = 'pending' | 'approved' | 'suspended' | 'revoked';

/**
 * Access grant for user-app authorization
 */
export interface AccessGrant {
  id: string;
  userId: string;
  appId: string;
  scopes: string[];
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  refreshToken?: string;
  accessToken?: string;
  
  // Index signature for compatibility
  [key: string]: unknown;
}

/**
 * Authorization request from third-party app
 */
export interface AuthorizationRequest {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  responseType: 'code' | 'token';
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
}

/**
 * Authorization response
 */
export interface AuthorizationResponse {
  success: boolean;
  code?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  scopes?: string[];
  error?: string;
  errorDescription?: string;
}

// ============================================
// RATE LIMITING TYPES
// ============================================

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number;       // Time window in milliseconds
  maxRequests: number;    // Max requests per window
  keyPrefix?: string;     // Prefix for rate limit keys
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
}

/**
 * Rate limit info for a request
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

// ============================================
// SECURITY EVENT TYPES
// ============================================

/**
 * Security event for auditing
 */
export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  timestamp: string;
  actor: SecurityActor;
  target?: SecurityTarget;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  
  // Index signature for Record<string, unknown> compatibility
  [key: string]: unknown;
}

/**
 * Types of security events
 */
export type SecurityEventType = 
  | 'api_key_created'
  | 'api_key_revoked'
  | 'api_key_used'
  | 'app_registered'
  | 'app_approved'
  | 'app_suspended'
  | 'access_granted'
  | 'access_revoked'
  | 'token_issued'
  | 'token_refreshed'
  | 'token_revoked'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'scope_violation';

/**
 * Actor performing security action
 */
export interface SecurityActor {
  type: 'user' | 'app' | 'system';
  id: string;
  name?: string;
}

/**
 * Target of security action
 */
export interface SecurityTarget {
  type: 'user' | 'app' | 'api_key' | 'resource';
  id: string;
  name?: string;
}

// ============================================
// SECURITY CONFIGURATION
// ============================================

/**
 * Token format options
 */
export type TokenFormat = 'paseto' | 'jwt';

/**
 * Security module configuration
 */
export interface SecurityConfig {
  // API Key settings
  apiKeyPrefix?: string;
  apiKeyLength?: number;
  defaultApiKeyExpiry?: number; // seconds
  
  // Token settings
  tokenFormat?: TokenFormat;     // 'paseto' (default) or 'jwt'
  tokenSecretKey?: string;       // Secret key for token signing/encryption
  tokenIssuer?: string;          // Token issuer claim
  
  // OAuth2 settings
  accessTokenExpiry?: number;   // seconds
  refreshTokenExpiry?: number;  // seconds
  authCodeExpiry?: number;      // seconds
  
  // Rate limiting defaults
  defaultRateLimit?: RateLimitConfig;
  
  // Security features
  enableAuditLog?: boolean;
  enableRateLimiting?: boolean;
  requireHttps?: boolean;
  
  // Endpoints
  auditLogEndpoint?: string;
}
