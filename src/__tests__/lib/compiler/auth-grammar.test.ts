/**
 * DeafAUTH Auth Grammar Tests
 * Tests for the parser layer
 */

import { AuthGrammar } from '../../../lib/compiler/parser/auth-grammar';
import type {
  OAuth2Schema,
  SAMLSchema,
  FirebaseSchema,
  Auth0Schema,
  UniversalAuthSchema,
} from '../../../lib/compiler/types';

describe('AuthGrammar', () => {
  let grammar: AuthGrammar;

  beforeEach(() => {
    grammar = new AuthGrammar();
  });

  describe('OAuth2 Parsing', () => {
    it('should parse OAuth2 schema', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
        scopes: ['email', 'profile'],
      };

      const ast = grammar.parse(schema);
      
      expect(ast.type).toBe('auth_ast');
      expect(ast.sourceType).toBe('oauth2');
      expect(ast.flows).toHaveLength(1);
      expect(ast.flows[0].name).toBe('oauth2_authorization_code');
    });

    it('should parse OAuth2 with multiple flows', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'custom',
        flows: ['authorization_code', 'implicit'],
      };

      const ast = grammar.parse(schema);
      
      expect(ast.flows).toHaveLength(2);
    });

    it('should include accessibility in OAuth2 AST', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
      };

      const ast = grammar.parse(schema);
      
      expect(ast.accessibility).toBeDefined();
      expect(ast.accessibility.visual_alternatives).toBeDefined();
      expect(ast.accessibility.time_extensions).toBeDefined();
      expect(ast.accessibility.asl_support).toBeDefined();
    });
  });

  describe('SAML Parsing', () => {
    it('should parse SAML schema', () => {
      const schema: SAMLSchema = {
        type: 'saml',
        idp: 'company-sso',
        acs: '/auth/saml/callback',
      };

      const ast = grammar.parse(schema);
      
      expect(ast.sourceType).toBe('saml');
      expect(ast.flows).toHaveLength(1);
      expect(ast.flows[0].name).toBe('saml_sso');
    });

    it('should include SAML metadata in AST', () => {
      const schema: SAMLSchema = {
        type: 'saml',
        idp: 'company-sso',
        acs: '/auth/saml/callback',
        entityId: 'https://company.com/saml',
      };

      const ast = grammar.parse(schema);
      
      expect(ast.metadata.idp).toBe('company-sso');
      expect(ast.metadata.acs).toBe('/auth/saml/callback');
      expect(ast.metadata.entityId).toBe('https://company.com/saml');
    });
  });

  describe('Firebase Parsing', () => {
    it('should parse Firebase schema', () => {
      const schema: FirebaseSchema = {
        type: 'firebase',
        projectId: 'my-project',
      };

      const ast = grammar.parse(schema);
      
      expect(ast.sourceType).toBe('firebase');
      expect(ast.flows.length).toBeGreaterThan(0);
    });

    it('should create multiple Firebase flows', () => {
      const schema: FirebaseSchema = {
        type: 'firebase',
        projectId: 'my-project',
        authDomain: 'my-project.firebaseapp.com',
      };

      const ast = grammar.parse(schema);
      
      expect(ast.flows.some(f => f.name === 'firebase_email')).toBe(true);
      expect(ast.flows.some(f => f.name === 'firebase_social')).toBe(true);
    });
  });

  describe('Auth0 Parsing', () => {
    it('should parse Auth0 schema', () => {
      const schema: Auth0Schema = {
        type: 'auth0',
        domain: 'company.auth0.com',
        clientId: 'abc123',
      };

      const ast = grammar.parse(schema);
      
      expect(ast.sourceType).toBe('auth0');
      expect(ast.flows[0].name).toBe('auth0_universal');
    });

    it('should include Auth0 metadata', () => {
      const schema: Auth0Schema = {
        type: 'auth0',
        domain: 'company.auth0.com',
        clientId: 'abc123',
        audience: 'https://api.company.com',
      };

      const ast = grammar.parse(schema);
      
      expect(ast.metadata.domain).toBe('company.auth0.com');
      expect(ast.metadata.clientId).toBe('abc123');
      expect(ast.metadata.audience).toBe('https://api.company.com');
    });
  });

  describe('Universal Schema Parsing', () => {
    it('should parse universal DeafAUTH schema', () => {
      const schema: UniversalAuthSchema = {
        version: '1.0',
        providers: [{ type: 'deafauth' }],
        methods: ['visual', 'biometric'],
        fallbacks: ['email'],
        accessibility: {
          asl_support: true,
          visual_cues: true,
        },
      };

      const ast = grammar.parse(schema);
      
      expect(ast.sourceType).toBe('deafauth');
      expect(ast.flows).toHaveLength(2); // One for each method
    });

    it('should create flows for each method', () => {
      const schema: UniversalAuthSchema = {
        version: '1.0',
        providers: [{ type: 'deafauth' }],
        methods: ['visual', 'biometric', 'passkey'],
        fallbacks: [],
        accessibility: {},
      };

      const ast = grammar.parse(schema);
      
      expect(ast.flows.some(f => f.name === 'deafauth_visual')).toBe(true);
      expect(ast.flows.some(f => f.name === 'deafauth_biometric')).toBe(true);
      expect(ast.flows.some(f => f.name === 'deafauth_passkey')).toBe(true);
    });
  });

  describe('AST Structure', () => {
    it('should have correct AST structure', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
      };

      const ast = grammar.parse(schema);
      
      expect(ast).toHaveProperty('type');
      expect(ast).toHaveProperty('version');
      expect(ast).toHaveProperty('sourceType');
      expect(ast).toHaveProperty('flows');
      expect(ast).toHaveProperty('accessibility');
      expect(ast).toHaveProperty('metadata');
    });

    it('should have proper flow step structure', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
      };

      const ast = grammar.parse(schema);
      const flow = ast.flows[0];
      
      expect(flow.steps).toHaveLength(4); // initiation, challenge, verification, completion
      expect(flow.steps[0].action).toBe('initiation');
      expect(flow.steps[1].action).toBe('challenge');
      expect(flow.steps[2].action).toBe('verification');
      expect(flow.steps[3].action).toBe('completion');
    });
  });

  describe('Accessibility Defaults', () => {
    it('should include visual alternatives', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
      };

      const ast = grammar.parse(schema);
      
      expect(ast.accessibility.visual_alternatives.length).toBeGreaterThan(0);
      expect(ast.accessibility.visual_alternatives[0].type).toBe('visual_alternative');
    });

    it('should include time extensions', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
      };

      const ast = grammar.parse(schema);
      
      expect(ast.accessibility.time_extensions.length).toBeGreaterThan(0);
      expect(ast.accessibility.time_extensions[0].extendedSeconds).toBeGreaterThan(0);
    });

    it('should include ASL support', () => {
      const schema: OAuth2Schema = {
        type: 'oauth2',
        provider: 'google',
        flows: ['authorization_code'],
      };

      const ast = grammar.parse(schema);
      
      expect(ast.accessibility.asl_support.length).toBeGreaterThan(0);
      expect(ast.accessibility.asl_support[0].enabled).toBe(true);
    });
  });
});
