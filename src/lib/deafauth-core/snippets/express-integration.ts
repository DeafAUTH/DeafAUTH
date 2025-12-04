// DeafAUTH Express.js Integration Snippets
// Ready-to-use Express middleware and routes

/**
 * Express.js Complete Router
 * 
 * A complete Express router for DeafAUTH authentication.
 */
export const EXPRESS_ROUTER = `
// routes/auth.js
const express = require('express');
const { DeafAUTH } = require('@deafauth/core');
const { SupabaseAdapter } = require('@deafauth/core/adapters');
const { 
  ApiKeyManager, 
  AccessControlManager,
  RateLimiter,
  RATE_LIMIT_PRESETS 
} = require('@deafauth/core/security');
const { createClient } = require('@supabase/supabase-js');

const router = express.Router();

// Initialize adapters
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const dbAdapter = new SupabaseAdapter(supabase);

// Initialize DeafAUTH
const deafAuth = new DeafAUTH({
  dbAdapter,
  autoCreateProfile: true,
});

// Initialize security managers
const apiKeyManager = new ApiKeyManager(dbAdapter);
const accessControl = new AccessControlManager(dbAdapter);
const authRateLimiter = new RateLimiter(RATE_LIMIT_PRESETS.strict);
const apiRateLimiter = new RateLimiter(RATE_LIMIT_PRESETS.standard);

// Rate limiting middleware
const rateLimitMiddleware = (limiter) => async (req, res, next) => {
  const identifier = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const result = await limiter.check(identifier);
  
  res.set({
    'X-RateLimit-Limit': result.info.limit,
    'X-RateLimit-Remaining': result.info.remaining,
    'X-RateLimit-Reset': Math.ceil(result.info.resetTime / 1000),
  });

  if (!result.allowed) {
    res.set('Retry-After', result.info.retryAfter);
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  next();
};

// Auth middleware for protected routes
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    // Check for API key
    if (token.startsWith('dak_')) {
      const result = await apiKeyManager.validateApiKey(token);
      if (!result.valid) {
        return res.status(401).json({ error: result.error });
      }
      req.apiKey = result.key;
      req.authType = 'api_key';
      return next();
    }

    // Check for OAuth access token
    if (token.startsWith('at_')) {
      const result = await accessControl.validateAccessToken(token);
      if (!result.valid) {
        return res.status(401).json({ error: result.error });
      }
      req.grant = result.grant;
      req.authType = 'access_token';
      return next();
    }

    // Assume Supabase JWT
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      return res.status(401).json({ error: error.message });
    }

    req.user = data.user;
    req.authType = 'jwt';
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Scope checking middleware
const requireScopes = (...requiredScopes) => (req, res, next) => {
  const scopes = req.apiKey?.scopes || req.grant?.scopes || [];
  
  const hasScopes = requiredScopes.every(required => {
    return scopes.some(scope => {
      if (scope === '*') return true;
      if (scope === required) return true;
      if (scope.endsWith(':*')) {
        return required.startsWith(scope.slice(0, -1));
      }
      return false;
    });
  });

  if (!hasScopes) {
    return res.status(403).json({ 
      error: 'Insufficient permissions',
      required: requiredScopes,
      granted: scopes,
    });
  }

  next();
};

// ============================================
// PUBLIC ROUTES
// ============================================

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Signup
router.post('/signup', rateLimitMiddleware(authRateLimiter), async (req, res) => {
  const { email, password, profile } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Create DeafAUTH profile
    const deafProfile = await deafAuth.getOrCreateProfile({
      id: data.user.id,
      email: data.user.email,
      ...profile,
    });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: data.user.id, email: data.user.email },
      deafProfile,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
router.post('/login', rateLimitMiddleware(authRateLimiter), async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const deafProfile = await deafAuth.getProfile(data.user.id);

    res.json({
      message: 'Login successful',
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email },
      deafProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================
// PROTECTED ROUTES
// ============================================

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id || req.grant?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const deafProfile = await deafAuth.getProfile(userId);
    
    res.json({
      user: req.user,
      deafProfile,
      authType: req.authType,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile
router.patch('/profile', 
  authMiddleware, 
  requireScopes('profile:write'),
  async (req, res) => {
    const userId = req.user?.id || req.grant?.userId;
    const updates = req.body;

    try {
      const updated = await deafAuth.updateProfile(userId, updates);
      res.json({ profile: updated });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }
);

// Update accessibility preferences
router.patch('/accessibility',
  authMiddleware,
  requireScopes('preferences:write'),
  async (req, res) => {
    const userId = req.user?.id || req.grant?.userId;
    const { language, communication, needs } = req.body;

    try {
      await deafAuth.updateAccessibility(userId, { language, communication, needs });
      const profile = await deafAuth.getProfile(userId);
      res.json({ profile });
    } catch (error) {
      console.error('Update accessibility error:', error);
      res.status(500).json({ error: 'Failed to update accessibility preferences' });
    }
  }
);

// ============================================
// THIRD-PARTY APP ROUTES
// ============================================

// Register third-party app
router.post('/apps', authMiddleware, async (req, res) => {
  const { name, redirectUris, scopes, description, webhookUrl } = req.body;

  try {
    const app = await accessControl.registerApp({
      name,
      description,
      ownerId: req.user.id,
      redirectUris,
      allowedScopes: scopes,
      webhookUrl,
    });

    res.status(201).json({
      message: 'App registered successfully',
      app: {
        id: app.id,
        clientId: app.clientId,
        clientSecret: app.clientSecret, // Only returned once!
        status: app.status,
      },
    });
  } catch (error) {
    console.error('App registration error:', error);
    res.status(500).json({ error: 'Failed to register app' });
  }
});

// Create API key
router.post('/api-keys', authMiddleware, async (req, res) => {
  const { name, scopes, expiresIn } = req.body;

  try {
    const { key, apiKey } = await apiKeyManager.createApiKey({
      name,
      clientId: req.user.id,
      scopes: scopes || ['profile:read'],
      expiresIn,
    });

    res.status(201).json({
      message: 'API key created',
      key, // Only returned once!
      id: apiKey.id,
      scopes: apiKey.scopes,
      expiresAt: apiKey.expiresAt,
    });
  } catch (error) {
    console.error('API key creation error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

module.exports = router;
`;

/**
 * Express Security Middleware
 */
export const EXPRESS_SECURITY_MIDDLEWARE = `
// middleware/security.js
const helmet = require('helmet');
const cors = require('cors');

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "same-origin" },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5000',
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
};

// Request validation middleware
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.details.map(d => d.message),
    });
  }
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(JSON.stringify({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    }));
  });

  next();
};

module.exports = {
  securityHeaders,
  corsMiddleware: cors(corsOptions),
  validateRequest,
  requestLogger,
};
`;

/**
 * Express App Setup
 */
export const EXPRESS_APP_SETUP = `
// app.js
const express = require('express');
const {
  securityHeaders,
  corsMiddleware,
  requestLogger,
} = require('./middleware/security');
const authRoutes = require('./routes/auth');

const app = express();

// Trust proxy for rate limiting behind load balancer
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health check (before auth routes)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Auth routes
app.use('/auth', authRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS error' });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`DeafAUTH server running on port \${PORT}\`);
});

module.exports = app;
`;
