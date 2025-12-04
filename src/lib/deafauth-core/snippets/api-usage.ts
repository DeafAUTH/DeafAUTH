// DeafAUTH API Usage Snippets
// Examples of using DeafAUTH as a third-party developer

/**
 * API Client for Third-Party Integration
 * 
 * A complete API client for integrating with DeafAUTH.
 */
export const API_CLIENT = `
// deafauth-client.ts
interface DeafAuthConfig {
  baseUrl: string;
  clientId: string;
  clientSecret?: string;
  apiKey?: string;
}

interface DeafProfile {
  userId: string;
  email?: string;
  name?: string;
  deafStatus: string;
  preferredLanguage: string;
  communicationPreference: string;
  accessibilityNeeds: string[];
  validated: boolean;
  reputation: number;
}

interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  scopes: string[];
}

/**
 * DeafAUTH API Client
 * 
 * A client library for third-party apps to integrate with DeafAUTH.
 * 
 * @example
 * \`\`\`typescript
 * const client = new DeafAuthClient({
 *   baseUrl: 'https://api.deafauth.io',
 *   clientId: 'your_client_id',
 *   clientSecret: 'your_client_secret',
 * });
 * 
 * // OAuth2 Authorization Code Flow
 * const authUrl = client.getAuthorizationUrl({
 *   redirectUri: 'https://yourapp.com/callback',
 *   scopes: ['profile:read', 'preferences:read'],
 *   state: 'random_state_value',
 * });
 * 
 * // After user authorizes, exchange code for tokens
 * const tokens = await client.exchangeCode({
 *   code: 'authorization_code',
 *   redirectUri: 'https://yourapp.com/callback',
 * });
 * 
 * // Use access token to get user profile
 * const profile = await client.getProfile(tokens.accessToken);
 * \`\`\`
 */
class DeafAuthClient {
  private config: DeafAuthConfig;
  private accessToken?: string;

  constructor(config: DeafAuthConfig) {
    this.config = config;
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthorizationUrl(params: {
    redirectUri: string;
    scopes: string[];
    state: string;
    codeChallenge?: string;
  }): string {
    const url = new URL(\`\${this.config.baseUrl}/oauth/authorize\`);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', params.redirectUri);
    url.searchParams.set('scope', params.scopes.join(' '));
    url.searchParams.set('state', params.state);
    url.searchParams.set('response_type', 'code');
    
    if (params.codeChallenge) {
      url.searchParams.set('code_challenge', params.codeChallenge);
      url.searchParams.set('code_challenge_method', 'S256');
    }

    return url.toString();
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCode(params: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<AuthResponse> {
    const response = await this.request('/oauth/token', {
      method: 'POST',
      body: {
        grant_type: 'authorization_code',
        code: params.code,
        redirect_uri: params.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code_verifier: params.codeVerifier,
      },
    });

    if (response.accessToken) {
      this.accessToken = response.accessToken;
    }

    return response;
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.request('/oauth/token', {
      method: 'POST',
      body: {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      },
    });

    if (response.accessToken) {
      this.accessToken = response.accessToken;
    }

    return response;
  }

  /**
   * Get user's DeafAUTH profile
   */
  async getProfile(accessToken?: string): Promise<DeafProfile> {
    const token = accessToken || this.accessToken;
    if (!token) {
      throw new Error('Access token required');
    }

    const response = await this.request('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: \`Bearer \${token}\`,
      },
    });

    return response.deafProfile;
  }

  /**
   * Check if user has verified Deaf identity
   */
  async isValidated(accessToken?: string): Promise<boolean> {
    const profile = await this.getProfile(accessToken);
    return profile.validated;
  }

  /**
   * Get user's accessibility preferences
   */
  async getAccessibilityPreferences(accessToken?: string): Promise<{
    preferredLanguage: string;
    communicationPreference: string;
    accessibilityNeeds: string[];
  }> {
    const profile = await this.getProfile(accessToken);
    return {
      preferredLanguage: profile.preferredLanguage,
      communicationPreference: profile.communicationPreference,
      accessibilityNeeds: profile.accessibilityNeeds,
    };
  }

  /**
   * Make API request
   */
  private async request(
    endpoint: string,
    options: {
      method: string;
      headers?: Record<string, string>;
      body?: Record<string, unknown>;
    }
  ): Promise<any> {
    const url = \`\${this.config.baseUrl}\${endpoint}\`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add API key if configured
    if (this.config.apiKey) {
      headers['X-API-Key'] = this.config.apiKey;
    }

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  }
}

export { DeafAuthClient, DeafAuthConfig, DeafProfile, AuthResponse };
`;

/**
 * API Key Usage Example
 */
export const API_KEY_USAGE = `
// Using DeafAUTH with API Key
// For server-to-server integrations

const API_KEY = process.env.DEAFAUTH_API_KEY; // Your API key
const BASE_URL = 'https://api.deafauth.io';

/**
 * Fetch user profile using API key
 */
async function getUserProfile(userId: string): Promise<any> {
  const response = await fetch(\`\${BASE_URL}/api/v1/users/\${userId}/profile\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch profile');
  }

  return response.json();
}

/**
 * Validate a user's Deaf identity status
 */
async function validateDeafIdentity(userId: string): Promise<{
  validated: boolean;
  deafStatus: string;
}> {
  const response = await fetch(\`\${BASE_URL}/api/v1/users/\${userId}/validation\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to validate identity');
  }

  return response.json();
}

/**
 * Get user's accessibility requirements for your app
 */
async function getAccessibilityRequirements(userId: string): Promise<{
  needsCaptions: boolean;
  needsInterpreter: boolean;
  preferredLanguage: string;
  visualAlerts: boolean;
}> {
  const profile = await getUserProfile(userId);
  const needs = profile.accessibilityNeeds || [];

  return {
    needsCaptions: needs.includes('captions'),
    needsInterpreter: needs.includes('sign-interpreter'),
    preferredLanguage: profile.preferredLanguage || 'ASL',
    visualAlerts: needs.includes('visual-alerts'),
  };
}

// Example usage
async function main() {
  try {
    const userId = 'user_abc123';
    
    // Check if user has verified Deaf identity
    const validation = await validateDeafIdentity(userId);
    console.log('User validated:', validation.validated);
    console.log('Deaf status:', validation.deafStatus);

    // Get accessibility requirements
    const requirements = await getAccessibilityRequirements(userId);
    console.log('Accessibility requirements:', requirements);

    // Adapt your app based on requirements
    if (requirements.needsCaptions) {
      console.log('Enable captions for video content');
    }
    if (requirements.needsInterpreter) {
      console.log('Offer sign language interpreter option');
    }
    if (requirements.visualAlerts) {
      console.log('Use visual alerts instead of audio');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
`;

/**
 * OAuth2 Flow Examples
 */
export const OAUTH2_FLOWS = `
// OAuth2 Authorization Code Flow with PKCE
// Recommended for web and mobile apps

import crypto from 'crypto';

const CLIENT_ID = process.env.DEAFAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.DEAFAUTH_CLIENT_SECRET!;
const REDIRECT_URI = 'https://yourapp.com/auth/callback';
const AUTH_URL = 'https://deafauth.io/oauth/authorize';
const TOKEN_URL = 'https://api.deafauth.io/oauth/token';

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');

  return { verifier, challenge };
}

/**
 * Start the OAuth flow - redirect user to authorization URL
 */
function startOAuthFlow(scopes: string[]): { url: string; state: string; codeVerifier: string } {
  const { verifier, challenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString('hex');

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: scopes.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  return {
    url: \`\${AUTH_URL}?\${params}\`,
    state,
    codeVerifier: verifier,
  };
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
async function handleOAuthCallback(
  code: string,
  codeVerifier: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Token exchange failed');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh access token when expired
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error_description || 'Token refresh failed');
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresIn: data.expires_in,
  };
}

// Express.js route handlers example
/*
const express = require('express');
const router = express.Router();

// Store code verifiers in session (use a proper session store in production)
const sessions = new Map();

// Start OAuth flow
router.get('/login', (req, res) => {
  const { url, state, codeVerifier } = startOAuthFlow([
    'profile:read',
    'preferences:read',
  ]);
  
  // Store state and verifier in session
  sessions.set(state, { codeVerifier });
  
  res.redirect(url);
});

// OAuth callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error });
  }

  const session = sessions.get(state);
  if (!session) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  try {
    const tokens = await handleOAuthCallback(code, session.codeVerifier);
    sessions.delete(state);

    // Store tokens securely (use httpOnly cookies or secure session)
    req.session.tokens = tokens;
    
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
*/
`;

/**
 * Webhook Integration Example
 */
export const WEBHOOK_INTEGRATION = `
// DeafAUTH Webhook Integration
// Receive real-time updates about user profile changes

import crypto from 'crypto';
import express from 'express';

const WEBHOOK_SECRET = process.env.DEAFAUTH_WEBHOOK_SECRET!;

interface WebhookPayload {
  id: string;
  type: string;
  timestamp: string;
  data: {
    userId: string;
    changes?: Record<string, { old: unknown; new: unknown }>;
    [key: string]: unknown;
  };
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express webhook handler
const app = express();

app.post('/webhooks/deafauth', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-deafauth-signature'] as string;
  const payload = req.body.toString();

  // Verify signature
  if (!verifyWebhookSignature(payload, signature, WEBHOOK_SECRET)) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Invalid signature');
  }

  const event: WebhookPayload = JSON.parse(payload);
  console.log('Received webhook:', event.type);

  // Handle different event types
  switch (event.type) {
    case 'profile.updated':
      handleProfileUpdated(event);
      break;

    case 'validation.completed':
      handleValidationCompleted(event);
      break;

    case 'preferences.changed':
      handlePreferencesChanged(event);
      break;

    case 'access.revoked':
      handleAccessRevoked(event);
      break;

    default:
      console.log('Unhandled event type:', event.type);
  }

  res.status(200).send('OK');
});

function handleProfileUpdated(event: WebhookPayload) {
  const { userId, changes } = event.data;
  console.log(\`Profile updated for user \${userId}\`);
  console.log('Changes:', changes);

  // Update your local cache or database
  // Notify relevant parts of your application
}

function handleValidationCompleted(event: WebhookPayload) {
  const { userId, deafStatus, validated } = event.data;
  console.log(\`Validation completed for user \${userId}\`);
  console.log(\`Status: \${deafStatus}, Validated: \${validated}\`);

  // Update user's access level in your app
  // Send notification to user
}

function handlePreferencesChanged(event: WebhookPayload) {
  const { userId, changes } = event.data;
  console.log(\`Preferences changed for user \${userId}\`);

  // Update accessibility settings in your app
  // Re-render UI components if necessary
}

function handleAccessRevoked(event: WebhookPayload) {
  const { userId } = event.data;
  console.log(\`Access revoked for user \${userId}\`);

  // Clear user session
  // Remove cached user data
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
`;
