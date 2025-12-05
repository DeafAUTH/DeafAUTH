// DeafAUTH PASETO Token Support
// Platform-Agnostic Security Tokens for Deaf-first authentication
// Reference: https://github.com/paragonie/paseto
// Implementation aligned with mbtq-dev/templates/deafauth blueprint

/**
 * PASETO Token Types
 * DeafAUTH uses local tokens (symmetric encryption) by default
 * for server-side authentication like the Flask blueprint
 */
export type PasetoVersion = 'v3' | 'v4';
export type PasetoPurpose = 'local' | 'public';

/**
 * PASETO Token Payload for DeafAUTH
 * Follows the blueprint structure for Deaf-first authentication
 */
export interface PasetoPayload {
  /** Subject - the user ID */
  sub: string;
  /** Issued at timestamp (ISO 8601) */
  iat: string;
  /** Expiration timestamp (ISO 8601) */
  exp: string;
  /** Issuer - DeafAUTH instance identifier */
  iss?: string;
  /** Audience - intended recipient */
  aud?: string;
  /** User email */
  email?: string;
  /** User name */
  name?: string;
  /** Deaf status for quick access checks */
  deafStatus?: 'deaf' | 'hard-of-hearing' | 'coda' | 'hearing' | 'unspecified';
  /** Whether identity is validated */
  validated?: boolean;
  /** PinkSync enabled flag */
  pinkSyncEnabled?: boolean;
  /** Additional custom claims */
  [key: string]: unknown;
}

/**
 * PASETO Token Options
 */
export interface PasetoOptions {
  /** Token version (v3 or v4, default: v4) */
  version?: PasetoVersion;
  /** Token purpose (local or public, default: local) */
  purpose?: PasetoPurpose;
  /** Token expiration in seconds (default: 3600 = 1 hour) */
  expiresIn?: number;
  /** Issuer identifier */
  issuer?: string;
  /** Audience identifier */
  audience?: string;
}

/**
 * Result from token operations
 */
export interface TokenResult {
  success: boolean;
  token?: string;
  payload?: PasetoPayload;
  error?: string;
}

/**
 * Default PASETO configuration for DeafAUTH
 */
export const DEFAULT_PASETO_OPTIONS: Required<Pick<PasetoOptions, 'version' | 'purpose' | 'expiresIn'>> = {
  version: 'v4',
  purpose: 'local',
  expiresIn: 3600, // 1 hour
};

/**
 * PASETO Token Handler for DeafAUTH
 * 
 * Provides PASETO token generation and verification following the
 * mbtq-dev/templates/deafauth blueprint pattern.
 * 
 * Note: This is an interface definition. The actual implementation
 * requires the 'paseto' npm package to be installed. Use createMockPasetoHandler()
 * factory function for testing/development.
 * 
 * @example
 * ```typescript
 * // Using the PASETO adapter with DeafAUTH
 * import { createMockPasetoHandler } from '@/lib/deafauth-core/paseto';
 * 
 * const paseto = createMockPasetoHandler({
 *   issuer: 'deafauth.example.com',
 * });
 * 
 * // Generate token for authenticated user
 * const tokenResult = await paseto.generateToken({
 *   sub: user.id,
 *   email: user.email,
 *   deafStatus: profile.deafStatus,
 *   validated: profile.validated,
 * });
 * 
 * // Access the token
 * if (tokenResult.success) {
 *   console.log('Token:', tokenResult.token);
 * }
 * 
 * // Verify token on protected routes
 * const verifyResult = await paseto.verifyToken(token);
 * ```
 */
export interface PasetoHandler {
  /**
   * Generate a PASETO token for a user
   */
  generateToken(
    claims: Omit<PasetoPayload, 'iat' | 'exp'>,
    options?: Partial<PasetoOptions>
  ): Promise<TokenResult>;

  /**
   * Verify and decode a PASETO token
   */
  verifyToken(token: string): Promise<TokenResult>;

  /**
   * Refresh a token (generates new token with extended expiration)
   */
  refreshToken(token: string, options?: Partial<PasetoOptions>): Promise<TokenResult>;
}

/**
 * Configuration for creating a PASETO handler
 */
export interface PasetoHandlerConfig {
  /** 
   * Secret key for local tokens (32 bytes for v4.local)
   * Should be stored in environment variables
   */
  secretKey?: string;
  /** 
   * Private key for public tokens (Ed25519 for v4.public)
   */
  privateKey?: string;
  /** 
   * Public key for verifying public tokens
   */
  publicKey?: string;
  /** Issuer identifier */
  issuer?: string;
  /** Audience identifier */
  audience?: string;
  /** Default token options */
  defaultOptions?: PasetoOptions;
}

/**
 * Create a mock PASETO handler for testing/development.
 * 
 * ⚠️ **WARNING: THIS MOCK HANDLER PROVIDES NO CRYPTOGRAPHIC SECURITY.**
 * 
 * This implementation uses simple base64-encoded JSON instead of actual PASETO encryption.
 * 
 * **NEVER USE THIS FUNCTION IN PRODUCTION ENVIRONMENTS.**
 * Doing so will expose your application to severe security vulnerabilities.
 * 
 * For production use, install the `paseto` npm package and implement a real
 * PASETO handler following the specification at https://github.com/paseto-standard/paseto-spec
 */
export function createMockPasetoHandler(config: PasetoHandlerConfig = {}): PasetoHandler {
  const defaultOptions = {
    ...DEFAULT_PASETO_OPTIONS,
    ...config.defaultOptions,
    issuer: config.issuer,
    audience: config.audience,
  };

  return {
    async generateToken(
      claims: Omit<PasetoPayload, 'iat' | 'exp'>,
      options?: Partial<PasetoOptions>
    ): Promise<TokenResult> {
      try {
        const now = new Date();
        const expiresIn = options?.expiresIn ?? defaultOptions.expiresIn;
        const expiration = new Date(now.getTime() + expiresIn * 1000);

        const payload: PasetoPayload = {
          ...claims,
          iat: now.toISOString(),
          exp: expiration.toISOString(),
          iss: options?.issuer ?? defaultOptions.issuer,
          aud: options?.audience ?? defaultOptions.audience,
        };

        // Mock token format: v4.local.{base64(payload)}
        const version = options?.version ?? defaultOptions.version;
        const purpose = options?.purpose ?? defaultOptions.purpose;
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const token = `${version}.${purpose}.mock.${encodedPayload}`;

        return { success: true, token, payload };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Token generation failed',
        };
      }
    },

    async verifyToken(token: string): Promise<TokenResult> {
      try {
        // Parse mock token format
        const parts = token.split('.');
        if (parts.length !== 4 || parts[2] !== 'mock') {
          return { success: false, error: 'Invalid token format' };
        }

        const encodedPayload = parts[3];
        const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString()) as PasetoPayload;

        // Check expiration
        const exp = new Date(payload.exp);
        if (exp < new Date()) {
          return { success: false, error: 'Token expired' };
        }

        return { success: true, payload };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Token verification failed',
        };
      }
    },

    async refreshToken(token: string, options?: Partial<PasetoOptions>): Promise<TokenResult> {
      const verifyResult = await this.verifyToken(token);
      if (!verifyResult.success || !verifyResult.payload) {
        return verifyResult;
      }

      // Generate new token with same claims but new expiration
      // Extract claims excluding iat and exp (they will be regenerated)
      const payload = verifyResult.payload;
      const claims: Omit<PasetoPayload, 'iat' | 'exp'> = {
        sub: payload.sub,
        iss: payload.iss,
        aud: payload.aud,
        email: payload.email,
        name: payload.name,
        deafStatus: payload.deafStatus,
        validated: payload.validated,
        pinkSyncEnabled: payload.pinkSyncEnabled,
      };
      return this.generateToken(claims, options);
    },
  };
}

/**
 * Type guard for PASETO payload
 */
export function isPasetoPayload(value: unknown): value is PasetoPayload {
  if (!value || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.sub === 'string' &&
    typeof obj.iat === 'string' &&
    typeof obj.exp === 'string'
  );
}

/**
 * Utility to check if a token is expired based on payload
 */
export function isTokenExpired(payload: PasetoPayload): boolean {
  const exp = new Date(payload.exp);
  return exp < new Date();
}

/**
 * Utility to get remaining token lifetime in seconds
 */
export function getTokenLifetime(payload: PasetoPayload): number {
  const exp = new Date(payload.exp);
  const now = new Date();
  return Math.max(0, Math.floor((exp.getTime() - now.getTime()) / 1000));
}
