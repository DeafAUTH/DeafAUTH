/**
 * DeafAUTH Compiler Tests
 * Tests for the core compiler functionality
 */

import { DeafAUTHCompiler } from '../../../lib/compiler';
import type {
  OAuth2Schema,
  SAMLSchema,
  FirebaseSchema,
  Auth0Schema,
  UniversalAuthSchema,
  CompilationTarget,
  AuthProviderType,
} from '../../../lib/compiler/types';

describe('DeafAUTHCompiler', () => {
  let compiler: DeafAUTHCompiler;

  beforeEach(() => {
    compiler = new DeafAUTHCompiler();
  });

  describe('Core Compiler Methods', () => {
    it('should create compiler instance', () => {
      expect(compiler).toBeInstanceOf(DeafAUTHCompiler);
    });

    it('should return correct version', () => {
      expect(compiler.getVersion()).toBe('1.0.0');
    });

    it('should return supported providers', () => {
      const providers = compiler.getSupportedProviders();
      expect(providers).toContain('oauth2');
      expect(providers).toContain('saml');
      expect(providers).toContain('firebase');
      expect(providers).toContain('auth0');
      expect(providers).toContain('deafauth');
    });

    it('should return supported targets', () => {
      const targets = compiler.getSupportedTargets();
      expect(targets).toContain('react');
      expect(targets).toContain('vue');
      expect(targets).toContain('angular');
      expect(targets).toContain('web-component');
      expect(targets).toContain('api');
      expect(targets).toContain('cli');
    });
  });

  describe('Quick Compile', () => {
    it('should quick compile oauth2 to react', async () => {
      const result = await compiler.quickCompile('oauth2', 'react');
      
      expect(result).toBeDefined();
      expect(result.code).toContain('DeafAuthButton');
      expect(result.target).toBe('react');
      expect(result.metadata.sourceType).toBe('oauth2');
    });

    it('should quick compile firebase to vue', async () => {
      const result = await compiler.quickCompile('firebase', 'vue');
      
      expect(result).toBeDefined();
      expect(result.code).toContain('Visual Sign In');
      expect(result.target).toBe('vue');
    });

    it('should quick compile to web-component', async () => {
      const result = await compiler.quickCompile('deafauth', 'web-component');
      
      expect(result).toBeDefined();
      expect(result.code).toContain('DeafAuthElement');
      expect(result.code).toContain('customElements.define');
    });

    it('should quick compile to api', async () => {
      const result = await compiler.quickCompile('deafauth', 'api');
      
      expect(result).toBeDefined();
      expect(result.code).toContain('handleVisualChallenge');
      expect(result.code).toContain('handleASLVerification');
    });
  });

  describe('OAuth2 Schema Compilation', () => {
    it('should compile OAuth2 schema to react', async () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
        scopes: ['email', 'profile'],
      };

      const result = await compiler.compileSchema(schema, 'react');
      
      expect(result.code).toContain('DeafAuthButton');
      expect(result.code).toContain('visualChallenge');
      expect(result.code).toContain('aslFallback');
      expect(result.metadata.sourceType).toBe('oauth2');
    });

    it('should compile OAuth2 schema to vue', async () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'github',
        flows: ['authorization_code'],
      };

      const result = await compiler.compileSchema(schema, 'vue');
      
      expect(result.code).toContain('template');
      expect(result.code).toContain('Visual Sign In');
      expect(result.target).toBe('vue');
    });
  });

  describe('SAML Schema Compilation', () => {
    it('should compile SAML schema', async () => {
      const schema: SAMLSchema = {
        type: 'saml',
        idp: 'company-sso',
        acs: '/auth/saml/callback',
      };

      const result = await compiler.compileSchema(schema, 'angular');
      
      expect(result.code).toContain('DeafAuthService');
      expect(result.metadata.sourceType).toBe('saml');
    });
  });

  describe('Firebase Schema Compilation', () => {
    it('should compile Firebase schema', async () => {
      const schema: FirebaseSchema = {
        type: 'firebase',
        projectId: 'my-project',
        authDomain: 'my-project.firebaseapp.com',
      };

      const result = await compiler.compileSchema(schema, 'react');
      
      expect(result.code).toBeDefined();
      expect(result.metadata.sourceType).toBe('firebase');
    });
  });

  describe('Auth0 Schema Compilation', () => {
    it('should compile Auth0 schema', async () => {
      const schema: Auth0Schema = {
        type: 'auth0',
        domain: 'company.auth0.com',
        clientId: 'abc123',
        audience: 'https://api.company.com',
      };

      const result = await compiler.compileSchema(schema, 'web-component');
      
      expect(result.code).toContain('DeafAuthElement');
      expect(result.metadata.sourceType).toBe('auth0');
    });
  });

  describe('Universal DeafAUTH Schema Compilation', () => {
    it('should compile universal schema', async () => {
      const schema: UniversalAuthSchema = {
        version: '1.0',
        name: 'Test Auth',
        providers: [{ type: 'deafauth' }],
        methods: ['visual', 'biometric'],
        fallbacks: ['email'],
        accessibility: {
          asl_support: true,
          visual_cues: true,
          time_flexible: true,
        },
      };

      const result = await compiler.compileSchema(schema, 'react');
      
      expect(result.code).toBeDefined();
      expect(result.schema?.accessibility.asl_support).toBe(true);
    });
  });

  describe('Accessibility Options', () => {
    it('should include ASL support in compiled output', async () => {
      const result = await compiler.compileSchema(
        { type: 'oauth2', provider: 'google', flows: ['authorization_code'] },
        'react',
        { asl_support: true }
      );

      expect(result.code).toContain('aslFallback');
      expect(result.schema?.accessibility.asl_support).toBe(true);
    });

    it('should include visual cues in compiled output', async () => {
      const result = await compiler.compileSchema(
        { type: 'oauth2', provider: 'google', flows: ['authorization_code'] },
        'react',
        { visual_cues: true }
      );

      expect(result.code).toContain('visualChallenge');
    });

    it('should include time flexibility in compiled output', async () => {
      const result = await compiler.compileSchema(
        { type: 'oauth2', provider: 'google', flows: ['authorization_code'] },
        'react',
        { time_flexible: true, time_extension_seconds: 600 }
      );

      expect(result.schema?.accessibility.time_flexible).toBe(true);
    });
  });

  describe('Full Compile Method', () => {
    it('should compile with full input object', async () => {
      const result = await compiler.compile({
        input: 'firebase',
        target: 'react',
        options: {
          accessibility: {
            asl_support: true,
            visual_cues: true,
            time_flexible: true,
          },
        },
      });

      expect(result.code).toBeDefined();
      expect(result.runtime).toBeDefined();
      expect(result.schema).toBeDefined();
    });

    it('should compile with schema input object', async () => {
      const result = await compiler.compile({
        input: {
          type: 'oauth2',
          provider: 'google',
          flows: ['authorization_code'],
        } as OAuth2Schema,
        target: 'vue',
      });

      expect(result.code).toBeDefined();
      expect(result.target).toBe('vue');
    });
  });

  describe('Schema Validation', () => {
    it('should validate correct schema', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
      };

      const result = compiler.validateSchema(schema);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate universal schema', () => {
      const schema: UniversalAuthSchema = {
        version: '1.0',
        providers: [{ type: 'deafauth' }],
        methods: ['visual'],
        fallbacks: ['email'],
        accessibility: { asl_support: true },
      };

      const result = compiler.validateSchema(schema);
      expect(result.valid).toBe(true);
    });
  });

  describe('Compilation Metadata', () => {
    it('should include compilation metadata', async () => {
      const result = await compiler.quickCompile('oauth2', 'react');
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata.compiledAt).toBeDefined();
      expect(result.metadata.version).toBe('1.0.0');
      expect(result.metadata.sourceType).toBe('oauth2');
    });
  });

  describe('Runtime Generation', () => {
    it('should generate runtime helpers for react', async () => {
      const result = await compiler.quickCompile('oauth2', 'react');
      
      expect(result.runtime).toBeDefined();
      expect(result.runtime).toContain('visualChallenge');
      expect(result.runtime).toContain('aslVerification');
    });

    it('should generate runtime helpers for api', async () => {
      const result = await compiler.quickCompile('oauth2', 'api');
      
      expect(result.runtime).toBeDefined();
      expect(result.runtime).toContain('createDeafAuthMiddleware');
    });
  });
});
