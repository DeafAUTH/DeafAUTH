// DeafAUTH React Integration Snippets
// Ready-to-use React hooks and components for DeafAUTH integration

/**
 * useDeafAuth Hook
 * 
 * A React hook that provides authentication state and methods
 * for DeafAUTH integration.
 * 
 * @example
 * ```tsx
 * import { useDeafAuth } from '@deafauth/react';
 * 
 * function MyComponent() {
 *   const { 
 *     user, 
 *     deafProfile, 
 *     isAuthenticated, 
 *     login, 
 *     logout 
 *   } = useDeafAuth();
 * 
 *   if (!isAuthenticated) {
 *     return <button onClick={() => login()}>Sign In</button>;
 *   }
 * 
 *   return (
 *     <div>
 *       <p>Welcome, {user.name}!</p>
 *       <p>Preferred Language: {deafProfile.preferredLanguage}</p>
 *       <button onClick={logout}>Sign Out</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const USE_DEAF_AUTH_HOOK = `
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { DeafProfile, AuthUser } from '@deafauth/core';

interface DeafAuthContextType {
  user: AuthUser | null;
  deafProfile: DeafProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<DeafProfile>) => Promise<void>;
}

const DeafAuthContext = createContext<DeafAuthContextType | null>(null);

export function useDeafAuth() {
  const context = useContext(DeafAuthContext);
  if (!context) {
    throw new Error('useDeafAuth must be used within a DeafAuthProvider');
  }
  return context;
}

export function DeafAuthProvider({ 
  children,
  deafAuth,
}: { 
  children: React.ReactNode;
  deafAuth: DeafAUTH;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [deafProfile, setDeafProfile] = useState<DeafProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    deafAuth.getCurrentUser().then(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const profile = await deafAuth.getProfile(currentUser.id);
        setDeafProfile(profile);
      }
      setIsLoading(false);
    });
  }, [deafAuth]);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await deafAuth.authenticate({ email, password });
      if (result.success && result.user) {
        setUser(result.user);
        setDeafProfile(result.deafProfile || null);
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, [deafAuth]);

  const logout = useCallback(async () => {
    await deafAuth.logout();
    setUser(null);
    setDeafProfile(null);
  }, [deafAuth]);

  const updatePreferences = useCallback(async (prefs: Partial<DeafProfile>) => {
    if (!user) return;
    const updated = await deafAuth.updateProfile(user.id, prefs);
    if (updated) {
      setDeafProfile(updated);
    }
  }, [deafAuth, user]);

  return (
    <DeafAuthContext.Provider
      value={{
        user,
        deafProfile,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updatePreferences,
      }}
    >
      {children}
    </DeafAuthContext.Provider>
  );
}
`;

/**
 * AccessibilityPreferencesForm Component
 * 
 * A React component for updating user accessibility preferences.
 * 
 * @example
 * ```tsx
 * import { AccessibilityPreferencesForm } from './accessibility-form';
 * 
 * function SettingsPage() {
 *   return (
 *     <div>
 *       <h1>Accessibility Settings</h1>
 *       <AccessibilityPreferencesForm />
 *     </div>
 *   );
 * }
 * ```
 */
export const ACCESSIBILITY_PREFERENCES_FORM = `
import { useState } from 'react';
import { useDeafAuth } from './use-deaf-auth';

const SIGN_LANGUAGES = [
  { value: 'ASL', label: 'American Sign Language' },
  { value: 'BSL', label: 'British Sign Language' },
  { value: 'LSF', label: 'French Sign Language' },
  { value: 'DGS', label: 'German Sign Language' },
  { value: 'JSL', label: 'Japanese Sign Language' },
  { value: 'ISL', label: 'International Sign' },
];

const COMMUNICATION_PREFERENCES = [
  { value: 'visual', label: 'Visual Communication' },
  { value: 'written', label: 'Written Communication' },
  { value: 'sign-language', label: 'Sign Language' },
  { value: 'lip-reading', label: 'Lip Reading' },
  { value: 'mixed', label: 'Mixed Methods' },
];

const ACCESSIBILITY_NEEDS = [
  { value: 'captions', label: 'Captions Required' },
  { value: 'sign-interpreter', label: 'Sign Language Interpreter' },
  { value: 'visual-alerts', label: 'Visual Alerts' },
  { value: 'high-contrast', label: 'High Contrast Mode' },
  { value: 'large-text', label: 'Large Text' },
  { value: 'reduced-motion', label: 'Reduced Motion' },
];

export function AccessibilityPreferencesForm() {
  const { deafProfile, updatePreferences, isLoading } = useDeafAuth();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    preferredLanguage: deafProfile?.preferredLanguage || 'ASL',
    communicationPreference: deafProfile?.communicationPreference || 'visual',
    accessibilityNeeds: deafProfile?.accessibilityNeeds || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePreferences(formData);
      alert('Preferences saved successfully!');
    } catch (error) {
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleNeed = (need: string) => {
    setFormData(prev => ({
      ...prev,
      accessibilityNeeds: prev.accessibilityNeeds.includes(need)
        ? prev.accessibilityNeeds.filter(n => n !== need)
        : [...prev.accessibilityNeeds, need],
    }));
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">
          Preferred Sign Language
        </label>
        <select
          value={formData.preferredLanguage}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            preferredLanguage: e.target.value 
          }))}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          {SIGN_LANGUAGES.map(lang => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">
          Communication Preference
        </label>
        <select
          value={formData.communicationPreference}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            communicationPreference: e.target.value 
          }))}
          className="mt-1 block w-full rounded-md border-gray-300"
        >
          {COMMUNICATION_PREFERENCES.map(pref => (
            <option key={pref.value} value={pref.value}>
              {pref.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Accessibility Needs
        </label>
        <div className="space-y-2">
          {ACCESSIBILITY_NEEDS.map(need => (
            <label key={need.value} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.accessibilityNeeds.includes(need.value)}
                onChange={() => toggleNeed(need.value)}
                className="rounded border-gray-300"
              />
              <span className="ml-2">{need.label}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        {saving ? 'Saving...' : 'Save Preferences'}
      </button>
    </form>
  );
}
`;

/**
 * ProtectedRoute Component
 * 
 * A React component that protects routes requiring authentication.
 * 
 * @example
 * ```tsx
 * import { ProtectedRoute } from './protected-route';
 * 
 * function App() {
 *   return (
 *     <Routes>
 *       <Route path="/dashboard" element={
 *         <ProtectedRoute requireValidation>
 *           <Dashboard />
 *         </ProtectedRoute>
 *       } />
 *     </Routes>
 *   );
 * }
 * ```
 */
export const PROTECTED_ROUTE_COMPONENT = `
import { Navigate, useLocation } from 'react-router-dom';
import { useDeafAuth } from './use-deaf-auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireValidation?: boolean;
  requiredScopes?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requireValidation = false,
  requiredScopes = [],
  fallback = <Navigate to="/login" replace />,
}: ProtectedRouteProps) {
  const { isAuthenticated, deafProfile, isLoading } = useDeafAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireValidation && !deafProfile?.validated) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-yellow-800 font-medium">Verification Required</h3>
        <p className="text-yellow-700 mt-1">
          This feature requires a verified Deaf identity.
          <a href="/verify" className="underline ml-1">
            Complete verification
          </a>
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
`;

/**
 * DeafAuth Login Form Component
 * 
 * A complete login form with DeafAUTH integration.
 */
export const LOGIN_FORM_COMPONENT = `
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDeafAuth } from './use-deaf-auth';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useDeafAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300"
          aria-describedby="email-hint"
        />
        <p id="email-hint" className="text-sm text-gray-500 mt-1">
          Enter your registered email address
        </p>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md" role="alert">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
`;
