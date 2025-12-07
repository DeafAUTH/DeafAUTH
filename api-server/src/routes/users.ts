// User routes - preferences and profiles
import { Router, Request, Response } from 'express';
import { getDatabase } from '../db';
import { verifyToken, extractBearerToken } from '../paseto';

export function createUserRoutes(): Router {
  const router = Router();

  /**
   * Middleware to authenticate requests
   */
  async function authenticate(req: Request, res: Response, next: Function) {
    try {
      const token = extractBearerToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const payload = await verifyToken(token);
      (req as any).user = payload;
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  }

  /**
   * GET /users/:id/prefs
   * Get user accessibility preferences
   */
  router.get('/:id/prefs', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDatabase();

      const prefs = await db('user_preferences')
        .where({ user_id: id })
        .first();

      if (!prefs) {
        return res.status(404).json({ error: 'Preferences not found' });
      }

      res.json({
        user_id: prefs.user_id,
        preferences: prefs.preferences,
        updated_at: prefs.updated_at,
      });
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({ error: 'Failed to get preferences' });
    }
  });

  /**
   * PUT /users/:id/prefs
   * Update user accessibility preferences
   */
  router.put('/:id/prefs', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { preferences } = req.body;
      const db = getDatabase();

      // Check if preferences exist
      const existing = await db('user_preferences')
        .where({ user_id: id })
        .first();

      if (existing) {
        // Update
        await db('user_preferences')
          .where({ user_id: id })
          .update({
            preferences: JSON.stringify(preferences),
            updated_at: new Date(),
          });
      } else {
        // Insert
        await db('user_preferences').insert({
          user_id: id,
          preferences: JSON.stringify(preferences),
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      res.json({
        success: true,
        user_id: id,
        preferences,
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  });

  /**
   * GET /users/:id/profile
   * Get user profile
   */
  router.get('/:id/profile', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDatabase();

      const profile = await db('users')
        .where({ id })
        .first();

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      // Don't expose sensitive data
      const { password_hash, ...safeProfile } = profile;

      res.json(safeProfile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  });

  return router;
}
