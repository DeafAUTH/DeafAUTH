// Authentication routes
// Handles login, refresh, validate, logout
// Works alongside external auth systems

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getDatabase } from '../db';
import {
  generateAccessToken,
  verifyToken,
  extractBearerToken,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_TTL,
} from '../paseto';

const REFRESH_COOKIE_NAME = 'deafauth_refresh';

export function createAuthRoutes(): Router {
  const router = Router();

  /**
   * POST /auth/login
   * Authenticate user and issue tokens
   * Can integrate with external auth providers
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { username, password, email, external_provider, external_id, tenant_id } = req.body;

      // TODO: Implement actual user authentication
      // This can integrate with external auth providers
      // For now, demo implementation

      if (external_provider && external_id) {
        // External auth provider (Auth0, Okta, etc.)
        // DeafAUTH adds accessibility layer
        const userId = `ext_${external_provider}_${external_id}`;
        
        // Generate tokens
        const accessToken = await generateAccessToken({
          sub: userId,
          tenant_id,
          scope: ['openid', 'profile', 'prefs'],
          external_provider,
        });

        // Create refresh token
        const refreshId = randomUUID();
        const db = getDatabase();
        await db('refresh_tokens').insert({
          id: refreshId,
          user_id: userId,
          tenant_id,
          expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
          created_at: new Date(),
        });

        // Set refresh token cookie
        res.cookie(REFRESH_COOKIE_NAME, refreshId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: REFRESH_TOKEN_TTL * 1000,
          path: '/auth',
        });

        return res.json({
          access_token: accessToken,
          token_type: 'paseto',
          expires_in: ACCESS_TOKEN_TTL,
          scope: 'openid profile prefs',
        });
      }

      // Basic username/password auth
      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      // Demo user check (replace with real authentication)
      if (username !== 'demo' || password !== 'demo') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const userId = `user:${username}`;

      // Generate access token
      const accessToken = await generateAccessToken({
        sub: userId,
        tenant_id,
        scope: ['openid', 'profile', 'prefs'],
      });

      // Create refresh token
      const refreshId = randomUUID();
      const db = getDatabase();
      await db('refresh_tokens').insert({
        id: refreshId,
        user_id: userId,
        tenant_id,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
        created_at: new Date(),
      });

      // Set refresh token cookie
      res.cookie(REFRESH_COOKIE_NAME, refreshId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TTL * 1000,
        path: '/auth',
      });

      res.json({
        access_token: accessToken,
        token_type: 'paseto',
        expires_in: ACCESS_TOKEN_TTL,
        scope: 'openid profile prefs',
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  /**
   * POST /auth/refresh
   * Rotate refresh token and issue new access token
   */
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      const refreshId = req.cookies[REFRESH_COOKIE_NAME];
      
      if (!refreshId) {
        return res.status(401).json({ error: 'No refresh token' });
      }

      const db = getDatabase();
      
      // Find refresh token
      const token = await db('refresh_tokens')
        .where({ id: refreshId })
        .andWhere('expires_at', '>', new Date())
        .first();

      if (!token) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
      }

      // Rotate refresh token (invalidate old, create new)
      await db('refresh_tokens').where({ id: refreshId }).delete();

      const newRefreshId = randomUUID();
      await db('refresh_tokens').insert({
        id: newRefreshId,
        user_id: token.user_id,
        tenant_id: token.tenant_id,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
        created_at: new Date(),
      });

      // Generate new access token
      const accessToken = await generateAccessToken({
        sub: token.user_id,
        tenant_id: token.tenant_id,
        scope: ['openid', 'profile', 'prefs'],
      });

      // Set new refresh token cookie
      res.cookie(REFRESH_COOKIE_NAME, newRefreshId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TOKEN_TTL * 1000,
        path: '/auth',
      });

      res.json({
        access_token: accessToken,
        token_type: 'paseto',
        expires_in: ACCESS_TOKEN_TTL,
      });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  });

  /**
   * GET /auth/validate
   * Validate access token (for Nginx auth_request)
   * Returns 200 with user info or 401
   */
  router.get('/validate', async (req: Request, res: Response) => {
    try {
      const token = extractBearerToken(req.headers.authorization);
      
      if (!token) {
        return res.status(401).end();
      }

      // Verify token
      const payload = await verifyToken(token);

      // TODO: Check token revocation list if needed

      // Return user info for Nginx
      res.status(200).json({
        sub: payload.sub,
        tenant_id: payload.tenant_id,
        scope: payload.scope,
      });
    } catch (error) {
      res.status(401).end();
    }
  });

  /**
   * POST /auth/logout
   * Invalidate refresh token
   */
  router.post('/logout', async (req: Request, res: Response) => {
    try {
      const refreshId = req.cookies[REFRESH_COOKIE_NAME];
      
      if (refreshId) {
        const db = getDatabase();
        await db('refresh_tokens').where({ id: refreshId }).delete();
      }

      // Clear cookie
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/auth' });

      res.json({ success: true, message: 'Logged out' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  });

  return router;
}
