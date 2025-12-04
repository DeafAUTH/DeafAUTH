// DeafAUTH Next.js Integration Snippets
// Ready-to-use Next.js components and API routes

/**
 * Next.js API Route Handler
 * 
 * A complete API route for DeafAUTH operations in Next.js App Router.
 * 
 * @example
 * Create file: app/api/auth/[...deafauth]/route.ts
 * ```typescript
 * // See NEXTJS_API_ROUTE below
 * ```
 */
export const NEXTJS_API_ROUTE = `
// app/api/auth/[...deafauth]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { DeafAUTH } from '@deafauth/core';
import { SupabaseAdapter } from '@deafauth/core/adapters';
import { 
  AccessControlManager, 
  ApiKeyManager,
  createRateLimitMiddleware 
} from '@deafauth/core/security';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize DeafAUTH with Supabase
const dbAdapter = new SupabaseAdapter(supabase);
const deafAuth = new DeafAUTH({
  dbAdapter,
  autoCreateProfile: true,
});

// Initialize security managers
const apiKeyManager = new ApiKeyManager(dbAdapter);
const accessControl = new AccessControlManager(dbAdapter);
const rateLimiter = createRateLimitMiddleware({ maxRequests: 100, windowMs: 60000 });

// Helper to get client IP
function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] || 
         request.headers.get('x-real-ip') || 
         'unknown';
}

// Route handlers
export async function POST(
  request: NextRequest,
  { params }: { params: { deafauth: string[] } }
) {
  const path = params.deafauth.join('/');
  const clientIp = getClientIp(request);

  // Rate limiting
  const rateLimit = await rateLimiter(clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: rateLimit.headers }
    );
  }

  try {
    switch (path) {
      case 'signup':
        return handleSignup(request);
      case 'login':
        return handleLogin(request);
      case 'logout':
        return handleLogout(request);
      case 'token/validate':
        return handleTokenValidate(request);
      case 'app/register':
        return handleAppRegister(request);
      case 'oauth/authorize':
        return handleOAuthAuthorize(request);
      case 'oauth/token':
        return handleOAuthToken(request);
      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('DeafAUTH API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSignup(request: NextRequest) {
  const { email, password, profile } = await request.json();

  // Validate input
  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // Create DeafAUTH profile
  if (authData.user) {
    const deafProfile = await deafAuth.getOrCreateProfile({
      id: authData.user.id,
      email: authData.user.email,
      ...profile,
    });

    return NextResponse.json({
      message: 'Signup successful',
      user: { id: authData.user.id, email: authData.user.email },
      deafProfile,
    });
  }

  return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
}

async function handleLogin(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Get DeafAUTH profile
  const deafProfile = await deafAuth.getProfile(data.user.id);

  return NextResponse.json({
    message: 'Login successful',
    token: data.session?.access_token,
    user: { id: data.user.id, email: data.user.email },
    deafProfile,
  });
}

async function handleLogout(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // Invalidate the session
    await supabase.auth.signOut();
  }
  return NextResponse.json({ message: 'Logged out successfully' });
}

async function handleTokenValidate(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 401 });
  }

  const token = authHeader.substring(7);

  // Check if it's an API key
  if (token.startsWith('dak_')) {
    const result = await apiKeyManager.validateApiKey(token);
    return NextResponse.json({
      valid: result.valid,
      type: 'api_key',
      scopes: result.key?.scopes,
      error: result.error,
    });
  }

  // Check if it's an access token from OAuth
  if (token.startsWith('at_')) {
    const result = await accessControl.validateAccessToken(token);
    return NextResponse.json({
      valid: result.valid,
      type: 'access_token',
      scopes: result.grant?.scopes,
      error: result.error,
    });
  }

  // Assume it's a Supabase JWT
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 401 });
  }

  return NextResponse.json({
    valid: true,
    type: 'jwt',
    user: { id: data.user.id, email: data.user.email },
  });
}

async function handleAppRegister(request: NextRequest) {
  const { name, redirectUris, scopes, webhookUrl } = await request.json();
  
  // Get authenticated user
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const { data: userData, error } = await supabase.auth.getUser(token);
  
  if (error || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const app = await accessControl.registerApp({
    name,
    ownerId: userData.user.id,
    redirectUris,
    allowedScopes: scopes,
    webhookUrl,
  });

  return NextResponse.json({
    message: 'App registered successfully',
    app: {
      id: app.id,
      clientId: app.clientId,
      clientSecret: app.clientSecret, // Only returned once!
      status: app.status,
    },
  });
}

async function handleOAuthAuthorize(request: NextRequest) {
  const body = await request.json();
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const { data: userData, error } = await supabase.auth.getUser(token);
  
  if (error || !userData.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = await accessControl.authorize({
    clientId: body.client_id,
    redirectUri: body.redirect_uri,
    scopes: body.scope?.split(' ') || [],
    state: body.state,
    responseType: body.response_type || 'code',
    codeChallenge: body.code_challenge,
    codeChallengeMethod: body.code_challenge_method,
  }, userData.user.id);

  return NextResponse.json(response);
}

async function handleOAuthToken(request: NextRequest) {
  const body = await request.json();

  if (body.grant_type === 'authorization_code') {
    const response = await accessControl.exchangeCode(
      body.code,
      body.client_id,
      body.client_secret
    );
    return NextResponse.json(response);
  }

  if (body.grant_type === 'refresh_token') {
    const response = await accessControl.refreshAccessToken(body.refresh_token);
    return NextResponse.json(response);
  }

  return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { deafauth: string[] } }
) {
  const path = params.deafauth.join('/');

  if (path === 'me') {
    return handleGetCurrentUser(request);
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

async function handleGetCurrentUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const deafProfile = await deafAuth.getProfile(data.user.id);

  return NextResponse.json({
    user: { id: data.user.id, email: data.user.email },
    deafProfile,
  });
}
`;

/**
 * Next.js Middleware for Auth Protection
 * 
 * Middleware to protect routes and validate API keys.
 */
export const NEXTJS_MIDDLEWARE = `
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/settings', '/api/protected'];

// Routes that require API key
const API_KEY_ROUTES = ['/api/v1'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check protected routes
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('auth-token')?.value;
    
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Check API key routes
  if (API_KEY_ROUTES.some(route => pathname.startsWith(route))) {
    const apiKey = request.headers.get('x-api-key');
    const authHeader = request.headers.get('authorization');
    
    if (!apiKey && !authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'API key or Bearer token required' },
        { status: 401 }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/protected/:path*',
    '/api/v1/:path*',
  ],
};
`;

/**
 * Next.js Server Action for DeafAUTH
 */
export const NEXTJS_SERVER_ACTIONS = `
// app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DeafAUTH } from '@deafauth/core';
import { SupabaseAdapter } from '@deafauth/core/adapters';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const dbAdapter = new SupabaseAdapter(supabase);
const deafAuth = new DeafAUTH({ dbAdapter });

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Set auth cookie
  cookies().set('auth-token', data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });

  redirect('/dashboard');
}

export async function logout() {
  cookies().delete('auth-token');
  await supabase.auth.signOut();
  redirect('/login');
}

export async function getCurrentUser() {
  const token = cookies().get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  
  if (error) {
    return null;
  }

  const deafProfile = await deafAuth.getProfile(data.user.id);
  
  return {
    user: { id: data.user.id, email: data.user.email },
    deafProfile,
  };
}

export async function updateAccessibilityPreferences(formData: FormData) {
  const token = cookies().get('auth-token')?.value;
  
  if (!token) {
    return { error: 'Not authenticated' };
  }

  const { data: userData, error } = await supabase.auth.getUser(token);
  
  if (error || !userData.user) {
    return { error: 'Not authenticated' };
  }

  const preferences = {
    preferredLanguage: formData.get('preferredLanguage') as string,
    communicationPreference: formData.get('communicationPreference') as string,
    accessibilityNeeds: formData.getAll('accessibilityNeeds') as string[],
  };

  await deafAuth.updateAccessibility(userData.user.id, {
    language: preferences.preferredLanguage as any,
    communication: preferences.communicationPreference as any,
    needs: preferences.accessibilityNeeds as any[],
  });

  return { success: true };
}
`;
