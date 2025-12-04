// DeafAUTH Universal Adapter - Main Export
// Works with ANY auth provider, ANY database, ANY framework
// Deploy in under 5 minutes

// Core class
export { DeafAUTH } from './DeafAUTH';

// Types
export type {
  // Auth types
  AuthResult,
  AuthUser,
  AuthCredentials,
  AuthAdapter,
  
  // Database types
  QueryCondition,
  UpdateOperation,
  DatabaseAdapter,
  
  // Storage types
  StorageAdapter,
  
  // Deaf profile types
  DeafStatus,
  SignLanguage,
  CommunicationPreference,
  AccessibilityNeed,
  DeafProfile,
  ProofType,
  ValidationData,
  ValidationRecord,
  
  // Config types
  DeafAUTHConfig,
  DeafAuthResult,
  AccessibilityPreferences,
} from './types';

// Pre-built auth adapters
export {
  Auth0Adapter,
  FirebaseAuthAdapter,
  ClerkAdapter,
  NextAuthAdapter,
  createAuthAdapter,
} from './adapters/auth-adapters';

// Pre-built database adapters
export {
  SupabaseAdapter,
  FirebaseAdapter,
  MongoAdapter,
  PostgresAdapter,
  createDatabaseAdapter,
} from './adapters/database-adapters';
