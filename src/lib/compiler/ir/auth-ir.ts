/**
 * DeafAUTH Auth IR (Intermediate Representation)
 * The "bytecode" of authentication - universal representation
 */

import {
  AuthAST,
  AuthFlowNode,
  AuthStepNode,
  VisualAuthNode,
  TimeFlexibilityNode,
  ASLIntegrationNode,
  AuthProviderType,
} from '../types';

/**
 * IR Node for a complete authentication flow
 */
export interface IRAuthFlow {
  id: string;
  name: string;
  nodes: IRNode[];
  accessibility: IRAccessibility;
}

/**
 * Base IR Node interface
 */
export interface IRNode {
  type: 'initiation' | 'challenge' | 'verification' | 'completion' | 'fallback';
  id: string;
  config: Record<string, unknown>;
  next?: string;
  fallback?: string;
}

/**
 * IR Accessibility configuration
 */
export interface IRAccessibility {
  visualMode: boolean;
  aslEnabled: boolean;
  timeFlexible: boolean;
  extendedTimeoutMs: number;
  noAudioDeps: boolean;
}

/**
 * AuthIR - Converts AST to optimized IR
 */
export class AuthIR {
  private nodeCounter = 0;

  /**
   * Convert AuthAST to IR flows
   */
  toIR(ast: AuthAST): IRAuthFlow[] {
    return ast.flows.map((flow: AuthFlowNode) => this.flowToIR(flow, ast));
  }

  /**
   * Convert a single flow to IR
   */
  private flowToIR(flow: AuthFlowNode, ast: AuthAST): IRAuthFlow {
    const nodes: IRNode[] = [];
    
    for (let i = 0; i < flow.steps.length; i++) {
      const step = flow.steps[i];
      const nodeId = this.generateNodeId();
      const nextId = i < flow.steps.length - 1 ? this.peekNextId() : undefined;
      
      nodes.push(this.stepToNode(step, nodeId, nextId));
    }

    return {
      id: this.generateFlowId(flow.name),
      name: flow.name,
      nodes,
      accessibility: this.extractAccessibility(ast),
    };
  }

  /**
   * Convert a step to an IR node
   */
  private stepToNode(
    step: AuthStepNode,
    id: string,
    nextId?: string
  ): IRNode {
    return {
      type: step.action,
      id,
      config: step.params || {},
      next: nextId,
      fallback: step.params?.fallbackMethod as string | undefined,
    };
  }

  /**
   * Extract accessibility settings from AST
   */
  private extractAccessibility(ast: AuthAST): IRAccessibility {
    const timeExt = ast.accessibility.time_extensions[0];
    const aslSupport = ast.accessibility.asl_support[0];
    const hasVisual = ast.accessibility.visual_alternatives.length > 0;

    return {
      visualMode: hasVisual,
      aslEnabled: aslSupport?.enabled ?? true,
      timeFlexible: timeExt?.extendedSeconds > timeExt?.defaultSeconds,
      extendedTimeoutMs: (timeExt?.extendedSeconds ?? 300) * 1000,
      noAudioDeps: true,
    };
  }

  /**
   * Generate unique node ID
   */
  private generateNodeId(): string {
    return `node_${++this.nodeCounter}`;
  }

  /**
   * Peek at next node ID without incrementing
   */
  private peekNextId(): string {
    return `node_${this.nodeCounter + 1}`;
  }

  /**
   * Generate flow ID from name
   */
  private generateFlowId(name: string): string {
    return `flow_${name.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Reset node counter (useful for testing)
   */
  reset(): void {
    this.nodeCounter = 0;
  }
}

/**
 * IRValidator - Validates IR for correctness
 */
export class IRValidator {
  /**
   * Validate IR flows
   */
  validate(flows: IRAuthFlow[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const flow of flows) {
      this.validateFlow(flow, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single flow
   */
  private validateFlow(
    flow: IRAuthFlow,
    errors: string[],
    warnings: string[]
  ): void {
    if (flow.nodes.length === 0) {
      errors.push(`Flow ${flow.id} has no nodes`);
      return;
    }

    // Check for initiation node
    const hasInitiation = flow.nodes.some(n => n.type === 'initiation');
    if (!hasInitiation) {
      errors.push(`Flow ${flow.id} missing initiation node`);
    }

    // Check for completion node
    const hasCompletion = flow.nodes.some(n => n.type === 'completion');
    if (!hasCompletion) {
      errors.push(`Flow ${flow.id} missing completion node`);
    }

    // Warn if no challenge node
    const hasChallenge = flow.nodes.some(n => n.type === 'challenge');
    if (!hasChallenge) {
      warnings.push(`Flow ${flow.id} has no challenge node`);
    }

    // Check accessibility
    if (!flow.accessibility.visualMode) {
      warnings.push(`Flow ${flow.id} has visual mode disabled`);
    }

    if (!flow.accessibility.aslEnabled) {
      warnings.push(`Flow ${flow.id} has ASL support disabled`);
    }
  }
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
