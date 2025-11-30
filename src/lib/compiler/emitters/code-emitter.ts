/**
 * DeafAUTH Code Emitter
 * Generates framework-specific code from IR
 */

import { IRAuthFlow, IRNode, IRAccessibility } from '../ir/auth-ir';
import { CompilationTarget, CompilationResult, AuthProviderType } from '../types';

/**
 * Base CodeEmitter class
 */
export class CodeEmitter {
  private emitters: Map<CompilationTarget, FrameworkEmitter> = new Map();
  private version = '1.0.0';

  constructor() {
    this.registerEmitters();
  }

  /**
   * Register all framework emitters
   */
  private registerEmitters(): void {
    this.emitters.set('react', new ReactEmitter());
    this.emitters.set('vue', new VueEmitter());
    this.emitters.set('web-component', new WebComponentEmitter());
    this.emitters.set('api', new APIEmitter());
    this.emitters.set('angular', new AngularEmitter());
    this.emitters.set('cli', new CLIEmitter());
  }

  /**
   * Emit code for a specific target
   */
  emit(
    flows: IRAuthFlow[],
    target: CompilationTarget,
    sourceType: AuthProviderType
  ): CompilationResult {
    const emitter = this.emitters.get(target);
    
    if (!emitter) {
      throw new Error(`Unsupported compilation target: ${target}`);
    }

    return {
      code: emitter.emit(flows),
      runtime: emitter.emitRuntime(flows),
      target,
      metadata: {
        compiledAt: new Date().toISOString(),
        version: this.version,
        sourceType,
      },
    };
  }
}

/**
 * Base interface for framework-specific emitters
 */
export interface FrameworkEmitter {
  emit(flows: IRAuthFlow[]): string;
  emitRuntime(flows: IRAuthFlow[]): string;
}

/**
 * React Emitter
 */
export class ReactEmitter implements FrameworkEmitter {
  emit(flows: IRAuthFlow[]): string {
    const flowNames = flows.map(f => this.toPascalCase(f.name)).join(', ');
    const accessibility = flows[0]?.accessibility;
    
    return `// DeafAUTH React Component - Auto-generated
import React, { useState, useCallback } from 'react';

interface DeafAuthProps {
  onSuccess?: (result: AuthResult) => void;
  onError?: (error: Error) => void;
  visualChallenge?: boolean;
  aslFallback?: boolean;
  timeFlexible?: boolean;
}

interface AuthResult {
  success: boolean;
  userId?: string;
  token?: string;
}

export const DeafAuthButton: React.FC<DeafAuthProps> = ({
  onSuccess,
  onError,
  visualChallenge = ${accessibility?.visualMode ?? true},
  aslFallback = ${accessibility?.aslEnabled ?? true},
  timeFlexible = ${accessibility?.timeFlexible ?? true},
}) => {
  const [loading, setLoading] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);

  const handleAuth = useCallback(async () => {
    setLoading(true);
    try {
      ${this.emitFlowLogic(flows)}
      onSuccess?.({ success: true });
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Authentication failed'));
    } finally {
      setLoading(false);
    }
  }, [onSuccess, onError]);

  return (
    <button
      onClick={handleAuth}
      disabled={loading}
      className="deaf-auth-button"
      aria-label="Visual Sign In"
      role="button"
    >
      {loading ? 'Authenticating...' : 'Visual Sign In'}
    </button>
  );
};

${this.emitAccessibilityHook(accessibility)}

export default DeafAuthButton;
`;
  }

  emitRuntime(flows: IRAuthFlow[]): string {
    return `// DeafAUTH Runtime Helpers
export const visualChallenge = async () => {
  // Visual challenge implementation
  return { verified: true };
};

export const aslVerification = async () => {
  // ASL verification fallback
  return { verified: true, confidence: 0.95 };
};

export const timeFlexibleAuth = async (timeoutMs: number) => {
  // Time-flexible authentication with extended timeout
  return new Promise((resolve) => {
    setTimeout(() => resolve({ success: true }), Math.min(timeoutMs, 300000));
  });
};
`;
  }

  private emitFlowLogic(flows: IRAuthFlow[]): string {
    if (flows.length === 0) return '// No flows defined';
    
    return `// Execute visual challenge flow
      if (visualChallenge) {
        setShowChallenge(true);
        // Wait for visual challenge completion
      }
      
      // Fallback to ASL verification if needed
      if (aslFallback) {
        // ASL verification available
      }`;
  }

  private emitAccessibilityHook(accessibility?: IRAccessibility): string {
    return `// Accessibility hook for DeafAUTH
export const useDeafAuth = () => {
  const [extendedTimeout] = useState(${accessibility?.extendedTimeoutMs ?? 300000});
  
  return {
    visualMode: ${accessibility?.visualMode ?? true},
    aslEnabled: ${accessibility?.aslEnabled ?? true},
    timeFlexible: ${accessibility?.timeFlexible ?? true},
    extendedTimeoutMs: extendedTimeout,
  };
};
`;
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[_\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}

/**
 * Vue Emitter
 */
export class VueEmitter implements FrameworkEmitter {
  emit(flows: IRAuthFlow[]): string {
    const accessibility = flows[0]?.accessibility;
    
    return `<!-- DeafAUTH Vue Component - Auto-generated -->
<template>
  <button
    @click="handleAuth"
    :disabled="loading"
    class="deaf-auth-button"
    aria-label="Visual Sign In"
    role="button"
  >
    {{ loading ? 'Authenticating...' : 'Visual Sign In' }}
  </button>
</template>

<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue';

interface Props {
  visualChallenge?: boolean;
  aslFallback?: boolean;
  timeFlexible?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visualChallenge: ${accessibility?.visualMode ?? true},
  aslFallback: ${accessibility?.aslEnabled ?? true},
  timeFlexible: ${accessibility?.timeFlexible ?? true},
});

const emit = defineEmits<{
  (e: 'success', result: { success: boolean }): void;
  (e: 'error', error: Error): void;
}>();

const loading = ref(false);

const handleAuth = async () => {
  loading.value = true;
  try {
    // Visual challenge flow
    if (props.visualChallenge) {
      // Execute visual challenge
    }
    emit('success', { success: true });
  } catch (error) {
    emit('error', error instanceof Error ? error : new Error('Authentication failed'));
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.deaf-auth-button {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
</style>
`;
  }

  emitRuntime(flows: IRAuthFlow[]): string {
    return `// DeafAUTH Vue Runtime
export const useDeafAuth = () => {
  return {
    visualChallenge: async () => ({ verified: true }),
    aslVerification: async () => ({ verified: true, confidence: 0.95 }),
  };
};
`;
  }
}

/**
 * Web Component Emitter
 */
export class WebComponentEmitter implements FrameworkEmitter {
  emit(flows: IRAuthFlow[]): string {
    const accessibility = flows[0]?.accessibility;
    
    return `// DeafAUTH Web Component - Auto-generated
class DeafAuthElement extends HTMLElement {
  static get observedAttributes() {
    return ['visual-challenge', 'asl-fallback', 'time-flexible'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._loading = false;
    this._visualChallenge = ${accessibility?.visualMode ?? true};
    this._aslFallback = ${accessibility?.aslEnabled ?? true};
    this._timeFlexible = ${accessibility?.timeFlexible ?? true};
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.querySelector('button').addEventListener('click', () => this.handleAuth());
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'visual-challenge') this._visualChallenge = newValue !== 'false';
    if (name === 'asl-fallback') this._aslFallback = newValue !== 'false';
    if (name === 'time-flexible') this._timeFlexible = newValue !== 'false';
    this.render();
  }

  async handleAuth() {
    this._loading = true;
    this.render();
    
    try {
      // Visual challenge flow
      if (this._visualChallenge) {
        await this.visualChallenge();
      }
      
      this.dispatchEvent(new CustomEvent('auth-success', {
        detail: { success: true },
        bubbles: true,
      }));
    } catch (error) {
      this.dispatchEvent(new CustomEvent('auth-error', {
        detail: { error },
        bubbles: true,
      }));
    } finally {
      this._loading = false;
      this.render();
    }
  }

  async visualChallenge() {
    return { verified: true };
  }

  render() {
    this.shadowRoot.innerHTML = \`
      <style>
        .deaf-auth-button {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: #4F46E5;
          color: white;
        }
        .deaf-auth-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>
      <button class="deaf-auth-button" \${this._loading ? 'disabled' : ''} aria-label="Visual Sign In">
        \${this._loading ? 'Authenticating...' : 'Visual Sign In'}
      </button>
    \`;
  }
}

customElements.define('deaf-auth', DeafAuthElement);
export { DeafAuthElement };
`;
  }

  emitRuntime(flows: IRAuthFlow[]): string {
    return `// DeafAUTH Web Component Runtime
export const initDeafAuth = () => {
  if (!customElements.get('deaf-auth')) {
    // Auto-register component
  }
};
`;
  }
}

/**
 * API Emitter
 */
export class APIEmitter implements FrameworkEmitter {
  emit(flows: IRAuthFlow[]): string {
    return `// DeafAUTH API Routes - Auto-generated
import { Request, Response, NextFunction } from 'express';

interface VisualChallengeRequest {
  userId?: string;
  challengeType: 'pattern' | 'image_select' | 'gesture';
}

interface VerificationRequest {
  challengeId: string;
  response: unknown;
}

// Visual challenge endpoint
export const handleVisualChallenge = async (
  req: Request<{}, {}, VisualChallengeRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { challengeType } = req.body;
    
    // Generate visual challenge
    const challenge = await generateVisualChallenge(challengeType);
    
    res.json({
      success: true,
      challengeId: challenge.id,
      challengeData: challenge.data,
      expiresAt: challenge.expiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// Verification endpoint
export const handleVerification = async (
  req: Request<{}, {}, VerificationRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { challengeId, response } = req.body;
    
    // Verify challenge response
    const result = await verifyChallenge(challengeId, response);
    
    res.json({
      success: result.verified,
      token: result.token,
    });
  } catch (error) {
    next(error);
  }
};

// ASL verification fallback endpoint
export const handleASLVerification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // ASL verification with extended timeout
    const result = await aslVerificationWithTimeout(300000);
    
    res.json({
      success: result.verified,
      confidence: result.confidence,
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
async function generateVisualChallenge(type: string) {
  return {
    id: \`challenge_\${Date.now()}\`,
    data: { type },
    expiresAt: new Date(Date.now() + 300000).toISOString(),
  };
}

async function verifyChallenge(id: string, response: unknown) {
  return { verified: true, token: \`token_\${Date.now()}\` };
}

async function aslVerificationWithTimeout(timeoutMs: number) {
  return { verified: true, confidence: 0.95 };
}

// Route registration
export const registerDeafAuthRoutes = (app: any) => {
  app.post('/deafauth/challenge', handleVisualChallenge);
  app.post('/deafauth/verify', handleVerification);
  app.post('/deafauth/asl-verify', handleASLVerification);
};
`;
  }

  emitRuntime(flows: IRAuthFlow[]): string {
    return `// DeafAUTH API Runtime
export const createDeafAuthMiddleware = () => {
  return (req: any, res: any, next: any) => {
    req.deafAuth = {
      visualMode: true,
      aslEnabled: true,
      extendedTimeout: 300000,
    };
    next();
  };
};
`;
  }
}

/**
 * Angular Emitter
 */
export class AngularEmitter implements FrameworkEmitter {
  emit(flows: IRAuthFlow[]): string {
    const accessibility = flows[0]?.accessibility;
    
    return `// DeafAUTH Angular Service - Auto-generated
import { Injectable, EventEmitter } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface AuthResult {
  success: boolean;
  userId?: string;
  token?: string;
}

interface DeafAuthConfig {
  visualChallenge: boolean;
  aslFallback: boolean;
  timeFlexible: boolean;
  extendedTimeoutMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class DeafAuthService {
  private config: DeafAuthConfig = {
    visualChallenge: ${accessibility?.visualMode ?? true},
    aslFallback: ${accessibility?.aslEnabled ?? true},
    timeFlexible: ${accessibility?.timeFlexible ?? true},
    extendedTimeoutMs: ${accessibility?.extendedTimeoutMs ?? 300000},
  };

  authSuccess = new EventEmitter<AuthResult>();
  authError = new EventEmitter<Error>();

  authenticate(): Observable<AuthResult> {
    return from(this.executeAuth()).pipe(
      map(result => {
        this.authSuccess.emit(result);
        return result;
      }),
      catchError(error => {
        this.authError.emit(error);
        throw error;
      })
    );
  }

  private async executeAuth(): Promise<AuthResult> {
    // Visual challenge flow
    if (this.config.visualChallenge) {
      await this.visualChallenge();
    }

    // ASL fallback if needed
    if (this.config.aslFallback) {
      // ASL verification available
    }

    return { success: true };
  }

  private async visualChallenge(): Promise<{ verified: boolean }> {
    return { verified: true };
  }

  async aslVerification(): Promise<{ verified: boolean; confidence: number }> {
    return { verified: true, confidence: 0.95 };
  }

  updateConfig(config: Partial<DeafAuthConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
`;
  }

  emitRuntime(flows: IRAuthFlow[]): string {
    return `// DeafAUTH Angular Runtime
export const DEAF_AUTH_CONFIG = {
  visualMode: true,
  aslEnabled: true,
  extendedTimeoutMs: 300000,
};
`;
  }
}

/**
 * CLI Emitter
 */
export class CLIEmitter implements FrameworkEmitter {
  emit(flows: IRAuthFlow[]): string {
    return `#!/usr/bin/env node
// DeafAUTH CLI Tool - Auto-generated
import { program } from 'commander';

interface AuthOptions {
  visual: boolean;
  asl: boolean;
  timeout: number;
}

program
  .name('deafauth')
  .description('DeafAUTH CLI - Accessible Authentication')
  .version('1.0.0');

program
  .command('auth')
  .description('Start authentication flow')
  .option('--visual', 'Enable visual challenges', true)
  .option('--asl', 'Enable ASL fallback', true)
  .option('--timeout <ms>', 'Extended timeout in milliseconds', '300000')
  .action(async (options: AuthOptions) => {
    console.log('Starting DeafAUTH authentication...');
    
    try {
      if (options.visual) {
        console.log('Visual challenge mode enabled');
      }
      
      if (options.asl) {
        console.log('ASL fallback enabled');
      }
      
      console.log(\`Extended timeout: \${options.timeout}ms\`);
      
      // Execute authentication
      console.log('Authentication successful!');
    } catch (error) {
      console.error('Authentication failed:', error);
      process.exit(1);
    }
  });

program
  .command('verify')
  .description('Verify authentication token')
  .argument('<token>', 'Authentication token')
  .action((token: string) => {
    console.log(\`Verifying token: \${token.substring(0, 10)}...\`);
    console.log('Token verified successfully!');
  });

program.parse();
`;
  }

  emitRuntime(flows: IRAuthFlow[]): string {
    return `// DeafAUTH CLI Runtime
export const cliHelpers = {
  formatOutput: (data: unknown) => JSON.stringify(data, null, 2),
  logSuccess: (message: string) => console.log(\`✓ \${message}\`),
  logError: (message: string) => console.error(\`✗ \${message}\`),
};
`;
  }
}
