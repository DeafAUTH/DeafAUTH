# Runtime Compatibility Guide

DeafAUTH is designed with modularity in mind and can be adapted to work with different JavaScript/TypeScript runtimes and frameworks. This document outlines compatibility with alternative runtimes and migration paths.

## Current Architecture

DeafAUTH currently uses:

- **Frontend**: Next.js 14 with React 18 (Node.js runtime)
- **Backend Edge Functions**: Supabase Edge Functions (Deno runtime)
- **Build Tool**: npm with Next.js bundler
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Google Genkit for ASL verification

## Deno Fresh Compatibility

### Overview

[Deno Fresh](https://fresh.deno.dev/) is a web framework for Deno that uses an "islands architecture" for server-side rendering with selective client-side hydration.

### Compatibility Status: ✅ Compatible (with modifications)

DeafAUTH can work with Deno Fresh, but requires the following considerations:

#### What Works Well

| Feature | Compatibility | Notes |
|---------|--------------|-------|
| Supabase Integration | ✅ Excellent | `@supabase/supabase-js` works via Deno's npm compatibility |
| Edge Functions | ✅ Native | Already using Deno for Supabase Edge Functions |
| TypeScript | ✅ Native | Deno has first-class TypeScript support |
| Authentication Logic | ✅ Compatible | Core auth types and schemas are runtime-agnostic |
| Tailwind CSS | ✅ Compatible | Works with Fresh via standard configuration |

#### Migration Considerations

1. **UI Components**: Fresh uses Preact instead of React. Radix UI components would need to be aliased:
   ```json
   // import_map.json
   {
     "imports": {
       "react": "https://esm.sh/preact/compat",
       "react-dom": "https://esm.sh/preact/compat"
     }
   }
   ```

2. **Islands Architecture**: Interactive components must be placed in Fresh's `islands/` directory for client-side hydration.

3. **Routing**: Fresh uses file-based routing similar to Next.js but with different conventions.

4. **API Routes**: Convert Next.js API routes to Fresh's handler pattern:
   ```typescript
   // Fresh API handler pattern
   export const handler = {
     async POST(req: Request): Promise<Response> {
       // Handler logic
     }
   };
   ```

### Recommended Migration Path

1. Extract core authentication logic into a separate runtime-agnostic package
2. Create Fresh islands for interactive auth components
3. Migrate API routes to Fresh handlers
4. Reuse existing Supabase Edge Functions (already Deno-native)

## Vite + React Compatibility

### Overview

[Vite](https://vitejs.dev/) is a modern build tool that provides fast development server and optimized production builds. Combined with React and TypeScript, it offers an excellent developer experience.

### Compatibility Status: ✅ Fully Compatible

DeafAUTH can be migrated to a Vite + React + TypeScript setup with minimal modifications.

#### What Works Well

| Feature | Compatibility | Notes |
|---------|--------------|-------|
| React Components | ✅ Excellent | All existing components work as-is |
| Supabase Integration | ✅ Excellent | Fully compatible with Vite |
| TypeScript | ✅ Excellent | Same TypeScript configuration |
| Radix UI Components | ✅ Excellent | No changes needed |
| Tailwind CSS | ✅ Excellent | Standard Vite + Tailwind setup |
| UI Libraries | ✅ Excellent | All React UI libraries compatible |

#### Migration Considerations

1. **Environment Variables**: Use `VITE_` prefix instead of `NEXT_PUBLIC_`:
   ```typescript
   // Before (Next.js)
   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   
   // After (Vite)
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   ```

2. **Routing**: Use React Router, TanStack Router, or similar instead of Next.js file-based routing.

3. **Server-Side Rendering**: Vite supports SSR but requires additional configuration (or use SSR frameworks like Remix).

4. **API Routes**: Backend routes need separate server setup (Express, Hono, etc.) or use Supabase Edge Functions.

### Recommended Migration Path

1. Create new Vite project:
   ```bash
   npm create vite@latest deafauth-vite -- --template react-ts
   ```

2. Copy and adapt core files:
   - `src/lib/` - Auth types and utilities (minimal changes)
   - `src/components/` - React components (no changes needed)
   - `src/hooks/` - Custom hooks (no changes needed)

3. Update environment variable references

4. Configure routing (React Router recommended)

5. Backend options:
   - Continue using Supabase Edge Functions (recommended)
   - Add Express/Fastify server for custom API routes

## Project Initialization Examples

### Deno Fresh with TypeScript

```bash
deno run -A -r https://fresh.deno.dev
```

### Vite + React + TypeScript

As shown in the issue, initialize with:

```bash
deno init --npm vite
# Select: React → TypeScript
```

Or with npm directly:

```bash
npm create vite@latest DeafAUTH -- --template react-ts
cd DeafAUTH
npm install
npm install @supabase/supabase-js
```

## Core Runtime-Agnostic Components

The following DeafAUTH components are already runtime-agnostic and can be used across different frameworks:

### Type Definitions (`src/lib/deaf-auth-types.ts`)

```typescript
// These types work in any TypeScript runtime
export interface AccessibilityProfile { ... }
export interface AuthSession { ... }
export type AuthState = "INITIAL" | "IDENTIFYING_USER" | ...
```

### Authentication Schemas (`src/lib/auth-schemas.ts`)

```typescript
// Zod schemas are runtime-agnostic
import { z } from 'zod';
export const loginSchema = z.object({ ... });
```

### Supabase Client (requires environment variable updates)

```typescript
// Easily adaptable to any runtime
import { createClient } from '@supabase/supabase-js';

// Runtime detection pattern
interface ImportMetaEnv {
  [key: string]: string | undefined;
}

interface ExtendedImportMeta {
  env?: ImportMetaEnv;
}

const getEnv = (key: string): string => {
  // Deno runtime
  if (typeof Deno !== 'undefined') {
    return Deno.env.get(key) ?? '';
  }
  // Vite/ESM runtime
  if (typeof import.meta !== 'undefined') {
    const meta = import.meta as ExtendedImportMeta;
    return meta.env?.[key] ?? '';
  }
  // Node.js runtime
  return process.env[key] ?? '';
};
```

## Comparison Matrix

| Feature | Next.js (Current) | Deno Fresh | Vite + React |
|---------|-------------------|------------|--------------|
| Runtime | Node.js | Deno | Node.js/Deno |
| SSR | Built-in | Built-in | Optional |
| Build Speed | Good | Excellent | Excellent |
| React Version | React 18 | Preact | React 18 |
| TypeScript | Configured | Native | Configured |
| File-based Routing | Yes | Yes | No (use router) |
| API Routes | Built-in | Built-in | External |
| Bundle Size | Medium | Small | Configurable |
| Ecosystem | Large | Growing | Large |

## Recommended Approach

For maximum flexibility, we recommend:

1. **Keep core auth logic runtime-agnostic** - Already in `src/lib/`
2. **Use Supabase Edge Functions for backend** - Already using Deno
3. **Frontend can be swapped** - React components are portable
4. **Consider building as an SDK** - Allow embedding in any framework

## Related Resources

- [Deno Fresh Documentation](https://fresh.deno.dev/docs/getting-started)
- [Vite Getting Started](https://vitejs.dev/guide/)
- [Supabase with Deno](https://docs.deno.com/examples/supabase/)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side)

## Conclusion

**Yes, DeafAUTH is compatible with both Deno Fresh and Vite!**

- **Deno Fresh**: Requires Preact aliasing for React components and understanding islands architecture
- **Vite + React**: Most straightforward migration path with minimal code changes

The core authentication types, schemas, and Supabase integration are already runtime-agnostic. The main work involves adapting routing and environment variable patterns to the target framework.
