import { DeafAUTH } from '@/lib/deafauth-core/DeafAUTH';
import type {
  AuthAdapter,
  DatabaseAdapter,
  QueryCondition,
  UpdateOperation,
} from '@/lib/deafauth-core/types';

// Mock auth adapter for testing
const createMockAuthAdapter = (
  overrides: Partial<AuthAdapter> = {}
): AuthAdapter => ({
  login: jest.fn().mockResolvedValue({
    success: true,
    user: { id: 'test-user-123', email: 'test@example.com', name: 'Test User' },
    token: 'test-token',
  }),
  logout: jest.fn().mockResolvedValue(undefined),
  getUser: jest.fn().mockResolvedValue({
    id: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
  }),
  ...overrides,
});

// Mock database adapter for testing
const createMockDbAdapter = (
  store: Map<string, unknown[]> = new Map()
): DatabaseAdapter => {
  return {
    findOne: jest.fn(async <T>(table: string, query: QueryCondition) => {
      const records = store.get(table) || [];
      const found = records.find((r) => {
        const rec = r as Record<string, unknown>;
        return Object.entries(query).every(([k, v]) => rec[k] === v);
      });
      return (found as T) || null;
    }),
    insert: jest.fn(async <T>(table: string, record: Record<string, unknown>) => {
      const records = store.get(table) || [];
      records.push(record);
      store.set(table, records);
      return record as T;
    }),
    update: jest.fn(async (table: string, query: QueryCondition, updates: UpdateOperation) => {
      const records = store.get(table) || [];
      const index = records.findIndex((r) => {
        const rec = r as Record<string, unknown>;
        return Object.entries(query).every(([k, v]) => rec[k] === v);
      });
      if (index >= 0) {
        const existing = records[index] as Record<string, unknown>;
        for (const [key, value] of Object.entries(updates)) {
          if (
            value &&
            typeof value === 'object' &&
            'increment' in value
          ) {
            const increment = (value as { increment: number }).increment;
            existing[key] = ((existing[key] as number) || 0) + increment;
          } else {
            existing[key] = value;
          }
        }
        records[index] = existing;
        store.set(table, records);
      }
    }),
    find: jest.fn(async <T>(table: string, query: QueryCondition) => {
      const records = store.get(table) || [];
      return records.filter((r) => {
        const rec = r as Record<string, unknown>;
        return Object.entries(query).every(([k, v]) => rec[k] === v);
      }) as T[];
    }),
  };
};

describe('DeafAUTH Core', () => {
  describe('Constructor', () => {
    it('should create instance with default config', () => {
      const deafAuth = new DeafAUTH();
      expect(deafAuth).toBeInstanceOf(DeafAUTH);
      expect(deafAuth.hasAuthAdapter()).toBe(false);
      expect(deafAuth.hasDbAdapter()).toBe(false);
    });

    it('should accept auth adapter', () => {
      const authAdapter = createMockAuthAdapter();
      const deafAuth = new DeafAUTH({ authAdapter });
      expect(deafAuth.hasAuthAdapter()).toBe(true);
    });

    it('should accept database adapter', () => {
      const dbAdapter = createMockDbAdapter();
      const deafAuth = new DeafAUTH({ dbAdapter });
      expect(deafAuth.hasDbAdapter()).toBe(true);
    });

    it('should apply custom configuration', () => {
      const deafAuth = new DeafAUTH({
        requireValidation: true,
        autoCreateProfile: false,
        enablePinkSync: false,
        enableFibonrose: false,
      });
      const config = deafAuth.getConfig();
      expect(config.requireValidation).toBe(true);
      expect(config.autoCreateProfile).toBe(false);
      expect(config.enablePinkSync).toBe(false);
      expect(config.enableFibonrose).toBe(false);
    });
  });

  describe('Authentication', () => {
    it('should throw error when no auth adapter configured', async () => {
      const deafAuth = new DeafAUTH();
      await expect(
        deafAuth.authenticate({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('No auth adapter configured');
    });

    it('should authenticate with auth adapter', async () => {
      const authAdapter = createMockAuthAdapter();
      const deafAuth = new DeafAUTH({ authAdapter });

      const result = await deafAuth.authenticate({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.user?.id).toBe('test-user-123');
      expect(result.user?.email).toBe('test@example.com');
      expect(authAdapter.login).toHaveBeenCalled();
    });

    it('should create deaf profile on successful auth', async () => {
      const authAdapter = createMockAuthAdapter();
      const store = new Map();
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ authAdapter, dbAdapter });

      const result = await deafAuth.authenticate({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.deafProfile).toBeDefined();
      expect(result.deafProfile?.userId).toBe('test-user-123');
      expect(result.deafProfile?.deafStatus).toBe('unspecified');
      expect(result.deafProfile?.preferredLanguage).toBe('ASL');
    });

    it('should not create profile when autoCreateProfile is false', async () => {
      const authAdapter = createMockAuthAdapter();
      const dbAdapter = createMockDbAdapter();
      const deafAuth = new DeafAUTH({
        authAdapter,
        dbAdapter,
        autoCreateProfile: false,
      });

      const result = await deafAuth.authenticate({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.deafProfile).toBeUndefined();
    });

    it('should handle failed authentication', async () => {
      const authAdapter = createMockAuthAdapter({
        login: jest.fn().mockResolvedValue({
          success: false,
          error: 'Invalid credentials',
        }),
      });
      const deafAuth = new DeafAUTH({ authAdapter });

      const result = await deafAuth.authenticate({
        email: 'test@example.com',
        password: 'wrong',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials');
    });
  });

  describe('Profile Management', () => {
    it('should get or create profile with database', async () => {
      const store = new Map();
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ dbAdapter });

      const user = { id: 'user-1', email: 'test@example.com', name: 'Test' };
      const profile = await deafAuth.getOrCreateProfile(user);

      expect(profile.userId).toBe('user-1');
      expect(profile.email).toBe('test@example.com');
      expect(profile.deafStatus).toBe('unspecified');
      expect(dbAdapter.insert).toHaveBeenCalled();
    });

    it('should return existing profile from database', async () => {
      const store = new Map();
      store.set('deaf_profiles', [
        {
          userId: 'user-1',
          email: 'test@example.com',
          deafStatus: 'deaf',
          preferredLanguage: 'BSL',
        },
      ]);
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ dbAdapter });

      const user = { id: 'user-1', email: 'test@example.com' };
      const profile = await deafAuth.getOrCreateProfile(user);

      expect(profile.userId).toBe('user-1');
      expect(profile.deafStatus).toBe('deaf');
      expect(profile.preferredLanguage).toBe('BSL');
      expect(dbAdapter.insert).not.toHaveBeenCalled();
    });

    it('should use localStorage fallback when no database', async () => {
      const deafAuth = new DeafAUTH();

      const user = { id: 'local-user', email: 'local@example.com' };
      const profile = await deafAuth.getOrCreateProfile(user);

      expect(profile.userId).toBe('local-user');
      expect(profile.email).toBe('local@example.com');
    });

    it('should update profile', async () => {
      const store = new Map();
      store.set('deaf_profiles', [
        { userId: 'user-1', deafStatus: 'unspecified' },
      ]);
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ dbAdapter });

      await deafAuth.updateProfile('user-1', { deafStatus: 'deaf' });

      expect(dbAdapter.update).toHaveBeenCalled();
    });
  });

  describe('Identity Validation', () => {
    it('should validate identity and update profile', async () => {
      const store = new Map();
      store.set('deaf_profiles', [
        { userId: 'user-1', validated: false, reputation: 0 },
      ]);
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ dbAdapter, enableFibonrose: false });

      const result = await deafAuth.validateIdentity('user-1', {
        status: 'deaf',
        type: 'community-vouching',
        validatorId: 'validator-1',
      });

      expect(result.userId).toBe('user-1');
      expect(result.deafStatus).toBe('deaf');
      expect(result.proofType).toBe('community-vouching');
      expect(result.validatedBy).toBe('validator-1');
      expect(result.validatedAt).toBeDefined();

      // Check profile was updated
      expect(dbAdapter.update).toHaveBeenCalled();
    });

    it('should increment reputation on validation', async () => {
      const store = new Map();
      store.set('deaf_profiles', [
        { userId: 'user-1', validated: false, reputation: 10 },
      ]);
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ dbAdapter, enableFibonrose: false });

      await deafAuth.validateIdentity('user-1', {
        status: 'deaf',
        type: 'video-verification',
      });

      // The mock should have updated with increment
      const updateCalls = (dbAdapter.update as jest.Mock).mock.calls;
      const profileUpdateCall = updateCalls.find(
        (call) => call[0] === 'deaf_profiles'
      );
      expect(profileUpdateCall[2].reputation).toEqual({ increment: 50 });
    });

    it('should work without database using localStorage', async () => {
      const deafAuth = new DeafAUTH({ enableFibonrose: false });

      // First create a profile
      await deafAuth.getOrCreateProfile({
        id: 'local-user',
        email: 'local@example.com',
      });

      const result = await deafAuth.validateIdentity('local-user', {
        status: 'hard-of-hearing',
        type: 'self-declared',
      });

      expect(result.userId).toBe('local-user');
      expect(result.deafStatus).toBe('hard-of-hearing');
    });
  });

  describe('Accessibility Preferences', () => {
    it('should update accessibility preferences', async () => {
      const store = new Map();
      store.set('deaf_profiles', [
        { userId: 'user-1', preferredLanguage: 'ASL' },
      ]);
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ dbAdapter, enablePinkSync: false });

      const result = await deafAuth.updateAccessibility('user-1', {
        language: 'BSL',
        communication: 'sign-language',
        needs: ['captions', 'visual-alerts'],
      });

      expect(result.preferredLanguage).toBe('BSL');
      expect(result.communicationPreference).toBe('sign-language');
      expect(result.accessibilityNeeds).toEqual(['captions', 'visual-alerts']);
    });

    it('should only update provided preferences', async () => {
      const store = new Map();
      store.set('deaf_profiles', [
        { userId: 'user-1', preferredLanguage: 'ASL' },
      ]);
      const dbAdapter = createMockDbAdapter(store);
      const deafAuth = new DeafAUTH({ dbAdapter, enablePinkSync: false });

      const result = await deafAuth.updateAccessibility('user-1', {
        language: 'DGS',
      });

      expect(result.preferredLanguage).toBe('DGS');
      expect(result.communicationPreference).toBeUndefined();
    });
  });

  describe('Configuration', () => {
    it('should return config copy', () => {
      const deafAuth = new DeafAUTH({
        requireValidation: true,
        customOption: 'test',
      });
      
      const config = deafAuth.getConfig();
      expect(config.requireValidation).toBe(true);
      expect(config.customOption).toBe('test');
    });

    it('should have sensible defaults', () => {
      const deafAuth = new DeafAUTH();
      const config = deafAuth.getConfig();
      
      expect(config.requireValidation).toBe(false);
      expect(config.autoCreateProfile).toBe(true);
      expect(config.enablePinkSync).toBe(true);
      expect(config.enableFibonrose).toBe(true);
    });
  });
});
