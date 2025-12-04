// DeafAUTH - Pre-built Database Adapters
// Adapters for popular database solutions

import type { DatabaseAdapter, QueryCondition, UpdateOperation } from '../types';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Type guard for increment operations
 */
function isIncrementOperation(value: unknown): value is { increment: number } {
  return (
    value !== null &&
    typeof value === 'object' &&
    'increment' in value &&
    typeof (value as { increment: number }).increment === 'number'
  );
}

/**
 * Validate table/column name to prevent SQL injection
 * Only allows alphanumeric characters and underscores
 */
function isValidIdentifier(name: string): boolean {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
}

// ============================================
// SUPABASE ADAPTER
// ============================================

/**
 * Supabase database adapter
 * 
 * @example
 * ```typescript
 * import { createClient } from '@supabase/supabase-js';
 * const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
 * const dbAdapter = new SupabaseAdapter(supabase);
 * const deafAuth = new DeafAUTH({ dbAdapter });
 * ```
 */
export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.client = supabaseClient;
  }

  async findOne<T = Record<string, unknown>>(
    table: string,
    query: QueryCondition
  ): Promise<T | null> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .match(query)
      .single();

    // PGRST116 is "no rows returned" - not a real error for findOne
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Supabase findOne error: ${error.message}`);
    }

    return data as T | null;
  }

  async insert<T = Record<string, unknown>>(
    table: string,
    record: Record<string, unknown>
  ): Promise<T> {
    const { data, error } = await this.client
      .from(table)
      .insert([record])
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    return data as T;
  }

  async update(
    table: string,
    query: QueryCondition,
    updates: UpdateOperation
  ): Promise<void> {
    // Handle increment operations
    const processedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (isIncrementOperation(value)) {
        // For increments, we need to use RPC or raw SQL
        // For now, fetch current value and increment
        const current = await this.findOne<Record<string, unknown>>(table, query);
        const currentVal = current?.[key] as number || 0;
        processedUpdates[key] = currentVal + value.increment;
      } else {
        processedUpdates[key] = value;
      }
    }

    const { error } = await this.client
      .from(table)
      .update(processedUpdates)
      .match(query);

    if (error) {
      throw new Error(`Supabase update error: ${error.message}`);
    }
  }

  async delete(table: string, query: QueryCondition): Promise<void> {
    const { error } = await this.client.from(table).delete().match(query);

    if (error) {
      throw new Error(`Supabase delete error: ${error.message}`);
    }
  }

  async find<T = Record<string, unknown>>(
    table: string,
    query: QueryCondition
  ): Promise<T[]> {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .match(query);

    if (error) {
      throw new Error(`Supabase find error: ${error.message}`);
    }

    return (data as T[]) || [];
  }
}

// Supabase client type
interface SupabaseClient {
  from(table: string): {
    select(columns: string): {
      match(query: QueryCondition): {
        single(): Promise<{ data: unknown; error: { code?: string; message: string } | null }>;
      } & Promise<{ data: unknown; error: { message: string } | null }>;
    };
    insert(records: Record<string, unknown>[]): {
      select(): {
        single(): Promise<{ data: unknown; error: { message: string } | null }>;
      };
    };
    update(updates: Record<string, unknown>): {
      match(query: QueryCondition): Promise<{ data: unknown; error: { message: string } | null }>;
    };
    delete(): {
      match(query: QueryCondition): Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
}

// ============================================
// FIREBASE FIRESTORE ADAPTER
// ============================================

/**
 * Firebase Firestore database adapter
 * 
 * @example
 * ```typescript
 * import { getFirestore } from 'firebase/firestore';
 * const db = getFirestore(app);
 * const dbAdapter = new FirebaseAdapter(db);
 * const deafAuth = new DeafAUTH({ dbAdapter });
 * ```
 */
export class FirebaseAdapter implements DatabaseAdapter {
  private db: FirestoreDB;

  constructor(firestore: FirestoreDB) {
    this.db = firestore;
  }

  async findOne<T = Record<string, unknown>>(
    collection: string,
    query: QueryCondition
  ): Promise<T | null> {
    const queryKeys = Object.keys(query);
    if (queryKeys.length === 0) return null;

    // Build query with first condition
    const [field, value] = [queryKeys[0], query[queryKeys[0]]];
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .limit(1)
      .get();

    return snapshot.empty ? null : (snapshot.docs[0].data() as T);
  }

  async insert<T = Record<string, unknown>>(
    collection: string,
    record: Record<string, unknown>
  ): Promise<T> {
    const docRef = await this.db.collection(collection).add(record);
    return { id: docRef.id, ...record } as T;
  }

  async update(
    collection: string,
    query: QueryCondition,
    updates: UpdateOperation
  ): Promise<void> {
    const queryKeys = Object.keys(query);
    if (queryKeys.length === 0) return;

    const [field, value] = [queryKeys[0], query[queryKeys[0]]];
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      // Handle increment operations
      const processedUpdates: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(updates)) {
        if (isIncrementOperation(val)) {
          // For Firebase, we'd use FieldValue.increment in real implementation
          const currentDoc = snapshot.docs[0].data();
          const currentVal = (currentDoc[key] as number) || 0;
          processedUpdates[key] = currentVal + val.increment;
        } else {
          processedUpdates[key] = val;
        }
      }
      await snapshot.docs[0].ref.update(processedUpdates);
    }
  }

  async delete(collection: string, query: QueryCondition): Promise<void> {
    const queryKeys = Object.keys(query);
    if (queryKeys.length === 0) return;

    const [field, value] = [queryKeys[0], query[queryKeys[0]]];
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .get();

    const batch = this.db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  async find<T = Record<string, unknown>>(
    collection: string,
    query: QueryCondition
  ): Promise<T[]> {
    const queryKeys = Object.keys(query);
    if (queryKeys.length === 0) {
      const snapshot = await this.db.collection(collection).get();
      return snapshot.docs.map((doc) => doc.data() as T);
    }

    const [field, value] = [queryKeys[0], query[queryKeys[0]]];
    const snapshot = await this.db
      .collection(collection)
      .where(field, '==', value)
      .get();

    return snapshot.docs.map((doc) => doc.data() as T);
  }
}

// Firestore types
interface FirestoreDB {
  collection(name: string): FirestoreCollection;
  batch(): FirestoreBatch;
}

interface FirestoreCollection {
  add(data: Record<string, unknown>): Promise<{ id: string }>;
  where(field: string, op: string, value: unknown): FirestoreQuery;
  get(): Promise<FirestoreSnapshot>;
}

interface FirestoreQuery {
  limit(n: number): FirestoreQuery;
  get(): Promise<FirestoreSnapshot>;
}

interface FirestoreSnapshot {
  empty: boolean;
  docs: FirestoreDoc[];
}

interface FirestoreDoc {
  id: string;
  ref: FirestoreDocRef;
  data(): Record<string, unknown>;
}

interface FirestoreDocRef {
  update(data: Record<string, unknown>): Promise<void>;
}

interface FirestoreBatch {
  delete(ref: FirestoreDocRef): void;
  commit(): Promise<void>;
}

// ============================================
// MONGODB ADAPTER
// ============================================

/**
 * MongoDB database adapter
 * 
 * @example
 * ```typescript
 * import { MongoClient } from 'mongodb';
 * const client = new MongoClient(MONGODB_URI);
 * const db = client.db('deafauth');
 * const dbAdapter = new MongoAdapter(db);
 * const deafAuth = new DeafAUTH({ dbAdapter });
 * ```
 */
export class MongoAdapter implements DatabaseAdapter {
  private db: MongoDB;

  constructor(db: MongoDB) {
    this.db = db;
  }

  async findOne<T = Record<string, unknown>>(
    collection: string,
    query: QueryCondition
  ): Promise<T | null> {
    return await this.db.collection(collection).findOne(query) as T | null;
  }

  async insert<T = Record<string, unknown>>(
    collection: string,
    record: Record<string, unknown>
  ): Promise<T> {
    const result = await this.db.collection(collection).insertOne(record);
    return { _id: result.insertedId, ...record } as T;
  }

  async update(
    collection: string,
    query: QueryCondition,
    updates: UpdateOperation
  ): Promise<void> {
    // Handle increment operations natively with MongoDB $inc
    const $set: Record<string, unknown> = {};
    const $inc: Record<string, number> = {};

    for (const [key, value] of Object.entries(updates)) {
      if (isIncrementOperation(value)) {
        $inc[key] = value.increment;
      } else {
        $set[key] = value;
      }
    }

    const updateOp: Record<string, unknown> = {};
    if (Object.keys($set).length > 0) updateOp.$set = $set;
    if (Object.keys($inc).length > 0) updateOp.$inc = $inc;

    await this.db.collection(collection).updateOne(query, updateOp);
  }

  async delete(collection: string, query: QueryCondition): Promise<void> {
    await this.db.collection(collection).deleteOne(query);
  }

  async find<T = Record<string, unknown>>(
    collection: string,
    query: QueryCondition
  ): Promise<T[]> {
    const cursor = this.db.collection(collection).find(query);
    return await cursor.toArray() as T[];
  }
}

// MongoDB types
interface MongoDB {
  collection(name: string): MongoCollection;
}

interface MongoCollection {
  findOne(query: QueryCondition): Promise<Record<string, unknown> | null>;
  insertOne(record: Record<string, unknown>): Promise<{ insertedId: string }>;
  updateOne(
    query: QueryCondition,
    update: Record<string, unknown>
  ): Promise<void>;
  deleteOne(query: QueryCondition): Promise<void>;
  find(query: QueryCondition): MongoCursor;
}

interface MongoCursor {
  toArray(): Promise<Record<string, unknown>[]>;
}

// ============================================
// POSTGRESQL ADAPTER (with pg)
// ============================================

/**
 * PostgreSQL adapter using pg client
 * 
 * @example
 * ```typescript
 * import { Pool } from 'pg';
 * const pool = new Pool({ connectionString: DATABASE_URL });
 * const dbAdapter = new PostgresAdapter(pool);
 * const deafAuth = new DeafAUTH({ dbAdapter });
 * ```
 */
export class PostgresAdapter implements DatabaseAdapter {
  private pool: PostgresPool;

  constructor(pool: PostgresPool) {
    this.pool = pool;
  }

  /**
   * Validate all identifiers (table/column names) to prevent SQL injection
   */
  private validateIdentifiers(...names: string[]): void {
    for (const name of names) {
      if (!isValidIdentifier(name)) {
        throw new Error(`Invalid identifier: ${name}. Only alphanumeric characters and underscores are allowed.`);
      }
    }
  }

  async findOne<T = Record<string, unknown>>(
    table: string,
    query: QueryCondition
  ): Promise<T | null> {
    const keys = Object.keys(query);
    this.validateIdentifiers(table, ...keys);
    
    const values = Object.values(query);
    const conditions = keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ');
    
    const sql = `SELECT * FROM "${table}" WHERE ${conditions} LIMIT 1`;
    const result = await this.pool.query(sql, values);
    
    return result.rows[0] as T || null;
  }

  async insert<T = Record<string, unknown>>(
    table: string,
    record: Record<string, unknown>
  ): Promise<T> {
    const keys = Object.keys(record);
    this.validateIdentifiers(table, ...keys);
    
    const values = Object.values(record);
    const columns = keys.map(k => `"${k}"`).join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const sql = `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) RETURNING *`;
    const result = await this.pool.query(sql, values);
    
    return result.rows[0] as T;
  }

  async update(
    table: string,
    query: QueryCondition,
    updates: UpdateOperation
  ): Promise<void> {
    const queryKeys = Object.keys(query);
    const updateKeys = Object.keys(updates);
    this.validateIdentifiers(table, ...queryKeys, ...updateKeys);
    
    const queryValues = Object.values(query);
    
    // Process updates, handling increment operations
    const updateParts: string[] = [];
    const updateValues: unknown[] = [];
    let paramIndex = 1;

    for (const key of updateKeys) {
      const value = updates[key];
      if (isIncrementOperation(value)) {
        updateParts.push(`"${key}" = "${key}" + $${paramIndex}`);
        updateValues.push(value.increment);
      } else {
        updateParts.push(`"${key}" = $${paramIndex}`);
        updateValues.push(value);
      }
      paramIndex++;
    }

    const conditions = queryKeys
      .map((k) => `"${k}" = $${paramIndex++}`)
      .join(' AND ');
    
    const sql = `UPDATE "${table}" SET ${updateParts.join(', ')} WHERE ${conditions}`;
    await this.pool.query(sql, [...updateValues, ...queryValues]);
  }

  async delete(table: string, query: QueryCondition): Promise<void> {
    const keys = Object.keys(query);
    this.validateIdentifiers(table, ...keys);
    
    const values = Object.values(query);
    const conditions = keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ');
    
    const sql = `DELETE FROM "${table}" WHERE ${conditions}`;
    await this.pool.query(sql, values);
  }

  async find<T = Record<string, unknown>>(
    table: string,
    query: QueryCondition
  ): Promise<T[]> {
    const keys = Object.keys(query);
    this.validateIdentifiers(table, ...keys);
    
    const values = Object.values(query);
    
    let sql = `SELECT * FROM "${table}"`;
    if (keys.length > 0) {
      const conditions = keys.map((k, i) => `"${k}" = $${i + 1}`).join(' AND ');
      sql += ` WHERE ${conditions}`;
    }
    
    const result = await this.pool.query(sql, values);
    return result.rows as T[];
  }
}

// PostgreSQL types
interface PostgresPool {
  query(sql: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
}

// ============================================
// CUSTOM ADAPTER FACTORY
// ============================================

/**
 * Create a custom database adapter with simple functions
 * 
 * @example
 * ```typescript
 * const dbAdapter = createDatabaseAdapter({
 *   findOne: async (table, query) => {
 *     // Your custom logic
 *     return data;
 *   },
 *   insert: async (table, record) => {
 *     // Your custom logic
 *     return record;
 *   },
 *   update: async (table, query, updates) => {
 *     // Your custom logic
 *   }
 * });
 * const deafAuth = new DeafAUTH({ dbAdapter });
 * ```
 */
export function createDatabaseAdapter(
  handlers: Pick<DatabaseAdapter, 'findOne' | 'insert' | 'update'> &
    Partial<Pick<DatabaseAdapter, 'delete' | 'find'>>
): DatabaseAdapter {
  return {
    findOne: handlers.findOne,
    insert: handlers.insert,
    update: handlers.update,
    delete: handlers.delete,
    find: handlers.find,
  };
}
