// Consent routes - create, get, revoke consents
import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getDatabase } from '../db';
import { verifyToken, extractBearerToken, generateConsentAttestation } from '../paseto';

export function createConsentRoutes(): Router {
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
   * POST /consents
   * Create consent record and return signed attestation
   * Signed consent becomes the key for PinkSync accessibility
   */
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const { user_id, partner_id, tenant_id, scope, preferences } = req.body;
      const db = getDatabase();

      if (!user_id || !partner_id || !scope) {
        return res.status(400).json({
          error: 'Missing required fields: user_id, partner_id, scope',
        });
      }

      const consentId = randomUUID();
      const now = new Date();

      // Store consent in database
      await db('consents').insert({
        id: consentId,
        user_id,
        partner_id,
        tenant_id,
        scope: JSON.stringify(scope),
        preferences: JSON.stringify(preferences || {}),
        status: 'active',
        created_at: now,
        expires_at: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });

      // Generate signed attestation using PASETO
      // This attestation is the "key" for PinkSync
      const attestation = await generateConsentAttestation({
        consent_id: consentId,
        user_id,
        partner_id,
        tenant_id,
        scope,
        preferences,
        issued_at: now.toISOString(),
        type: 'accessibility_consent',
      });

      res.json({
        consent_id: consentId,
        attestation, // Signed consent key
        status: 'active',
        created_at: now.toISOString(),
        message: 'Consent recorded. Attestation can be used as key for PinkSync.',
      });
    } catch (error) {
      console.error('Create consent error:', error);
      res.status(500).json({ error: 'Failed to create consent' });
    }
  });

  /**
   * GET /consents/:id
   * Get consent record
   */
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDatabase();

      const consent = await db('consents')
        .where({ id })
        .first();

      if (!consent) {
        return res.status(404).json({ error: 'Consent not found' });
      }

      res.json({
        consent_id: consent.id,
        user_id: consent.user_id,
        partner_id: consent.partner_id,
        tenant_id: consent.tenant_id,
        scope: JSON.parse(consent.scope),
        preferences: JSON.parse(consent.preferences),
        status: consent.status,
        created_at: consent.created_at,
        expires_at: consent.expires_at,
        revoked_at: consent.revoked_at,
      });
    } catch (error) {
      console.error('Get consent error:', error);
      res.status(500).json({ error: 'Failed to get consent' });
    }
  });

  /**
   * DELETE /consents/:id
   * Revoke consent
   */
  router.delete('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDatabase();

      const consent = await db('consents')
        .where({ id })
        .first();

      if (!consent) {
        return res.status(404).json({ error: 'Consent not found' });
      }

      // Mark as revoked
      await db('consents')
        .where({ id })
        .update({
          status: 'revoked',
          revoked_at: new Date(),
        });

      res.json({
        success: true,
        consent_id: id,
        status: 'revoked',
        message: 'Consent revoked. Attestation key is now invalid.',
      });
    } catch (error) {
      console.error('Revoke consent error:', error);
      res.status(500).json({ error: 'Failed to revoke consent' });
    }
  });

  /**
   * GET /consents/user/:userId
   * Get all consents for a user
   */
  router.get('/user/:userId', authenticate, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const db = getDatabase();

      const consents = await db('consents')
        .where({ user_id: userId })
        .orderBy('created_at', 'desc');

      res.json({
        user_id: userId,
        consents: consents.map((c: any) => ({
          consent_id: c.id,
          partner_id: c.partner_id,
          tenant_id: c.tenant_id,
          scope: JSON.parse(c.scope),
          status: c.status,
          created_at: c.created_at,
          expires_at: c.expires_at,
        })),
      });
    } catch (error) {
      console.error('Get user consents error:', error);
      res.status(500).json({ error: 'Failed to get user consents' });
    }
  });

  return router;
}
