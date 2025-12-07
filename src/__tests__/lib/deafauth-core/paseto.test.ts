import {
  createMockPasetoHandler,
  isPasetoPayload,
  isTokenExpired,
  getTokenLifetime,
  DEFAULT_PASETO_OPTIONS,
  PasetoPayload,
} from '@/lib/deafauth-core/paseto';

describe('PASETO Token Support', () => {
  describe('createMockPasetoHandler', () => {
    it('should create a handler with default options', () => {
      const handler = createMockPasetoHandler();
      expect(handler).toBeDefined();
      expect(handler.generateToken).toBeDefined();
      expect(handler.verifyToken).toBeDefined();
      expect(handler.refreshToken).toBeDefined();
    });

    it('should create a handler with custom config', () => {
      const handler = createMockPasetoHandler({
        issuer: 'deafauth.example.com',
        audience: 'api.example.com',
        defaultOptions: {
          expiresIn: 7200, // 2 hours
        },
      });
      expect(handler).toBeDefined();
    });

    describe('generateToken', () => {
      it('should generate a valid mock token', async () => {
        const handler = createMockPasetoHandler();
        const result = await handler.generateToken({
          sub: 'user-123',
          email: 'test@example.com',
        });

        expect(result.success).toBe(true);
        expect(result.token).toBeDefined();
        expect(result.token).toMatch(/^v4\.local\.mock\./);
        expect(result.payload).toBeDefined();
        expect(result.payload?.sub).toBe('user-123');
        expect(result.payload?.email).toBe('test@example.com');
        expect(result.payload?.iat).toBeDefined();
        expect(result.payload?.exp).toBeDefined();
      });

      it('should include Deaf-specific claims in token', async () => {
        const handler = createMockPasetoHandler();
        const result = await handler.generateToken({
          sub: 'user-123',
          email: 'test@example.com',
          deafStatus: 'deaf',
          validated: true,
          pinkSyncEnabled: true,
        });

        expect(result.success).toBe(true);
        expect(result.payload?.deafStatus).toBe('deaf');
        expect(result.payload?.validated).toBe(true);
        expect(result.payload?.pinkSyncEnabled).toBe(true);
      });

      it('should respect custom expiration', async () => {
        const handler = createMockPasetoHandler();
        const result = await handler.generateToken(
          { sub: 'user-123' },
          { expiresIn: 60 } // 1 minute
        );

        expect(result.success).toBe(true);
        const exp = new Date(result.payload!.exp);
        const iat = new Date(result.payload!.iat);
        const diff = (exp.getTime() - iat.getTime()) / 1000;
        expect(diff).toBeCloseTo(60, 0);
      });

      it('should include issuer and audience when configured', async () => {
        const handler = createMockPasetoHandler({
          issuer: 'deafauth.example.com',
          audience: 'api.example.com',
        });
        const result = await handler.generateToken({ sub: 'user-123' });

        expect(result.success).toBe(true);
        expect(result.payload?.iss).toBe('deafauth.example.com');
        expect(result.payload?.aud).toBe('api.example.com');
      });
    });

    describe('verifyToken', () => {
      it('should verify a valid token', async () => {
        const handler = createMockPasetoHandler();
        const genResult = await handler.generateToken({
          sub: 'user-123',
          email: 'test@example.com',
        });

        const verifyResult = await handler.verifyToken(genResult.token!);

        expect(verifyResult.success).toBe(true);
        expect(verifyResult.payload?.sub).toBe('user-123');
        expect(verifyResult.payload?.email).toBe('test@example.com');
      });

      it('should reject expired tokens', async () => {
        const handler = createMockPasetoHandler();
        // Generate token that expires in -1 second (already expired)
        const genResult = await handler.generateToken(
          { sub: 'user-123' },
          { expiresIn: -1 }
        );

        const verifyResult = await handler.verifyToken(genResult.token!);

        expect(verifyResult.success).toBe(false);
        expect(verifyResult.error).toBe('Token expired');
      });

      it('should reject invalid token format', async () => {
        const handler = createMockPasetoHandler();
        const result = await handler.verifyToken('invalid-token');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid token format');
      });

      it('should reject malformed token payload', async () => {
        const handler = createMockPasetoHandler();
        const result = await handler.verifyToken('v4.local.mock.not-valid-base64!');

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('refreshToken', () => {
      it('should refresh a valid token', async () => {
        const handler = createMockPasetoHandler();
        const genResult = await handler.generateToken({
          sub: 'user-123',
          email: 'test@example.com',
          deafStatus: 'deaf',
        });

        // Wait a tiny bit to ensure new timestamp
        await new Promise((resolve) => setTimeout(resolve, 10));

        const refreshResult = await handler.refreshToken(genResult.token!);

        expect(refreshResult.success).toBe(true);
        expect(refreshResult.token).toBeDefined();
        expect(refreshResult.token).not.toBe(genResult.token);
        expect(refreshResult.payload?.sub).toBe('user-123');
        expect(refreshResult.payload?.email).toBe('test@example.com');
        expect(refreshResult.payload?.deafStatus).toBe('deaf');
      });

      it('should fail to refresh expired token', async () => {
        const handler = createMockPasetoHandler();
        const genResult = await handler.generateToken(
          { sub: 'user-123' },
          { expiresIn: -1 }
        );

        const refreshResult = await handler.refreshToken(genResult.token!);

        expect(refreshResult.success).toBe(false);
        expect(refreshResult.error).toBe('Token expired');
      });

      it('should allow custom expiration on refresh', async () => {
        const handler = createMockPasetoHandler();
        const genResult = await handler.generateToken(
          { sub: 'user-123' },
          { expiresIn: 3600 }
        );

        const refreshResult = await handler.refreshToken(genResult.token!, {
          expiresIn: 7200,
        });

        expect(refreshResult.success).toBe(true);
        const exp = new Date(refreshResult.payload!.exp);
        const iat = new Date(refreshResult.payload!.iat);
        const diff = (exp.getTime() - iat.getTime()) / 1000;
        expect(diff).toBeCloseTo(7200, 0);
      });
    });
  });

  describe('isPasetoPayload', () => {
    it('should return true for valid payload', () => {
      const payload: PasetoPayload = {
        sub: 'user-123',
        iat: new Date().toISOString(),
        exp: new Date().toISOString(),
      };
      expect(isPasetoPayload(payload)).toBe(true);
    });

    it('should return false for invalid payloads', () => {
      expect(isPasetoPayload(null)).toBe(false);
      expect(isPasetoPayload(undefined)).toBe(false);
      expect(isPasetoPayload({})).toBe(false);
      expect(isPasetoPayload({ sub: 'user-123' })).toBe(false);
      expect(isPasetoPayload({ sub: 'user-123', iat: 'now' })).toBe(false);
      expect(isPasetoPayload('string')).toBe(false);
      expect(isPasetoPayload(123)).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const payload: PasetoPayload = {
        sub: 'user-123',
        iat: new Date().toISOString(),
        exp: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      };
      expect(isTokenExpired(payload)).toBe(false);
    });

    it('should return true for expired token', () => {
      const payload: PasetoPayload = {
        sub: 'user-123',
        iat: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        exp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      };
      expect(isTokenExpired(payload)).toBe(true);
    });
  });

  describe('getTokenLifetime', () => {
    it('should return remaining lifetime in seconds', () => {
      const exp = new Date(Date.now() + 3600000); // 1 hour from now
      const payload: PasetoPayload = {
        sub: 'user-123',
        iat: new Date().toISOString(),
        exp: exp.toISOString(),
      };
      const lifetime = getTokenLifetime(payload);
      expect(lifetime).toBeGreaterThan(3500); // ~1 hour
      expect(lifetime).toBeLessThanOrEqual(3600);
    });

    it('should return 0 for expired token', () => {
      const payload: PasetoPayload = {
        sub: 'user-123',
        iat: new Date(Date.now() - 7200000).toISOString(),
        exp: new Date(Date.now() - 3600000).toISOString(),
      };
      expect(getTokenLifetime(payload)).toBe(0);
    });
  });

  describe('DEFAULT_PASETO_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_PASETO_OPTIONS.version).toBe('v4');
      expect(DEFAULT_PASETO_OPTIONS.purpose).toBe('local');
      expect(DEFAULT_PASETO_OPTIONS.expiresIn).toBe(3600);
    });
  });
});
