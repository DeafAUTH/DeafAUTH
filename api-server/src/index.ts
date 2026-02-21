// DeafAUTH Standalone API Server
// Works alongside ANY existing authentication system
// Provides PASETO tokens, consent management, and accessibility preferences
// Multi-tenant support with domain-agnostic design

import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import csurf from 'csurf';
import { V4 } from 'paseto';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { initDatabase, getDatabase } from './db';
import { createAuthRoutes } from './routes/auth';
import { createUserRoutes } from './routes/users';
import { createConsentRoutes } from './routes/consents';
import { createTenantRoutes } from './routes/tenants';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'deafauth-api',
    version: '0.1.0',
  });
});

// API info endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'DeafAUTH API Server',
    version: '0.1.0',
    description: 'Accessibility-first authentication that works alongside any auth system',
    endpoints: {
      auth: {
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        validate: 'GET /auth/validate',
        logout: 'POST /auth/logout',
      },
      users: {
        preferences: 'GET /users/:id/prefs',
        updatePreferences: 'PUT /users/:id/prefs',
        profile: 'GET /users/:id/profile',
      },
      consents: {
        create: 'POST /consents',
        get: 'GET /consents/:id',
        revoke: 'DELETE /consents/:id',
      },
      tenants: {
        create: 'POST /tenants',
        get: 'GET /tenants/:id',
        users: 'GET /tenants/:id/users',
      },
    },
    documentation: 'https://github.com/DeafAUTH/DeafAUTH',
  });
});

// Initialize database and routes
async function startServer() {
  try {
    // Initialize database connection
    await initDatabase();
    console.log('✓ Database connected');

    // Mount routes
    app.use('/auth', createAuthRoutes());
    app.use('/users', createUserRoutes());
    app.use('/consents', createConsentRoutes());
    app.use('/tenants', createTenantRoutes());

    // Error handler
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err.message);
      console.error(err.stack);
      res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not found',
        path: req.path,
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log('='.repeat(60));
      console.log(`🚀 DeafAUTH API Server running on port ${PORT}`);
      console.log(`📖 API docs: http://localhost:${PORT}/`);
      console.log(`💚 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('='.repeat(60));
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const db = getDatabase();
  db.destroy(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  const db = getDatabase();
  db.destroy(() => {
    console.log('Database connections closed');
    process.exit(0);
  });
});

// Start the server
startServer();
