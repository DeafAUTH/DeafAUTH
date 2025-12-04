// DeafAUTH Universal Adapter - Type Definitions
// Works with ANY auth provider, ANY database, ANY framework

// ============================================
// AUTH ADAPTER INTERFACE
// ============================================

/**
 * Result from authentication operations
 */
export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

/**
 * Basic user information from auth provider
 */
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Login credentials - can be extended by specific adapters
 */
export interface AuthCredentials {
  email?: string;
  password?: string;
  token?: string;
  provider?: string;
  [key: string]: unknown;
}

/**
 * Interface for authentication adapters
 * Implement this to integrate your auth provider (Auth0, Firebase, Clerk, etc.)
 */
export interface AuthAdapter {
  login(credentials: AuthCredentials): Promise<AuthResult>;
  logout?(): Promise<void>;
  getUser?(): Promise<AuthUser | null>;
  onAuthStateChange?(callback: (user: AuthUser | null) => void): () => void;
}

// ============================================
// DATABASE ADAPTER INTERFACE
// ============================================

/**
 * Query conditions for database operations
 */
export type QueryCondition = Record<string, unknown>;

/**
 * Update operations - supports basic values and increments
 */
export interface UpdateOperation {
  [key: string]: unknown | { increment: number };
}

/**
 * Interface for database adapters
 * Implement this to integrate your database (Supabase, MongoDB, Firebase, PostgreSQL, etc.)
 */
export interface DatabaseAdapter {
  findOne<T = Record<string, unknown>>(
    collection: string,
    query: QueryCondition
  ): Promise<T | null>;
  
  insert<T = Record<string, unknown>>(
    collection: string,
    record: Record<string, unknown>
  ): Promise<T>;
  
  update(
    collection: string,
    query: QueryCondition,
    updates: UpdateOperation
  ): Promise<void>;
  
  delete?(
    collection: string,
    query: QueryCondition
  ): Promise<void>;
  
  find?<T = Record<string, unknown>>(
    collection: string,
    query: QueryCondition
  ): Promise<T[]>;
}

// ============================================
// STORAGE ADAPTER INTERFACE
// ============================================

/**
 * Interface for local storage adapters
 * Used as fallback when no database is configured
 */
export interface StorageAdapter {
  getProfile(userId: string): DeafProfile | null;
  saveProfile(userId: string, profile: DeafProfile): void;
  updateProfile(userId: string, updates: Partial<DeafProfile>): DeafProfile | null;
  saveValidation(userId: string, validation: ValidationRecord): void;
  getValidations(userId: string): ValidationRecord[];
}

// ============================================
// DEAF-FIRST PROFILE TYPES
// ============================================

/**
 * Deaf status options for user profiles
 */
export type DeafStatus = 
  | 'deaf'
  | 'hard-of-hearing'
  | 'coda'
  | 'hearing'
  | 'unspecified';

/**
 * Preferred sign language options
 */
export type SignLanguage = 
  | 'ASL'    // American Sign Language
  | 'BSL'    // British Sign Language
  | 'LSF'    // French Sign Language
  | 'DGS'    // German Sign Language
  | 'JSL'    // Japanese Sign Language
  | 'ISL'    // International Sign Language
  | 'other'
  | string;  // Allow custom languages

/**
 * Communication preference options
 */
export type CommunicationPreference = 
  | 'visual'
  | 'written'
  | 'sign-language'
  | 'lip-reading'
  | 'mixed';

/**
 * Accessibility needs that can be specified
 */
export type AccessibilityNeed = 
  | 'captions'
  | 'sign-interpreter'
  | 'visual-alerts'
  | 'high-contrast'
  | 'screen-reader'
  | 'large-text'
  | 'reduced-motion'
  | string;  // Allow custom needs

/**
 * Deaf-first user profile
 */
export interface DeafProfile {
  userId: string;
  email?: string;
  name?: string;
  
  // Deaf-first attributes
  deafStatus: DeafStatus;
  preferredLanguage: SignLanguage;
  communicationPreference: CommunicationPreference;
  accessibilityNeeds: AccessibilityNeed[];
  
  // MBTQ Universe flags
  validated: boolean;
  pinkSyncEnabled: boolean;
  reputation: number;
  daoMember: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
  lastLogin: string;
  
  // Extensible metadata
  metadata?: Record<string, unknown>;
}

/**
 * Proof types for identity validation
 */
export type ProofType = 
  | 'community-vouching'
  | 'video-verification'
  | 'document'
  | 'organization'
  | 'self-declared';

/**
 * Validation data for identity verification
 */
export interface ValidationData {
  status: DeafStatus;
  type: ProofType;
  validatorId?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Record of a validation event
 */
export interface ValidationRecord {
  userId: string;
  deafStatus: DeafStatus;
  proofType: ProofType;
  validatedBy?: string;
  validatedAt: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// DEAFAUTH CONFIGURATION
// ============================================

/**
 * Configuration options for DeafAUTH instance
 */
export interface DeafAUTHConfig {
  // Adapters - bring your own auth/db
  authAdapter?: AuthAdapter;
  dbAdapter?: DatabaseAdapter;
  storageAdapter?: StorageAdapter;
  
  // Deaf-first configuration
  requireValidation?: boolean;
  autoCreateProfile?: boolean;
  
  // Feature flags
  enablePinkSync?: boolean;
  enableFibonrose?: boolean;
  
  // External endpoints
  pinkSyncEndpoint?: string;
  fibonroseEndpoint?: string;
  
  // Custom configuration
  [key: string]: unknown;
}

/**
 * Result from authenticate with Deaf profile
 */
export interface DeafAuthResult extends AuthResult {
  deafProfile?: DeafProfile;
}

/**
 * Accessibility preferences update
 */
export interface AccessibilityPreferences {
  language?: SignLanguage;
  communication?: CommunicationPreference;
  needs?: AccessibilityNeed[];
}
