/**
 * Smoke tests to validate the basic setup and configuration
 * These tests ensure the project is properly configured and ready for development
 */

describe('Project Setup Smoke Tests', () => {
  describe('Environment Configuration', () => {
    it('should have Node environment defined', () => {
      expect(process.env.NODE_ENV).toBeDefined();
    });
  });

  describe('TypeScript Configuration', () => {
    it('should support ES6+ syntax', () => {
      const testArray = [1, 2, 3];
      const doubled = testArray.map(x => x * 2);
      expect(doubled).toEqual([2, 4, 6]);
    });

    it('should support async/await', async () => {
      const promise = Promise.resolve('test');
      const result = await promise;
      expect(result).toBe('test');
    });

    it('should support destructuring', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const { a, b } = obj;
      expect(a).toBe(1);
      expect(b).toBe(2);
    });
  });

  describe('Module Resolution', () => {
    it('should import from @/ alias', async () => {
      const { cn } = await import('@/lib/utils');
      expect(cn).toBeDefined();
      expect(typeof cn).toBe('function');
    });

    it('should import schemas from lib', async () => {
      const { LoginSchema, SignupSchema } = await import('@/lib/auth-schemas');
      expect(LoginSchema).toBeDefined();
      expect(SignupSchema).toBeDefined();
    });
  });

  describe('Testing Framework', () => {
    it('should support basic expectations', () => {
      expect(true).toBe(true);
      expect(false).toBe(false);
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();
    });

    it('should support matchers', () => {
      expect('hello').toContain('ell');
      expect([1, 2, 3]).toHaveLength(3);
      expect({ a: 1 }).toHaveProperty('a');
    });

    it('should support async tests', async () => {
      const result = await Promise.resolve(42);
      expect(result).toBe(42);
    });
  });

  describe('Package Dependencies', () => {
    it('should have React available', () => {
      const React = require('react');
      expect(React).toBeDefined();
      expect(React.createElement).toBeDefined();
    });

    it('should have Zod validation library', () => {
      const z = require('zod');
      expect(z).toBeDefined();
      expect(z.string).toBeDefined();
    });
  });
});
