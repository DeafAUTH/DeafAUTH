import {
  createDatabaseAdapter,
} from '@/lib/deafauth-core/adapters/database-adapters';
import type { DatabaseAdapter } from '@/lib/deafauth-core/types';

describe('Database Adapters', () => {
  describe('createDatabaseAdapter', () => {
    it('should create adapter with required handlers', async () => {
      const findOneMock = jest.fn().mockResolvedValue({ id: '1', name: 'Test' });
      const insertMock = jest.fn().mockResolvedValue({ id: '2', name: 'New' });
      const updateMock = jest.fn().mockResolvedValue(undefined);

      const adapter: DatabaseAdapter = createDatabaseAdapter({
        findOne: findOneMock,
        insert: insertMock,
        update: updateMock,
      });

      // Test findOne
      const found = await adapter.findOne('users', { id: '1' });
      expect(findOneMock).toHaveBeenCalledWith('users', { id: '1' });
      expect(found).toEqual({ id: '1', name: 'Test' });

      // Test insert
      const inserted = await adapter.insert('users', { name: 'New' });
      expect(insertMock).toHaveBeenCalledWith('users', { name: 'New' });
      expect(inserted).toEqual({ id: '2', name: 'New' });

      // Test update
      await adapter.update('users', { id: '1' }, { name: 'Updated' });
      expect(updateMock).toHaveBeenCalledWith('users', { id: '1' }, { name: 'Updated' });
    });

    it('should support optional delete handler', async () => {
      const deleteMock = jest.fn().mockResolvedValue(undefined);
      const adapter = createDatabaseAdapter({
        findOne: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: deleteMock,
      });

      await adapter.delete?.('users', { id: '1' });
      expect(deleteMock).toHaveBeenCalledWith('users', { id: '1' });
    });

    it('should support optional find handler', async () => {
      const findMock = jest.fn().mockResolvedValue([
        { id: '1', type: 'admin' },
        { id: '2', type: 'admin' },
      ]);
      const adapter = createDatabaseAdapter({
        findOne: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        find: findMock,
      });

      const results = await adapter.find?.('users', { type: 'admin' });
      expect(findMock).toHaveBeenCalledWith('users', { type: 'admin' });
      expect(results).toHaveLength(2);
    });
  });

  describe('In-Memory Database Adapter', () => {
    it('should work as a full in-memory store', async () => {
      const store = new Map<string, Record<string, unknown>[]>();

      const adapter = createDatabaseAdapter({
        findOne: async (table, query) => {
          const records = store.get(table) || [];
          return records.find((r) =>
            Object.entries(query).every(([k, v]) => r[k] === v)
          ) || null;
        },
        insert: async (table, record) => {
          const records = store.get(table) || [];
          const newRecord = { id: Date.now().toString(), ...record };
          records.push(newRecord);
          store.set(table, records);
          return newRecord;
        },
        update: async (table, query, updates) => {
          const records = store.get(table) || [];
          const index = records.findIndex((r) =>
            Object.entries(query).every(([k, v]) => r[k] === v)
          );
          if (index >= 0) {
            records[index] = { ...records[index], ...updates };
            store.set(table, records);
          }
        },
        find: async (table, query) => {
          const records = store.get(table) || [];
          return records.filter((r) =>
            Object.entries(query).every(([k, v]) => r[k] === v)
          );
        },
      });

      // Test insert
      const profile1 = await adapter.insert('profiles', {
        userId: 'user-1',
        name: 'Alice',
        deafStatus: 'deaf',
      });
      expect(profile1.id).toBeDefined();
      expect(profile1.name).toBe('Alice');

      const profile2 = await adapter.insert('profiles', {
        userId: 'user-2',
        name: 'Bob',
        deafStatus: 'deaf',
      });
      expect(profile2.id).toBeDefined();

      // Test findOne
      const found = await adapter.findOne('profiles', { userId: 'user-1' });
      expect(found?.name).toBe('Alice');

      // Test find
      const allDeaf = await adapter.find?.('profiles', { deafStatus: 'deaf' });
      expect(allDeaf).toHaveLength(2);

      // Test update
      await adapter.update('profiles', { userId: 'user-1' }, { name: 'Alice Updated' });
      const updated = await adapter.findOne('profiles', { userId: 'user-1' });
      expect(updated?.name).toBe('Alice Updated');
    });
  });
});
