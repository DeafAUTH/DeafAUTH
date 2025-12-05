/**
 * DeafAUTH Compiler
 * Universal Auth Compiler that transforms any authentication system
 * into a Deaf-first, accessible version
 */

import { AuthGrammar } from './parser/auth-grammar';
import { AuthOptimizer } from './optimizer';
import { AuthIR, IRValidator } from './ir/auth-ir';
import { CodeEmitter } from './emitters/code-emitter';
import {
  AuthInputSchema,
  AuthProviderType,
  CompilationTarget,
  CompilationResult,
  CompilerInput,
  AccessibilityConfig,
  UniversalAuthSchema,
  OAuth2Schema,
  SAMLSchema,
  FirebaseSchema,
  Auth0Schema,
} from './types';

/**
 * DeafAUTH Compiler - The core compiler class
 * Compiles ANY auth schema to ANY target with Deaf-first accessibility
 */
export class DeafAUTHCompiler {
  private grammar: AuthGrammar;
  private optimizer: AuthOptimizer;
  private ir: AuthIR;
  private validator: IRValidator;
  private emitter: CodeEmitter;
  private version = '1.0.0';

  constructor() {
    this.grammar = new AuthGrammar();
    this.optimizer = new AuthOptimizer();
    this.ir = new AuthIR();
    this.validator = new IRValidator();
    this.emitter = new CodeEmitter();
  }

  /**
   * Compile any authentication schema to a target framework
   * with Deaf-first accessibility enhancements
   */
  async compile(input: CompilerInput): Promise<CompilationResult> {
    // 1. Resolve input schema
    const schema = this.resolveInputSchema(input);

    // 2. Parse to Universal Auth AST
    const ast = this.grammar.parse(schema);

    // 3. Optimize for Deaf-first flows
    const optimizedAst = this.optimizer.deafFirstOptimize(
      ast,
      input.options?.accessibility
    );

    // 4. Convert to IR
    const irFlows = this.ir.toIR(optimizedAst);

    // 5. Validate IR
    const validation = this.validator.validate(irFlows);
    if (!validation.valid) {
      throw new Error(`IR Validation failed: ${validation.errors.join(', ')}`);
    }

    // 6. Emit framework-specific code
    const result = this.emitter.emit(irFlows, input.target, ast.sourceType);

    // 7. Attach enhanced schema
    return {
      ...result,
      schema: this.createEnhancedSchema(schema, input.options?.accessibility),
    };
  }

  /**
   * Compile with schema object directly
   */
  async compileSchema(
    schema: AuthInputSchema,
    target: CompilationTarget,
    accessibility?: AccessibilityConfig
  ): Promise<CompilationResult> {
    return this.compile({
      input: schema,
      target,
      options: { accessibility },
    });
  }

  /**
   * Quick compile with minimal configuration
   */
  async quickCompile(
    provider: AuthProviderType,
    target: CompilationTarget
  ): Promise<CompilationResult> {
    const schema = this.createDefaultSchema(provider);
    return this.compileSchema(schema, target);
  }

  /**
   * Resolve input to proper schema
   */
  private resolveInputSchema(input: CompilerInput): AuthInputSchema {
    if (typeof input.input === 'string') {
      return this.createDefaultSchema(input.input as AuthProviderType);
    }
    return input.input as AuthInputSchema;
  }

  /**
   * Create default schema for a provider type
   */
  private createDefaultSchema(provider: AuthProviderType): AuthInputSchema {
    switch (provider) {
      case 'oauth2':
        return {
          type: 'oauth2',
          provider: 'default',
          flows: ['authorization_code'],
          scopes: ['email', 'profile'],
        } as OAuth2Schema;

      case 'saml':
        return {
          type: 'saml',
          idp: 'default-idp',
          acs: '/auth/saml/callback',
        } as SAMLSchema;

      case 'firebase':
        return {
          type: 'firebase',
          projectId: 'default-project',
        } as FirebaseSchema;

      case 'auth0':
        return {
          type: 'auth0',
          domain: 'default.auth0.com',
          clientId: 'default-client-id',
        } as Auth0Schema;

      case 'deafauth':
      default:
        return {
          version: '1.0',
          providers: [{ type: 'deafauth' }],
          methods: ['visual', 'biometric', 'passkey'],
          fallbacks: ['email', 'video'],
          accessibility: {
            asl_support: true,
            visual_cues: true,
            time_flexible: true,
          },
        } as UniversalAuthSchema;
    }
  }

  /**
   * Create enhanced schema with accessibility features
   */
  private createEnhancedSchema(
    original: AuthInputSchema,
    accessibility?: AccessibilityConfig
  ): UniversalAuthSchema {
    const defaultAccessibility: AccessibilityConfig = {
      asl_support: true,
      visual_cues: true,
      time_flexible: true,
      time_extension_seconds: 300,
      no_audio_dependencies: true,
    };

    // Handle UniversalAuthSchema type
    if ('version' in original && 'providers' in original) {
      const universalSchema = original as UniversalAuthSchema;
      return {
        ...universalSchema,
        accessibility: {
          ...defaultAccessibility,
          ...universalSchema.accessibility,
          ...accessibility,
        },
      };
    }

    // Convert other schema types to UniversalAuthSchema
    return {
      version: this.version,
      name: `DeafAUTH Enhanced ${(original as AuthInputSchema & { type: string }).type}`,
      providers: [
        {
          type: (original as AuthInputSchema & { type: string }).type as AuthProviderType,
          enhanced_with: 'deafauth',
        },
      ],
      methods: ['visual', 'biometric', 'passkey'],
      fallbacks: ['email', 'video'],
      accessibility: {
        ...defaultAccessibility,
        ...accessibility,
      },
    };
  }

  /**
   * Get compiler version
   */
  getVersion(): string {
    return this.version;
  }

  /**
   * Get supported providers
   */
  getSupportedProviders(): AuthProviderType[] {
    return ['oauth2', 'saml', 'openid', 'firebase', 'auth0', 'okta', 'deafauth'];
  }

  /**
   * Get supported targets
   */
  getSupportedTargets(): CompilationTarget[] {
    return ['react', 'vue', 'angular', 'web-component', 'api', 'cli'];
  }

  /**
   * Validate a schema without compiling
   */
  validateSchema(schema: AuthInputSchema): { valid: boolean; errors: string[] } {
    try {
      const ast = this.grammar.parse(schema);
      const irFlows = this.ir.toIR(ast);
      const validation = this.validator.validate(irFlows);
      return validation;
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown validation error'],
      };
    }
  }
}

// Export everything for public API
export * from './types';
export * from './parser/auth-grammar';
export * from './optimizer';
export * from './ir/auth-ir';
export * from './emitters/code-emitter';
export * from './runtime/visual-challenge';
export * from './runtime/asl-verification';
export * from './runtime/biometric-fallback';
