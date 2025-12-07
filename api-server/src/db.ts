// Database configuration and connection management
import knex, { Knex } from 'knex';
import path from 'path';

let db: Knex | null = null;

/**
 * Database configuration
 */
export function getDatabaseConfig(): Knex.Config {
  const environment = process.env.NODE_ENV || 'development';

  const config: { [key: string]: Knex.Config } = {
    development: {
      client: 'postgresql',
      connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'deafauth',
        user: process.env.DB_USER || 'deafuser',
        password: process.env.DB_PASSWORD || 'changeme',
      },
      pool: {
        min: 2,
        max: 10,
      },
      migrations: {
        directory: path.join(__dirname, '../migrations'),
        tableName: 'knex_migrations',
      },
      seeds: {
        directory: path.join(__dirname, '../seeds'),
      },
    },
    production: {
      client: 'postgresql',
      connection: process.env.DATABASE_URL,
      pool: {
        min: 2,
        max: 20,
      },
      migrations: {
        directory: path.join(__dirname, '../migrations'),
        tableName: 'knex_migrations',
      },
    },
  };

  return config[environment];
}

/**
 * Initialize database connection
 */
export async function initDatabase(): Promise<Knex> {
  if (db) {
    return db;
  }

  const config = getDatabaseConfig();
  db = knex(config);

  // Test connection
  try {
    await db.raw('SELECT 1');
    console.log('Database connection established');
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }

  return db;
}

/**
 * Get database instance
 */
export function getDatabase(): Knex {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}
