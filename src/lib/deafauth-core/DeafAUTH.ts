// DeafAUTH Universal Adapter - Core Class
// Works with ANY auth provider, ANY database, ANY framework
// Deploy in under 5 minutes

import type {
  AuthAdapter,
  AuthCredentials,
  DatabaseAdapter,
  StorageAdapter,
  DeafAUTHConfig,
  DeafAuthResult,
  DeafProfile,
  AuthUser,
  ValidationData,
  ValidationRecord,
  AccessibilityPreferences,
} from './types';

/**
 * DeafAUTH - Universal identity cortex for Deaf-first authentication
 * 
 * Agnostic layer that works with any auth provider, database, or framework.
 * Implements Deaf-first logic regardless of underlying infrastructure.
 * 
 * @example
 * ```typescript
 * // Basic setup with any auth and db
 * const deafAuth = new DeafAUTH({
 *   authAdapter: new Auth0Adapter(domain, clientId),
 *   dbAdapter: new SupabaseAdapter(supabase)
 * });
 * 
 * // Authenticate with Deaf profile
 * const result = await deafAuth.authenticate({
 *   email: 'user@example.com',
 *   password: 'password'
 * });
 * ```
 */
export class DeafAUTH {
  private authAdapter: AuthAdapter | null;
  private dbAdapter: DatabaseAdapter | null;
  private storageAdapter: StorageAdapter;
  private config: DeafAUTHConfig;

  constructor(config: DeafAUTHConfig = {}) {
    // Adapter pattern - bring your own auth/db
    this.authAdapter = config.authAdapter ?? null;
    this.dbAdapter = config.dbAdapter ?? null;
    this.storageAdapter = config.storageAdapter ?? this.createDefaultStorage();

    // Deaf-first configuration with sensible defaults
    this.config = {
      requireValidation: config.requireValidation ?? false,
      autoCreateProfile: config.autoCreateProfile !== false,
      enablePinkSync: config.enablePinkSync !== false,
      enableFibonrose: config.enableFibonrose !== false,
      ...config,
    };
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Authenticate user with configured auth provider
   * Automatically creates/retrieves Deaf profile
   */
  async authenticate(credentials: AuthCredentials): Promise<DeafAuthResult> {
    if (!this.authAdapter) {
      throw new Error(
        'No auth adapter configured. Set authAdapter in constructor.'
      );
    }

    // Call the configured auth provider
    const authResult = await this.authAdapter.login(credentials);

    // Auto-create/retrieve DeafAUTH profile on successful auth
    if (this.config.autoCreateProfile && authResult.success && authResult.user) {
      const profile = await this.getOrCreateProfile(authResult.user);
      return { ...authResult, deafProfile: profile };
    }

    return authResult;
  }

  /**
   * Logout user from configured auth provider
   */
  async logout(): Promise<void> {
    if (this.authAdapter?.logout) {
      await this.authAdapter.logout();
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.authAdapter?.getUser) {
      return this.authAdapter.getUser();
    }
    return null;
  }

  // ============================================
  // PROFILE MANAGEMENT
  // ============================================

  /**
   * Get or create a Deaf-first profile for a user
   */
  async getOrCreateProfile(user: AuthUser): Promise<DeafProfile> {
    if (!this.dbAdapter) {
      // Fallback to localStorage if no DB
      const stored = this.storageAdapter.getProfile(user.id);
      if (stored) {
        // Update last login
        const updated = this.storageAdapter.updateProfile(user.id, {
          lastLogin: new Date().toISOString(),
        });
        return updated ?? stored;
      }
      // Create new profile
      const newProfile = this.createDefaultProfile(user);
      this.storageAdapter.saveProfile(user.id, newProfile);
      return newProfile;
    }

    // Check if profile exists in database
    let profile = await this.dbAdapter.findOne<DeafProfile>('deaf_profiles', {
      userId: user.id,
    });

    if (!profile) {
      // Create new Deaf-first profile
      const newProfile = this.createDefaultProfile(user);
      profile = await this.dbAdapter.insert<DeafProfile>(
        'deaf_profiles',
        newProfile
      );
    } else {
      // Update last login
      await this.dbAdapter.update(
        'deaf_profiles',
        { userId: user.id },
        { lastLogin: new Date().toISOString() }
      );
    }

    return profile;
  }

  /**
   * Get profile by user ID
   */
  async getProfile(userId: string): Promise<DeafProfile | null> {
    if (!this.dbAdapter) {
      return this.storageAdapter.getProfile(userId);
    }
    return this.dbAdapter.findOne<DeafProfile>('deaf_profiles', { userId });
  }

  /**
   * Update profile for a user
   */
  async updateProfile(
    userId: string,
    updates: Partial<DeafProfile>
  ): Promise<DeafProfile | null> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    if (!this.dbAdapter) {
      return this.storageAdapter.updateProfile(userId, updateData);
    }

    await this.dbAdapter.update('deaf_profiles', { userId }, updateData);
    return this.dbAdapter.findOne<DeafProfile>('deaf_profiles', { userId });
  }

  // ============================================
  // IDENTITY VALIDATION
  // ============================================

  /**
   * Validate a user's Deaf identity
   * Core function for community verification
   */
  async validateIdentity(
    userId: string,
    validation: ValidationData
  ): Promise<ValidationRecord> {
    const record: ValidationRecord = {
      userId,
      deafStatus: validation.status,
      proofType: validation.type,
      validatedBy: validation.validatorId,
      validatedAt: new Date().toISOString(),
      notes: validation.notes,
      metadata: validation.metadata,
    };

    // Store validation
    if (this.dbAdapter) {
      await this.dbAdapter.insert('deaf_validations', record);
      await this.dbAdapter.update(
        'deaf_profiles',
        { userId },
        {
          validated: true,
          deafStatus: validation.status,
          reputation: { increment: 50 },
        }
      );
    } else {
      this.storageAdapter.saveValidation(userId, record);
      // Also update local profile
      this.storageAdapter.updateProfile(userId, {
        validated: true,
        deafStatus: validation.status,
        reputation:
          (this.storageAdapter.getProfile(userId)?.reputation ?? 0) + 50,
      });
    }

    // Optional: Log to Fibonrose
    if (this.config.enableFibonrose) {
      await this.logEvent('DEAF_VALIDATION', record);
    }

    return record;
  }

  /**
   * Get validation history for a user
   */
  async getValidations(userId: string): Promise<ValidationRecord[]> {
    if (!this.dbAdapter || !this.dbAdapter.find) {
      return this.storageAdapter.getValidations(userId);
    }
    return this.dbAdapter.find<ValidationRecord>('deaf_validations', { userId });
  }

  // ============================================
  // ACCESSIBILITY PREFERENCES
  // ============================================

  /**
   * Update accessibility preferences for a user
   */
  async updateAccessibility(
    userId: string,
    prefs: AccessibilityPreferences
  ): Promise<Partial<DeafProfile>> {
    const update: Partial<DeafProfile> = {
      updatedAt: new Date().toISOString(),
    };

    if (prefs.language) {
      update.preferredLanguage = prefs.language;
    }
    if (prefs.communication) {
      update.communicationPreference = prefs.communication;
    }
    if (prefs.needs) {
      update.accessibilityNeeds = prefs.needs;
    }

    if (this.dbAdapter) {
      await this.dbAdapter.update('deaf_profiles', { userId }, update);
    } else {
      this.storageAdapter.updateProfile(userId, update);
    }

    // Optional: Sync to PinkSync
    if (this.config.enablePinkSync) {
      await this.syncToPinkSync(userId, prefs);
    }

    return update;
  }

  // ============================================
  // OPTIONAL INTEGRATIONS
  // ============================================

  /**
   * Sync data to PinkSync endpoint
   */
  private async syncToPinkSync(
    userId: string,
    data: AccessibilityPreferences
  ): Promise<void> {
    const endpoint = this.config.pinkSyncEndpoint;
    if (endpoint && typeof endpoint === 'string') {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, type: 'ACCESSIBILITY', data }),
        });
      } catch {
        // Silently fail - optional integration
      }
    }
  }

  /**
   * Log event to Fibonrose endpoint
   */
  private async logEvent(
    type: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const endpoint = this.config.fibonroseEndpoint;
    if (endpoint && typeof endpoint === 'string') {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type,
            data,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch {
        // Silently fail - optional integration
      }
    }
  }

  // ============================================
  // DEFAULT STORAGE ADAPTER
  // ============================================

  /**
   * Create default in-memory/localStorage adapter
   * Used when no database is configured
   */
  private createDefaultStorage(): StorageAdapter {
    // Use Map for server-side, localStorage for client-side
    const isClient = typeof window !== 'undefined';
    const memoryStore = new Map<string, string>();

    const getItem = (key: string): string | null => {
      if (isClient) {
        return localStorage.getItem(key);
      }
      return memoryStore.get(key) ?? null;
    };

    const setItem = (key: string, value: string): void => {
      if (isClient) {
        localStorage.setItem(key, value);
      } else {
        memoryStore.set(key, value);
      }
    };

    return {
      getProfile: (userId: string): DeafProfile | null => {
        const data = getItem(`deaf_profile_${userId}`);
        return data ? JSON.parse(data) : null;
      },

      saveProfile: (userId: string, profile: DeafProfile): void => {
        setItem(`deaf_profile_${userId}`, JSON.stringify(profile));
      },

      updateProfile: (
        userId: string,
        updates: Partial<DeafProfile>
      ): DeafProfile | null => {
        const existing = getItem(`deaf_profile_${userId}`);
        if (!existing) return null;
        const profile = JSON.parse(existing) as DeafProfile;
        const updated = { ...profile, ...updates };
        setItem(`deaf_profile_${userId}`, JSON.stringify(updated));
        return updated;
      },

      saveValidation: (userId: string, validation: ValidationRecord): void => {
        const key = `deaf_validations_${userId}`;
        const existing = getItem(key);
        const validations = existing ? JSON.parse(existing) : [];
        validations.push(validation);
        setItem(key, JSON.stringify(validations));
      },

      getValidations: (userId: string): ValidationRecord[] => {
        const data = getItem(`deaf_validations_${userId}`);
        return data ? JSON.parse(data) : [];
      },
    };
  }

  /**
   * Create default Deaf-first profile for a new user
   */
  private createDefaultProfile(user: AuthUser): DeafProfile {
    return {
      userId: user.id,
      email: user.email,
      name: user.name,

      // Deaf-first defaults
      deafStatus: 'unspecified',
      preferredLanguage: 'ASL',
      communicationPreference: 'visual',
      accessibilityNeeds: [],

      // MBTQ Universe flags
      validated: false,
      pinkSyncEnabled: true,
      reputation: 0,
      daoMember: false,

      // Timestamps
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Check if auth adapter is configured
   */
  hasAuthAdapter(): boolean {
    return this.authAdapter !== null;
  }

  /**
   * Check if database adapter is configured
   */
  hasDbAdapter(): boolean {
    return this.dbAdapter !== null;
  }

  /**
   * Get current configuration
   */
  getConfig(): DeafAUTHConfig {
    return { ...this.config };
  }
}
