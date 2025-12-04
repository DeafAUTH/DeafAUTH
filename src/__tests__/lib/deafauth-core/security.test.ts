import { ApiKeyManager } from '../../../lib/deafauth-core/security/api-key-manager';
import { ScopeManager, DEFAULT_SCOPES } from '../../../lib/deafauth-core/security/oauth2-scopes';
import { RateLimiter, RATE_LIMIT_PRESETS } from '../../../lib/deafauth-core/security/rate-limiter';

describe('ApiKeyManager', () => {
  let apiKeyManager: ApiKeyManager;

  beforeEach(() => {
    apiKeyManager = new ApiKeyManager(null, {
      apiKeyPrefix: 'test_',
      apiKeyLength: 32,
    });
  });

  describe('createApiKey', () => {
    it('should create a new API key', async () => {
      const { key, apiKey } = await apiKeyManager.createApiKey({
        name: 'Test Key',
        clientId: 'client_123',
        scopes: ['profile:read'],
      });

      expect(key).toBeDefined();
      expect(key.startsWith('test_')).toBe(true);
      expect(apiKey.name).toBe('Test Key');
      expect(apiKey.clientId).toBe('client_123');
      expect(apiKey.scopes).toEqual(['profile:read']);
      expect(apiKey.status).toBe('active');
    });

    it('should create API key with expiration', async () => {
      const { apiKey } = await apiKeyManager.createApiKey({
        name: 'Expiring Key',
        clientId: 'client_123',
        scopes: ['profile:read'],
        expiresIn: 3600, // 1 hour
      });

      expect(apiKey.expiresAt).toBeDefined();
      const expiresAt = new Date(apiKey.expiresAt!);
      const now = new Date();
      expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('validateApiKey', () => {
    it('should validate a valid API key', async () => {
      const { key } = await apiKeyManager.createApiKey({
        name: 'Valid Key',
        clientId: 'client_123',
        scopes: ['profile:read'],
      });

      const result = await apiKeyManager.validateApiKey(key);

      expect(result.valid).toBe(true);
      expect(result.key).toBeDefined();
      expect(result.key!.name).toBe('Valid Key');
    });

    it('should reject invalid API key format', async () => {
      const result = await apiKeyManager.validateApiKey('invalid_key');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid API key format');
    });

    it('should reject unknown API key', async () => {
      const result = await apiKeyManager.validateApiKey('test_unknownkey123456789012345678');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key not found');
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke an API key', async () => {
      const { key, apiKey } = await apiKeyManager.createApiKey({
        name: 'Revokable Key',
        clientId: 'client_123',
        scopes: ['profile:read'],
      });

      await apiKeyManager.revokeApiKey(apiKey.id);

      const result = await apiKeyManager.validateApiKey(key);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('API key is revoked');
    });
  });

  describe('hasScopes', () => {
    it('should check required scopes', async () => {
      const { apiKey } = await apiKeyManager.createApiKey({
        name: 'Scoped Key',
        clientId: 'client_123',
        scopes: ['profile:read', 'preferences:write'],
      });

      expect(apiKeyManager.hasScopes(apiKey, ['profile:read'])).toBe(true);
      expect(apiKeyManager.hasScopes(apiKey, ['profile:read', 'preferences:write'])).toBe(true);
      expect(apiKeyManager.hasScopes(apiKey, ['admin:write'])).toBe(false);
    });

    it('should handle wildcard scopes', async () => {
      const { apiKey } = await apiKeyManager.createApiKey({
        name: 'Wildcard Key',
        clientId: 'client_123',
        scopes: ['profile:*'],
      });

      expect(apiKeyManager.hasScopes(apiKey, ['profile:read'])).toBe(true);
      expect(apiKeyManager.hasScopes(apiKey, ['profile:write'])).toBe(true);
      expect(apiKeyManager.hasScopes(apiKey, ['preferences:read'])).toBe(false);
    });
  });
});

describe('ScopeManager', () => {
  let scopeManager: ScopeManager;

  beforeEach(() => {
    scopeManager = new ScopeManager();
  });

  describe('getScope', () => {
    it('should return scope definition', () => {
      const scope = scopeManager.getScope('profile:read');

      expect(scope).toBeDefined();
      expect(scope!.name).toBe('profile:read');
      expect(scope!.category).toBe('profile');
    });

    it('should return undefined for unknown scope', () => {
      const scope = scopeManager.getScope('unknown:scope');

      expect(scope).toBeUndefined();
    });
  });

  describe('validateScopes', () => {
    it('should validate valid scopes', () => {
      const result = scopeManager.validateScopes(['profile:read', 'preferences:read']);

      expect(result.valid).toBe(true);
      expect(result.invalidScopes).toHaveLength(0);
    });

    it('should detect invalid scopes', () => {
      const result = scopeManager.validateScopes(['profile:read', 'invalid:scope']);

      expect(result.valid).toBe(false);
      expect(result.invalidScopes).toContain('invalid:scope');
    });

    it('should identify sensitive scopes', () => {
      const result = scopeManager.validateScopes(['identity:read', 'validation:read']);

      expect(result.sensitiveScopes).toContain('identity:read');
      expect(result.sensitiveScopes).toContain('validation:read');
    });
  });

  describe('hasPermission', () => {
    it('should check permissions correctly', () => {
      const scopes = ['profile:read'];

      expect(scopeManager.hasPermission(scopes, 'profile', 'read')).toBe(true);
      expect(scopeManager.hasPermission(scopes, 'profile', 'write')).toBe(false);
    });

    it('should handle admin wildcard permissions', () => {
      const scopes = ['admin:write'];

      expect(scopeManager.hasPermission(scopes, 'profile', 'read')).toBe(true);
      expect(scopeManager.hasPermission(scopes, 'any-resource', 'any-action')).toBe(true);
    });
  });

  describe('filterAllowedScopes', () => {
    it('should filter to allowed scopes only', () => {
      const requested = ['profile:read', 'preferences:write', 'admin:write'];
      const allowed = ['profile:read', 'preferences:write'];

      const filtered = scopeManager.filterAllowedScopes(requested, allowed);

      expect(filtered).toContain('profile:read');
      expect(filtered).toContain('preferences:write');
      expect(filtered).not.toContain('admin:write');
    });

    it('should handle wildcard allowed scopes', () => {
      const requested = ['profile:read', 'profile:write'];
      const allowed = ['profile:*'];

      const filtered = scopeManager.filterAllowedScopes(requested, allowed);

      expect(filtered).toContain('profile:read');
      expect(filtered).toContain('profile:write');
    });
  });
});

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      windowMs: 1000, // 1 second
      maxRequests: 3,
    });
  });

  afterEach(() => {
    rateLimiter.destroy();
  });

  describe('check', () => {
    it('should allow requests within limit', async () => {
      const result1 = await rateLimiter.check('user_1');
      const result2 = await rateLimiter.check('user_1');

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result2.info.remaining).toBe(1);
    });

    it('should block requests over limit', async () => {
      await rateLimiter.check('user_2');
      await rateLimiter.check('user_2');
      await rateLimiter.check('user_2');
      const result = await rateLimiter.check('user_2');

      expect(result.allowed).toBe(false);
      expect(result.info.remaining).toBe(0);
      expect(result.info.retryAfter).toBeDefined();
    });

    it('should track different identifiers separately', async () => {
      await rateLimiter.check('user_3');
      await rateLimiter.check('user_3');
      await rateLimiter.check('user_3');

      const result = await rateLimiter.check('user_4');

      expect(result.allowed).toBe(true);
      expect(result.info.remaining).toBe(2);
    });
  });

  describe('reset', () => {
    it('should reset rate limit for identifier', async () => {
      await rateLimiter.check('user_5');
      await rateLimiter.check('user_5');
      await rateLimiter.check('user_5');

      rateLimiter.reset('user_5');

      const result = await rateLimiter.check('user_5');
      expect(result.allowed).toBe(true);
      expect(result.info.remaining).toBe(2);
    });
  });

  describe('getInfo', () => {
    it('should return current rate limit info', async () => {
      await rateLimiter.check('user_6');

      const info = rateLimiter.getInfo('user_6');

      expect(info.limit).toBe(3);
      expect(info.remaining).toBe(2);
      expect(info.resetTime).toBeDefined();
    });
  });
});

describe('RATE_LIMIT_PRESETS', () => {
  it('should have correct preset configurations', () => {
    expect(RATE_LIMIT_PRESETS.strict.maxRequests).toBe(10);
    expect(RATE_LIMIT_PRESETS.standard.maxRequests).toBe(100);
    expect(RATE_LIMIT_PRESETS.relaxed.maxRequests).toBe(1000);
    expect(RATE_LIMIT_PRESETS.burst.maxRequests).toBe(20);
    expect(RATE_LIMIT_PRESETS.daily.maxRequests).toBe(10000);
  });
});

describe('DEFAULT_SCOPES', () => {
  it('should have essential scopes defined', () => {
    expect(DEFAULT_SCOPES['profile:read']).toBeDefined();
    expect(DEFAULT_SCOPES['profile:write']).toBeDefined();
    expect(DEFAULT_SCOPES['identity:read']).toBeDefined();
    expect(DEFAULT_SCOPES['preferences:read']).toBeDefined();
    expect(DEFAULT_SCOPES['preferences:write']).toBeDefined();
    expect(DEFAULT_SCOPES['openid']).toBeDefined();
  });

  it('should have correct scope categories', () => {
    expect(DEFAULT_SCOPES['profile:read'].category).toBe('profile');
    expect(DEFAULT_SCOPES['identity:read'].category).toBe('identity');
    expect(DEFAULT_SCOPES['preferences:read'].category).toBe('preferences');
    expect(DEFAULT_SCOPES['admin:write'].category).toBe('admin');
  });
});
