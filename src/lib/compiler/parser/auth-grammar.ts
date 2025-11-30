/**
 * DeafAUTH Auth Grammar - Parser Layer
 * Parses various authentication schemas into a Universal Auth AST
 */

import {
  AuthAST,
  AuthFlowNode,
  AuthInputSchema,
  AuthProviderType,
  OAuth2Schema,
  SAMLSchema,
  FirebaseSchema,
  Auth0Schema,
  UniversalAuthSchema,
  VisualAuthNode,
  TimeFlexibilityNode,
  ASLIntegrationNode,
} from './types';

export class AuthGrammar {
  private version = '1.0.0';

  /**
   * Parse any authentication schema into Universal Auth AST
   */
  parse(schema: AuthInputSchema): AuthAST {
    const sourceType = this.detectSourceType(schema);
    
    switch (sourceType) {
      case 'oauth2':
        return this.parseOAuth2(schema as OAuth2Schema);
      case 'saml':
        return this.parseSAML(schema as SAMLSchema);
      case 'firebase':
        return this.parseFirebase(schema as FirebaseSchema);
      case 'auth0':
        return this.parseAuth0(schema as Auth0Schema);
      default:
        return this.parseUniversal(schema as UniversalAuthSchema);
    }
  }

  /**
   * Detect the source type from the schema
   */
  private detectSourceType(schema: AuthInputSchema): AuthProviderType {
    if ('type' in schema) {
      return schema.type as AuthProviderType;
    }
    if ('version' in schema && 'providers' in schema) {
      return 'deafauth';
    }
    throw new Error('Unable to detect authentication schema type');
  }

  /**
   * Parse OAuth2 schema
   */
  private parseOAuth2(schema: OAuth2Schema): AuthAST {
    const flows: AuthFlowNode[] = schema.flows.map(flow => ({
      type: 'flow' as const,
      name: `oauth2_${flow}`,
      steps: [
        { type: 'step' as const, action: 'initiation' as const, params: { flow, provider: schema.provider } },
        { type: 'step' as const, action: 'challenge' as const, params: { method: 'redirect', scopes: schema.scopes } },
        { type: 'step' as const, action: 'verification' as const, params: { token: true } },
        { type: 'step' as const, action: 'completion' as const, params: { success: true } },
      ],
    }));

    return this.createAST('oauth2', flows, {
      provider: schema.provider,
      scopes: schema.scopes,
    });
  }

  /**
   * Parse SAML schema
   */
  private parseSAML(schema: SAMLSchema): AuthAST {
    const flows: AuthFlowNode[] = [{
      type: 'flow' as const,
      name: 'saml_sso',
      steps: [
        { type: 'step' as const, action: 'initiation' as const, params: { idp: schema.idp } },
        { type: 'step' as const, action: 'challenge' as const, params: { method: 'saml_redirect', acs: schema.acs } },
        { type: 'step' as const, action: 'verification' as const, params: { assertion: true } },
        { type: 'step' as const, action: 'completion' as const, params: { success: true } },
      ],
    }];

    return this.createAST('saml', flows, {
      idp: schema.idp,
      acs: schema.acs,
      entityId: schema.entityId,
    });
  }

  /**
   * Parse Firebase schema
   */
  private parseFirebase(schema: FirebaseSchema): AuthAST {
    const flows: AuthFlowNode[] = [
      {
        type: 'flow' as const,
        name: 'firebase_email',
        steps: [
          { type: 'step' as const, action: 'initiation' as const, params: { projectId: schema.projectId } },
          { type: 'step' as const, action: 'challenge' as const, params: { method: 'email_password' } },
          { type: 'step' as const, action: 'verification' as const, params: { firebase: true } },
          { type: 'step' as const, action: 'completion' as const, params: { success: true } },
        ],
      },
      {
        type: 'flow' as const,
        name: 'firebase_social',
        steps: [
          { type: 'step' as const, action: 'initiation' as const, params: { projectId: schema.projectId } },
          { type: 'step' as const, action: 'challenge' as const, params: { method: 'social_provider' } },
          { type: 'step' as const, action: 'verification' as const, params: { firebase: true } },
          { type: 'step' as const, action: 'completion' as const, params: { success: true } },
        ],
      },
    ];

    return this.createAST('firebase', flows, {
      projectId: schema.projectId,
      authDomain: schema.authDomain,
    });
  }

  /**
   * Parse Auth0 schema
   */
  private parseAuth0(schema: Auth0Schema): AuthAST {
    const flows: AuthFlowNode[] = [{
      type: 'flow' as const,
      name: 'auth0_universal',
      steps: [
        { type: 'step' as const, action: 'initiation' as const, params: { domain: schema.domain } },
        { type: 'step' as const, action: 'challenge' as const, params: { method: 'universal_login', clientId: schema.clientId } },
        { type: 'step' as const, action: 'verification' as const, params: { auth0: true, audience: schema.audience } },
        { type: 'step' as const, action: 'completion' as const, params: { success: true } },
      ],
    }];

    return this.createAST('auth0', flows, {
      domain: schema.domain,
      clientId: schema.clientId,
      audience: schema.audience,
    });
  }

  /**
   * Parse Universal DeafAUTH schema
   */
  private parseUniversal(schema: UniversalAuthSchema): AuthAST {
    const flows: AuthFlowNode[] = schema.methods.map(method => ({
      type: 'flow' as const,
      name: `deafauth_${method}`,
      steps: [
        { type: 'step' as const, action: 'initiation' as const, params: { method } },
        { type: 'step' as const, action: 'challenge' as const, params: { method, fallbacks: schema.fallbacks } },
        { type: 'step' as const, action: 'verification' as const, params: { method } },
        { type: 'step' as const, action: 'completion' as const, params: { success: true } },
      ],
    }));

    return this.createAST('deafauth', flows, {
      providers: schema.providers,
      accessibility: schema.accessibility,
    });
  }

  /**
   * Create a Universal Auth AST with default accessibility features
   */
  private createAST(
    sourceType: AuthProviderType,
    flows: AuthFlowNode[],
    metadata: Record<string, unknown>
  ): AuthAST {
    return {
      type: 'auth_ast',
      version: this.version,
      sourceType,
      flows,
      accessibility: {
        visual_alternatives: this.createVisualAlternatives(sourceType),
        time_extensions: this.createTimeExtensions(),
        asl_support: this.createASLSupport(),
      },
      metadata,
    };
  }

  /**
   * Create visual alternatives for the auth flow
   */
  private createVisualAlternatives(sourceType: AuthProviderType): VisualAuthNode[] {
    return [
      {
        type: 'visual_alternative',
        original: `${sourceType}_redirect`,
        visual: 'visual_challenge_modal',
      },
      {
        type: 'visual_alternative',
        original: 'audio_captcha',
        visual: 'visual_captcha',
      },
      {
        type: 'visual_alternative',
        original: 'phone_verification',
        visual: 'video_verification',
      },
    ];
  }

  /**
   * Create time extension settings
   */
  private createTimeExtensions(): TimeFlexibilityNode[] {
    return [
      {
        type: 'time_flexibility',
        defaultSeconds: 60,
        extendedSeconds: 300,
      },
    ];
  }

  /**
   * Create ASL support settings
   */
  private createASLSupport(): ASLIntegrationNode[] {
    return [
      {
        type: 'asl_integration',
        enabled: true,
        fallbackMethod: 'video',
      },
    ];
  }
}
