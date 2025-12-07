// PASETO token utilities for DeafAUTH
// Uses PASETO v4.public for secure, verifiable tokens
// HIPAA-compliant token management

import { V4 } from 'paseto';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Token lifetimes
export const ACCESS_TOKEN_TTL = parseInt(process.env.ACCESS_TOKEN_TTL || '600'); // 10 minutes
export const REFRESH_TOKEN_TTL = parseInt(process.env.REFRESH_TOKEN_TTL || '2592000'); // 30 days

/**
 * PASETO token payload for DeafAUTH
 */
export interface PasetoTokenPayload {
  sub: string; // Subject (user ID)
  iat: number; // Issued at
  exp: number; // Expiration
  iss?: string; // Issuer
  aud?: string; // Audience
  jti?: string; // JWT ID (unique token identifier)
  tenant_id?: string; // Tenant ID for multi-tenant
  scope?: string[]; // Scopes/permissions
  [key: string]: unknown;
}

/**
 * Load PASETO keys from environment or filesystem
 */
function getKeys(): { privateKey: string; publicKey: string } {
  let privateKey: string;
  let publicKey: string;

  // Try to load from environment first
  if (process.env.PASETO_PRIVATE_KEY && process.env.PASETO_PUBLIC_KEY) {
    privateKey = process.env.PASETO_PRIVATE_KEY;
    publicKey = process.env.PASETO_PUBLIC_KEY;
  } else {
    // Fall back to filesystem (development only)
    const keysDir = process.env.PASETO_KEYS_DIR || path.join(__dirname, '../../keys');
    const privatePath = path.join(keysDir, 'paseto_private.pem');
    const publicPath = path.join(keysDir, 'paseto_public.pem');

    try {
      privateKey = fs.readFileSync(privatePath, 'utf8');
      publicKey = fs.readFileSync(publicPath, 'utf8');
    } catch (error) {
      throw new Error(
        'PASETO keys not found. Set PASETO_PRIVATE_KEY and PASETO_PUBLIC_KEY ' +
        'environment variables or create keys in keys/ directory'
      );
    }
  }

  return { privateKey, publicKey };
}

/**
 * Generate PASETO access token
 */
export async function generateAccessToken(payload: Partial<PasetoTokenPayload>): Promise<string> {
  const { privateKey } = getKeys();
  const now = Math.floor(Date.now() / 1000);

  const fullPayload: PasetoTokenPayload = {
    sub: payload.sub || '',
    iat: now,
    exp: now + ACCESS_TOKEN_TTL,
    iss: process.env.PASETO_ISSUER || 'deafauth.io',
    jti: randomUUID(),
    ...payload,
  };

  const token = await V4.sign(fullPayload, privateKey, {
    footer: JSON.stringify({ kid: process.env.PASETO_KEY_ID || 'key-1' }),
  });

  return token;
}

/**
 * Verify PASETO token
 */
export async function verifyToken(token: string): Promise<PasetoTokenPayload> {
  const { publicKey } = getKeys();

  try {
    const payload = await V4.verify(token, publicKey);
    return payload as PasetoTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate signed consent attestation
 * Uses PASETO to sign consent records for PinkSync
 */
export async function generateConsentAttestation(consent: Record<string, unknown>): Promise<string> {
  const { privateKey } = getKeys();
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    ...consent,
    iat: now,
    iss: process.env.PASETO_ISSUER || 'deafauth.io',
    type: 'consent_attestation',
  };

  const attestation = await V4.sign(payload, privateKey, {
    footer: JSON.stringify({ type: 'consent', kid: process.env.PASETO_KEY_ID || 'key-1' }),
  });

  return attestation;
}

/**
 * Verify consent attestation
 */
export async function verifyConsentAttestation(attestation: string): Promise<Record<string, unknown>> {
  const { publicKey } = getKeys();

  try {
    const payload = await V4.verify(attestation, publicKey);
    return payload as Record<string, unknown>;
  } catch (error) {
    throw new Error('Invalid consent attestation');
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}
