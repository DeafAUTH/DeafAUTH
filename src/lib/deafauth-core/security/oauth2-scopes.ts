// DeafAUTH Security - OAuth2 Scopes
// Define and manage OAuth2 scopes for third-party access control

import type { OAuth2Scope, ScopeCategory, SensitivityLevel, Permission } from './types';

/**
 * Default DeafAUTH OAuth2 scopes
 * These define what third-party applications can access
 */
export const DEFAULT_SCOPES: Record<string, OAuth2Scope> = {
  // Profile scopes
  'profile:read': {
    name: 'profile:read',
    description: 'Read basic profile information (name, email)',
    category: 'profile',
    permissions: [
      { resource: 'profile', action: 'read' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'protected',
  },
  'profile:write': {
    name: 'profile:write',
    description: 'Update profile information',
    category: 'profile',
    permissions: [
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'write' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'protected',
  },

  // Identity scopes
  'identity:read': {
    name: 'identity:read',
    description: 'Read Deaf identity status and verification',
    category: 'identity',
    permissions: [
      { resource: 'deaf_status', action: 'read' },
      { resource: 'validation', action: 'read' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'sensitive',
  },
  'identity:verify': {
    name: 'identity:verify',
    description: 'Check if user has verified Deaf identity',
    category: 'identity',
    permissions: [
      { resource: 'validation', action: 'read', conditions: [
        { field: 'scope', operator: 'eq', value: 'status_only' }
      ]}
    ],
    requiresConsent: true,
    sensitivityLevel: 'protected',
  },

  // Preferences scopes
  'preferences:read': {
    name: 'preferences:read',
    description: 'Read accessibility preferences and settings',
    category: 'preferences',
    permissions: [
      { resource: 'preferences', action: 'read' },
      { resource: 'accessibility', action: 'read' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'protected',
  },
  'preferences:write': {
    name: 'preferences:write',
    description: 'Update accessibility preferences',
    category: 'preferences',
    permissions: [
      { resource: 'preferences', action: 'read' },
      { resource: 'preferences', action: 'write' },
      { resource: 'accessibility', action: 'read' },
      { resource: 'accessibility', action: 'write' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'protected',
  },

  // Validation scopes (community features)
  'validation:read': {
    name: 'validation:read',
    description: 'Read validation history and reputation',
    category: 'validation',
    permissions: [
      { resource: 'validation', action: 'read' },
      { resource: 'reputation', action: 'read' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'sensitive',
  },
  'validation:submit': {
    name: 'validation:submit',
    description: 'Submit community validations for other users',
    category: 'validation',
    permissions: [
      { resource: 'validation', action: 'write' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'restricted',
  },

  // OpenID Connect compatible scopes
  'openid': {
    name: 'openid',
    description: 'OpenID Connect identity token',
    category: 'readonly',
    permissions: [
      { resource: 'id_token', action: 'read' }
    ],
    requiresConsent: false,
    sensitivityLevel: 'public',
  },
  'email': {
    name: 'email',
    description: 'Email address access',
    category: 'profile',
    permissions: [
      { resource: 'email', action: 'read' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'protected',
  },

  // Administrative scopes
  'admin:read': {
    name: 'admin:read',
    description: 'Administrative read access',
    category: 'admin',
    permissions: [
      { resource: '*', action: 'read' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'restricted',
  },
  'admin:write': {
    name: 'admin:write',
    description: 'Full administrative access',
    category: 'admin',
    permissions: [
      { resource: '*', action: '*' }
    ],
    requiresConsent: true,
    sensitivityLevel: 'restricted',
  },
};

/**
 * Scope Manager for OAuth2 scopes
 * 
 * Manages scope definitions, validation, and permission checking.
 * 
 * @example
 * ```typescript
 * const scopeManager = new ScopeManager();
 * 
 * // Validate requested scopes
 * const validation = scopeManager.validateScopes(['profile:read', 'identity:read']);
 * 
 * // Check if scopes allow an action
 * const canRead = scopeManager.hasPermission(['profile:read'], 'profile', 'read');
 * ```
 */
export class ScopeManager {
  private scopes: Map<string, OAuth2Scope>;

  constructor(customScopes?: Record<string, OAuth2Scope>) {
    this.scopes = new Map(Object.entries({ ...DEFAULT_SCOPES, ...customScopes }));
  }

  /**
   * Get a scope definition by name
   */
  getScope(scopeName: string): OAuth2Scope | undefined {
    return this.scopes.get(scopeName);
  }

  /**
   * Get all registered scopes
   */
  getAllScopes(): OAuth2Scope[] {
    return Array.from(this.scopes.values());
  }

  /**
   * Get scopes by category
   */
  getScopesByCategory(category: ScopeCategory): OAuth2Scope[] {
    return this.getAllScopes().filter(scope => scope.category === category);
  }

  /**
   * Get scopes by sensitivity level
   */
  getScopesBySensitivity(level: SensitivityLevel): OAuth2Scope[] {
    return this.getAllScopes().filter(scope => scope.sensitivityLevel === level);
  }

  /**
   * Register a custom scope
   */
  registerScope(scope: OAuth2Scope): void {
    this.scopes.set(scope.name, scope);
  }

  /**
   * Validate a list of requested scopes
   */
  validateScopes(requestedScopes: string[]): {
    valid: boolean;
    invalidScopes: string[];
    sensitiveScopes: string[];
    requiresConsent: boolean;
  } {
    const invalidScopes: string[] = [];
    const sensitiveScopes: string[] = [];
    let requiresConsent = false;

    for (const scopeName of requestedScopes) {
      const scope = this.scopes.get(scopeName);
      
      if (!scope) {
        invalidScopes.push(scopeName);
        continue;
      }

      if (scope.requiresConsent) {
        requiresConsent = true;
      }

      if (scope.sensitivityLevel === 'sensitive' || scope.sensitivityLevel === 'restricted') {
        sensitiveScopes.push(scopeName);
      }
    }

    return {
      valid: invalidScopes.length === 0,
      invalidScopes,
      sensitiveScopes,
      requiresConsent,
    };
  }

  /**
   * Check if scopes grant permission for an action on a resource
   */
  hasPermission(
    grantedScopes: string[],
    resource: string,
    action: string
  ): boolean {
    for (const scopeName of grantedScopes) {
      const scope = this.scopes.get(scopeName);
      if (!scope) continue;

      for (const permission of scope.permissions) {
        // Check resource match
        const resourceMatch = 
          permission.resource === '*' || 
          permission.resource === resource;

        // Check action match
        const actionMatch = 
          permission.action === '*' || 
          permission.action === action;

        if (resourceMatch && actionMatch) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all permissions for a set of scopes
   */
  getPermissions(scopeNames: string[]): Permission[] {
    const permissions: Permission[] = [];
    
    for (const scopeName of scopeNames) {
      const scope = this.scopes.get(scopeName);
      if (scope) {
        permissions.push(...scope.permissions);
      }
    }

    return permissions;
  }

  /**
   * Get human-readable descriptions for scopes
   */
  getScopeDescriptions(scopeNames: string[]): { name: string; description: string }[] {
    return scopeNames
      .map(name => {
        const scope = this.scopes.get(name);
        return scope ? { name, description: scope.description } : null;
      })
      .filter((s): s is { name: string; description: string } => s !== null);
  }

  /**
   * Filter scopes to only those allowed for an app
   */
  filterAllowedScopes(
    requestedScopes: string[],
    allowedScopes: string[]
  ): string[] {
    // If app has wildcard access, return all requested scopes
    if (allowedScopes.includes('*')) {
      return requestedScopes.filter(s => this.scopes.has(s));
    }

    return requestedScopes.filter(scope => {
      // Exact match
      if (allowedScopes.includes(scope)) return true;

      // Wildcard match (e.g., 'profile:*' allows 'profile:read')
      for (const allowed of allowedScopes) {
        if (allowed.endsWith(':*')) {
          const prefix = allowed.slice(0, -1);
          if (scope.startsWith(prefix)) return true;
        }
      }

      return false;
    });
  }
}

/**
 * Create a default scope manager instance
 */
export function createScopeManager(customScopes?: Record<string, OAuth2Scope>): ScopeManager {
  return new ScopeManager(customScopes);
}
