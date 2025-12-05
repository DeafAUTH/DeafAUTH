import {
  Auth0Adapter,
  createAuthAdapter,
} from '@/lib/deafauth-core/adapters/auth-adapters';

// Mock fetch for Auth0 adapter tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Auth Adapters', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Auth0Adapter', () => {
    it('should create adapter with domain and clientId', () => {
      const adapter = new Auth0Adapter('test.auth0.com', 'client123');
      expect(adapter).toBeDefined();
    });

    it('should make login request to Auth0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: 'token123',
            sub: 'auth0|user123',
          }),
      });

      const adapter = new Auth0Adapter('test.auth0.com', 'client123');
      const result = await adapter.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.auth0.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(result.success).toBe(true);
      expect(result.token).toBe('token123');
    });

    it('should handle Auth0 login failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            error: 'invalid_grant',
            error_description: 'Wrong email or password.',
          }),
      });

      const adapter = new Auth0Adapter('test.auth0.com', 'client123');
      const result = await adapter.login({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wrong email or password.');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const adapter = new Auth0Adapter('test.auth0.com', 'client123');
      const result = await adapter.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('createAuthAdapter', () => {
    it('should create custom adapter with login handler', async () => {
      const loginMock = jest.fn().mockResolvedValue({
        success: true,
        user: { id: 'custom-user', email: 'custom@example.com' },
      });

      const adapter = createAuthAdapter({ login: loginMock });
      const result = await adapter.login({
        email: 'custom@example.com',
        password: 'pass',
      });

      expect(loginMock).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('custom-user');
    });

    it('should support optional logout handler', async () => {
      const logoutMock = jest.fn().mockResolvedValue(undefined);
      const adapter = createAuthAdapter({
        login: jest.fn(),
        logout: logoutMock,
      });

      await adapter.logout?.();
      expect(logoutMock).toHaveBeenCalled();
    });

    it('should support optional getUser handler', async () => {
      const getUserMock = jest.fn().mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
      });
      const adapter = createAuthAdapter({
        login: jest.fn(),
        getUser: getUserMock,
      });

      const user = await adapter.getUser?.();
      expect(getUserMock).toHaveBeenCalled();
      expect(user?.id).toBe('user-1');
    });
  });
});
