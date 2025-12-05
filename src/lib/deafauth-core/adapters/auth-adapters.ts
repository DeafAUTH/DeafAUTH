// DeafAUTH - Pre-built Auth Adapters
// Adapters for popular authentication providers

import type { AuthAdapter, AuthCredentials, AuthResult, AuthUser } from '../types';

// ============================================
// AUTH0 ADAPTER
// ============================================

/**
 * Auth0 authentication adapter
 * 
 * @example
 * ```typescript
 * const authAdapter = new Auth0Adapter('your-domain.auth0.com', 'your-client-id');
 * const deafAuth = new DeafAUTH({ authAdapter });
 * ```
 */
export class Auth0Adapter implements AuthAdapter {
  private domain: string;
  private clientId: string;

  constructor(domain: string, clientId: string) {
    this.domain = domain;
    this.clientId = clientId;
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const response = await fetch(`https://${this.domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'password',
          client_id: this.clientId,
          username: credentials.email,
          password: credentials.password,
          scope: 'openid profile email',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error_description || 'Authentication failed',
        };
      }

      // Parse user from ID token if available
      const user: AuthUser = {
        id: data.sub || '',
        email: credentials.email,
      };

      return {
        success: true,
        user,
        token: data.access_token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async logout(): Promise<void> {
    // Auth0 logout - clear local session
    // In a real app, you'd redirect to Auth0 logout URL
  }
}

// ============================================
// FIREBASE AUTH ADAPTER
// ============================================

/**
 * Firebase Authentication adapter
 * Requires firebase/auth to be installed
 * 
 * @example
 * ```typescript
 * import { getAuth } from 'firebase/auth';
 * const auth = getAuth(app);
 * const authAdapter = new FirebaseAuthAdapter(auth);
 * const deafAuth = new DeafAUTH({ authAdapter });
 * ```
 */
export class FirebaseAuthAdapter implements AuthAdapter {
  private auth: FirebaseAuth;

  constructor(auth: FirebaseAuth) {
    this.auth = auth;
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      // Dynamic import to avoid requiring firebase as a dependency
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      
      const result = await signInWithEmailAndPassword(
        this.auth,
        credentials.email || '',
        credentials.password || ''
      );

      const user: AuthUser = {
        id: result.user.uid,
        email: result.user.email || undefined,
        name: result.user.displayName || undefined,
      };

      const token = await result.user.getIdToken();

      return {
        success: true,
        user,
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async logout(): Promise<void> {
    const { signOut } = await import('firebase/auth');
    await signOut(this.auth);
  }

  async getUser(): Promise<AuthUser | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    return {
      id: user.uid,
      email: user.email || undefined,
      name: user.displayName || undefined,
    };
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    return this.auth.onAuthStateChanged((firebaseUser) => {
      if (!firebaseUser) {
        callback(null);
        return;
      }
      callback({
        id: firebaseUser.uid,
        email: firebaseUser.email || undefined,
        name: firebaseUser.displayName || undefined,
      });
    });
  }
}

// Firebase Auth type for the adapter
interface FirebaseAuth {
  currentUser: FirebaseUser | null;
  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void;
}

interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  getIdToken(): Promise<string>;
}

// ============================================
// CLERK ADAPTER
// ============================================

/**
 * Clerk authentication adapter
 * Works with Clerk's client-side SDK
 * 
 * @example
 * ```typescript
 * import { useClerk } from '@clerk/nextjs';
 * const clerk = useClerk();
 * const authAdapter = new ClerkAdapter(clerk);
 * const deafAuth = new DeafAUTH({ authAdapter });
 * ```
 */
export class ClerkAdapter implements AuthAdapter {
  private clerk: ClerkClient;

  constructor(clerk: ClerkClient) {
    this.clerk = clerk;
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const result = await this.clerk.signIn.create({
        identifier: credentials.email || '',
        password: credentials.password || '',
      });

      if (result.status === 'complete') {
        const session = result.createdSessionId;
        const user = await this.getUser();
        
        return {
          success: true,
          user: user || undefined,
          token: session || undefined,
        };
      }

      return {
        success: false,
        error: 'Sign in incomplete',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async logout(): Promise<void> {
    await this.clerk.signOut();
  }

  async getUser(): Promise<AuthUser | null> {
    const user = this.clerk.user;
    if (!user) return null;
    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName || undefined,
    };
  }
}

// Clerk types for the adapter
interface ClerkClient {
  signIn: {
    create(params: { identifier: string; password: string }): Promise<{
      status: string;
      createdSessionId?: string;
    }>;
  };
  signOut(): Promise<void>;
  user: {
    id: string;
    primaryEmailAddress?: { emailAddress: string };
    fullName?: string;
  } | null;
}

// ============================================
// NEXTAUTH ADAPTER
// ============================================

/**
 * NextAuth.js adapter
 * Works with NextAuth session
 * 
 * @example
 * ```typescript
 * import { signIn, signOut, getSession } from 'next-auth/react';
 * const authAdapter = new NextAuthAdapter({ signIn, signOut, getSession });
 * const deafAuth = new DeafAUTH({ authAdapter });
 * ```
 */
export class NextAuthAdapter implements AuthAdapter {
  private nextAuth: NextAuthClient;

  constructor(nextAuth: NextAuthClient) {
    this.nextAuth = nextAuth;
  }

  async login(credentials: AuthCredentials): Promise<AuthResult> {
    try {
      const result = await this.nextAuth.signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });

      if (result?.error) {
        return {
          success: false,
          error: result.error,
        };
      }

      const session = await this.nextAuth.getSession();
      if (session?.user) {
        return {
          success: true,
          user: {
            id: session.user.id || session.user.email || '',
            email: session.user.email || undefined,
            name: session.user.name || undefined,
          },
        };
      }

      return {
        success: false,
        error: 'Authentication succeeded but session could not be retrieved. Ensure NextAuth is properly configured.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  }

  async logout(): Promise<void> {
    await this.nextAuth.signOut({ redirect: false });
  }

  async getUser(): Promise<AuthUser | null> {
    const session = await this.nextAuth.getSession();
    if (!session?.user) return null;
    return {
      id: session.user.id || session.user.email || '',
      email: session.user.email || undefined,
      name: session.user.name || undefined,
    };
  }
}

// NextAuth types for the adapter
interface NextAuthClient {
  signIn(
    provider: string,
    options: { redirect: boolean; email?: string; password?: string }
  ): Promise<{ error?: string } | undefined>;
  signOut(options: { redirect: boolean }): Promise<void>;
  getSession(): Promise<{
    user: {
      id?: string;
      email?: string;
      name?: string;
    };
  } | null>;
}

// ============================================
// CUSTOM ADAPTER FACTORY
// ============================================

/**
 * Create a custom auth adapter with simple functions
 * 
 * @example
 * ```typescript
 * const authAdapter = createAuthAdapter({
 *   login: async (creds) => {
 *     const res = await fetch('/api/login', { 
 *       method: 'POST', 
 *       body: JSON.stringify(creds) 
 *     });
 *     const data = await res.json();
 *     return { success: true, user: data.user };
 *   }
 * });
 * const deafAuth = new DeafAUTH({ authAdapter });
 * ```
 */
export function createAuthAdapter(
  handlers: Partial<AuthAdapter> & Pick<AuthAdapter, 'login'>
): AuthAdapter {
  return {
    login: handlers.login,
    logout: handlers.logout,
    getUser: handlers.getUser,
    onAuthStateChange: handlers.onAuthStateChange,
  };
}
