// Tenant routes - multi-tenant management
import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { getDatabase } from '../db';
import { verifyToken, extractBearerToken } from '../paseto';

export function createTenantRoutes(): Router {
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
   * POST /tenants
   * Create new tenant (organization, company, startup, or individual)
   */
  router.post('/', authenticate, async (req: Request, res: Response) => {
    try {
      const { name, type, plan, domain } = req.body;
      const db = getDatabase();

      if (!name || !type) {
        return res.status(400).json({
          error: 'Missing required fields: name, type',
        });
      }

      // Determine plan based on type
      let finalPlan = plan;
      if (!finalPlan) {
        finalPlan = type === 'individual' ? 'free' : 'starter';
      }

      // Determine user limit based on plan
      const userLimits: Record<string, number> = {
        free: 1,
        starter: 10,
        business: 100,
        enterprise: -1, // Unlimited
      };
      const userLimit = type === 'individual' ? 1 : userLimits[finalPlan];

      const tenantId = randomUUID();
      await db('tenants').insert({
        id: tenantId,
        name,
        type,
        plan: finalPlan,
        domain,
        user_limit: userLimit,
        current_users: 0,
        active: true,
        created_at: new Date(),
      });

      res.json({
        tenant_id: tenantId,
        name,
        type,
        plan: finalPlan,
        user_limit: userLimit,
        message: type === 'individual' 
          ? 'Individual tenant created with free plan'
          : 'Organization tenant created',
      });
    } catch (error) {
      console.error('Create tenant error:', error);
      res.status(500).json({ error: 'Failed to create tenant' });
    }
  });

  /**
   * GET /tenants/:id
   * Get tenant information
   */
  router.get('/:id', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDatabase();

      const tenant = await db('tenants')
        .where({ id })
        .first();

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      res.json({
        tenant_id: tenant.id,
        name: tenant.name,
        type: tenant.type,
        plan: tenant.plan,
        domain: tenant.domain,
        user_limit: tenant.user_limit,
        current_users: tenant.current_users,
        active: tenant.active,
        created_at: tenant.created_at,
      });
    } catch (error) {
      console.error('Get tenant error:', error);
      res.status(500).json({ error: 'Failed to get tenant' });
    }
  });

  /**
   * GET /tenants/:id/users
   * Get all users in a tenant
   */
  router.get('/:id/users', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const db = getDatabase();

      const users = await db('tenant_users')
        .where({ tenant_id: id })
        .join('users', 'tenant_users.user_id', 'users.id')
        .select('users.id', 'users.email', 'users.name', 'tenant_users.role', 'tenant_users.joined_at');

      res.json({
        tenant_id: id,
        users,
      });
    } catch (error) {
      console.error('Get tenant users error:', error);
      res.status(500).json({ error: 'Failed to get tenant users' });
    }
  });

  /**
   * POST /tenants/:id/users
   * Add user to tenant
   */
  router.post('/:id/users', authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { user_id, role } = req.body;
      const db = getDatabase();

      if (!user_id) {
        return res.status(400).json({ error: 'Missing user_id' });
      }

      // Check tenant user limit
      const tenant = await db('tenants').where({ id }).first();
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      if (tenant.user_limit !== -1 && tenant.current_users >= tenant.user_limit) {
        return res.status(403).json({
          error: 'Tenant user limit reached',
          limit: tenant.user_limit,
        });
      }

      // Add user to tenant
      await db('tenant_users').insert({
        tenant_id: id,
        user_id,
        role: role || 'member',
        joined_at: new Date(),
        active: true,
      });

      // Update user count
      await db('tenants')
        .where({ id })
        .increment('current_users', 1);

      res.json({
        success: true,
        tenant_id: id,
        user_id,
        role: role || 'member',
      });
    } catch (error) {
      console.error('Add tenant user error:', error);
      res.status(500).json({ error: 'Failed to add user to tenant' });
    }
  });

  return router;
}
