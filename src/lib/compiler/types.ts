/**
 * DeafAUTH Compiler Types
 * Universal type definitions for the authentication compiler
 */

// Provider types supported by the compiler
export type AuthProviderType = 
  | 'oauth2' 
  | 'saml' 
  | 'openid' 
  | 'firebase' 
  | 'auth0' 
  | 'okta'
  | 'deafauth';

// Authentication methods available
export type AuthMethod = 
  | 'visual' 
  | 'biometric' 
  | 'passkey' 
  | 'qr' 
  | 'sms' 
  | 'email' 
  | 'video';

// Target frameworks for code generation
export type CompilationTarget = 
  | 'react' 
  | 'vue' 
  | 'angular' 
  | 'web-component' 
  | 'api' 
  | 'cli';

// Universal Auth Schema definition
export interface UniversalAuthSchema {
  version: string;
  name?: string;
  providers: AuthProviderConfig[];
  methods: AuthMethod[];
  fallbacks: AuthMethod[];
  accessibility: AccessibilityConfig;
}

// Provider-specific configuration
export interface AuthProviderConfig {
  type: AuthProviderType;
  name?: string;
  config?: Record<string, unknown>;
  enhanced_with?: 'deafauth';
}

// OAuth2-specific schema
export interface OAuth2Schema {
  type: 'oauth2';
  provider: string;
  flows: ('authorization_code' | 'implicit' | 'client_credentials' | 'refresh_token')[];
  scopes?: string[];
  clientId?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
}

// SAML-specific schema
export interface SAMLSchema {
  type: 'saml';
  idp: string;
  acs: string;
  entityId?: string;
  metadata?: string;
}

// Firebase-specific schema
export interface FirebaseSchema {
  type: 'firebase';
  projectId: string;
  apiKey?: string;
  authDomain?: string;
}

// Auth0-specific schema
export interface Auth0Schema {
  type: 'auth0';
  domain: string;
  clientId: string;
  audience?: string;
}

// Accessibility configuration
export interface AccessibilityConfig {
  asl_support?: boolean;
  visual_cues?: boolean;
  time_flexible?: boolean;
  time_extension_seconds?: number;
  no_audio_dependencies?: boolean;
}

// Compilation options
export interface CompileOptions {
  target: CompilationTarget;
  accessibility?: AccessibilityConfig;
  output?: string;
  minify?: boolean;
}

// Input schema type union
export type AuthInputSchema = 
  | OAuth2Schema 
  | SAMLSchema 
  | FirebaseSchema 
  | Auth0Schema 
  | UniversalAuthSchema;

// Compiler input configuration
export interface CompilerInput {
  input: AuthProviderType | AuthInputSchema;
  config?: Record<string, unknown>;
  target: CompilationTarget;
  options?: {
    accessibility?: AccessibilityConfig;
  };
}

// Compilation result
export interface CompilationResult {
  code: string;
  runtime?: string;
  schema?: UniversalAuthSchema;
  target: CompilationTarget;
  metadata: {
    compiledAt: string;
    version: string;
    sourceType: AuthProviderType;
  };
}

// AST Node types for the Intermediate Representation
export interface AuthFlowNode {
  type: 'flow';
  name: string;
  steps: AuthStepNode[];
}

export interface AuthStepNode {
  type: 'step';
  action: 'initiation' | 'challenge' | 'verification' | 'completion';
  params?: Record<string, unknown>;
}

export interface ChallengeNode {
  type: 'challenge';
  method: AuthMethod;
  fallbacks?: AuthMethod[];
  timeLimit?: number;
}

export interface VerificationNode {
  type: 'verification';
  method: AuthMethod;
  confidenceThreshold?: number;
}

export interface CompletionNode {
  type: 'completion';
  success: boolean;
  redirectUrl?: string;
}

// Visual alternatives for accessibility
export interface VisualAuthNode {
  type: 'visual_alternative';
  original: string;
  visual: string;
}

export interface TimeFlexibilityNode {
  type: 'time_flexibility';
  defaultSeconds: number;
  extendedSeconds: number;
}

export interface ASLIntegrationNode {
  type: 'asl_integration';
  enabled: boolean;
  fallbackMethod?: AuthMethod;
}

// Universal Auth AST
export interface AuthAST {
  type: 'auth_ast';
  version: string;
  sourceType: AuthProviderType;
  flows: AuthFlowNode[];
  accessibility: {
    visual_alternatives: VisualAuthNode[];
    time_extensions: TimeFlexibilityNode[];
    asl_support: ASLIntegrationNode[];
  };
  metadata: Record<string, unknown>;
}
