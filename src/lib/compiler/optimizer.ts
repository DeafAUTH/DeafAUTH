/**
 * DeafAUTH Auth Optimizer
 * Optimizes authentication flows for Deaf-first accessibility
 */

import {
  AuthAST,
  AuthFlowNode,
  AuthStepNode,
  VisualAuthNode,
  TimeFlexibilityNode,
  ASLIntegrationNode,
  AccessibilityConfig,
} from './types';

export class AuthOptimizer {
  private defaultAccessibility: AccessibilityConfig = {
    asl_support: true,
    visual_cues: true,
    time_flexible: true,
    time_extension_seconds: 300,
    no_audio_dependencies: true,
  };

  /**
   * Optimize AST for Deaf-first authentication flows
   */
  deafFirstOptimize(
    ast: AuthAST,
    options?: AccessibilityConfig
  ): AuthAST {
    const config = { ...this.defaultAccessibility, ...options };
    
    return {
      ...ast,
      flows: this.optimizeFlows(ast.flows, config),
      accessibility: {
        visual_alternatives: this.enhanceVisualAlternatives(
          ast.accessibility.visual_alternatives,
          config
        ),
        time_extensions: this.enhanceTimeExtensions(
          ast.accessibility.time_extensions,
          config
        ),
        asl_support: this.enhanceASLSupport(
          ast.accessibility.asl_support,
          config
        ),
      },
    };
  }

  /**
   * Optimize authentication flows
   */
  private optimizeFlows(
    flows: AuthFlowNode[],
    config: AccessibilityConfig
  ): AuthFlowNode[] {
    return flows.map(flow => ({
      ...flow,
      steps: this.optimizeSteps(flow.steps, config),
    }));
  }

  /**
   * Optimize individual steps for accessibility
   */
  private optimizeSteps(
    steps: AuthStepNode[],
    config: AccessibilityConfig
  ): AuthStepNode[] {
    return steps.map(step => this.optimizeStep(step, config));
  }

  /**
   * Optimize a single step
   */
  private optimizeStep(
    step: AuthStepNode,
    config: AccessibilityConfig
  ): AuthStepNode {
    const optimizedParams = { ...step.params };

    // Add visual alternatives for challenges
    if (step.action === 'challenge') {
      optimizedParams.visualChallenge = config.visual_cues;
      optimizedParams.noAudioRequired = config.no_audio_dependencies;
      
      if (config.time_flexible) {
        optimizedParams.timeFlexible = true;
        optimizedParams.extendedTimeout = config.time_extension_seconds;
      }
    }

    // Add ASL support for verification
    if (step.action === 'verification') {
      optimizedParams.aslSupport = config.asl_support;
      optimizedParams.visualFeedback = config.visual_cues;
    }

    return {
      ...step,
      params: optimizedParams,
    };
  }

  /**
   * Enhance visual alternatives
   */
  private enhanceVisualAlternatives(
    alternatives: VisualAuthNode[],
    config: AccessibilityConfig
  ): VisualAuthNode[] {
    const enhanced = [...alternatives];

    // Add more visual alternatives if not present
    const requiredAlternatives: VisualAuthNode[] = [
      {
        type: 'visual_alternative',
        original: 'text_notification',
        visual: 'visual_notification_banner',
      },
      {
        type: 'visual_alternative',
        original: 'audio_feedback',
        visual: 'visual_feedback_animation',
      },
    ];

    if (config.visual_cues) {
      for (const alt of requiredAlternatives) {
        if (!enhanced.some(e => e.original === alt.original)) {
          enhanced.push(alt);
        }
      }
    }

    return enhanced;
  }

  /**
   * Enhance time extensions
   */
  private enhanceTimeExtensions(
    extensions: TimeFlexibilityNode[],
    config: AccessibilityConfig
  ): TimeFlexibilityNode[] {
    if (!config.time_flexible) {
      return extensions;
    }

    return extensions.map(ext => ({
      ...ext,
      extendedSeconds: Math.max(
        ext.extendedSeconds,
        config.time_extension_seconds || 300
      ),
    }));
  }

  /**
   * Enhance ASL support
   */
  private enhanceASLSupport(
    support: ASLIntegrationNode[],
    config: AccessibilityConfig
  ): ASLIntegrationNode[] {
    if (!config.asl_support) {
      return support.map(s => ({ ...s, enabled: false }));
    }

    return support.map(s => ({
      ...s,
      enabled: true,
      fallbackMethod: s.fallbackMethod || 'video',
    }));
  }

  /**
   * Remove audio-dependent steps
   */
  removeAudioDependencies(ast: AuthAST): AuthAST {
    return {
      ...ast,
      flows: ast.flows.map(flow => ({
        ...flow,
        steps: flow.steps.filter(step => {
          const method = step.params?.method as string | undefined;
          return method !== 'audio' && method !== 'phone_call';
        }),
      })),
    };
  }

  /**
   * Inject visual challenge support
   */
  injectVisualChallenges(ast: AuthAST): AuthAST {
    return {
      ...ast,
      flows: ast.flows.map(flow => ({
        ...flow,
        steps: flow.steps.map(step => {
          if (step.action === 'challenge') {
            return {
              ...step,
              params: {
                ...step.params,
                visualChallenge: true,
                challengeTypes: ['pattern', 'image_select', 'gesture'],
              },
            };
          }
          return step;
        }),
      })),
    };
  }
}
