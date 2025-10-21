# DevOps and CI/CD Documentation

## Overview

DeafAUTH now includes a complete DevOps pipeline with automated testing, linting, building, and Docker containerization. Every push and pull request triggers automated checks to ensure code quality and functionality.

## CI/CD Pipeline

The CI/CD pipeline is defined in `.github/workflows/ci.yml` and runs automatically on:
- Pushes to `main` or `develop` branches
- Pull requests targeting `main` or `develop` branches

### Pipeline Jobs

#### 1. **Lint Check**
- Runs ESLint to check code quality
- Ensures consistent code style
- Identifies potential issues early
- **Command**: `npm run lint`

#### 2. **Test Suite**
- Runs all unit and integration tests
- Generates test coverage report
- Uploads coverage artifacts for review
- **Command**: `npm test`
- **Coverage Command**: `npm run test:coverage`

#### 3. **Build Validation**
- Validates the Next.js application builds successfully
- Uses placeholder environment variables for build
- Ensures no build-time errors
- **Command**: `npm run build`

#### 4. **TypeScript Type Check**
- Validates all TypeScript types
- Ensures type safety across the codebase
- Catches type errors before runtime
- **Command**: `npx tsc --noEmit`

#### 5. **Docker Build Test**
- Validates Dockerfile configuration
- Tests Docker image build
- Uses build caching for efficiency
- Ensures containerization works

## Test Suite

### Test Framework
- **Jest**: Test runner and framework
- **React Testing Library**: Component testing
- **@testing-library/jest-dom**: Extended matchers

### Test Structure
```
src/__tests__/
├── api/              # API route tests
├── components/       # Component tests
├── lib/              # Library/utility tests
└── smoke.test.ts     # Setup validation tests
```

### Test Coverage

The test suite includes:

1. **Authentication Schema Tests** (`auth-schemas.test.ts`)
   - Login form validation
   - Signup form validation
   - Password matching
   - Email format validation

2. **Utility Function Tests** (`utils.test.ts`)
   - Class name merging
   - Conditional classes
   - Edge case handling

3. **Component Tests** (`Logo.test.tsx`)
   - Rendering validation
   - Props handling
   - Style application

4. **API Tests** (`profile.test.ts`)
   - Response structure validation
   - Data type checking
   - Email format validation

5. **Smoke Tests** (`smoke.test.ts`)
   - Environment configuration
   - TypeScript features
   - Module resolution
   - Package dependencies

### Running Tests Locally

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

View the HTML report: `coverage/lcov-report/index.html`

## Environment Setup

### Required Environment Variables

The application requires Supabase configuration:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Setting Up Development Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual Supabase credentials in `.env`

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run tests to verify setup:
   ```bash
   npm test
   ```

## Local Development Workflow

### Before Committing

1. **Run Linter**:
   ```bash
   npm run lint
   ```

2. **Run Tests**:
   ```bash
   npm test
   ```

3. **Check Types**:
   ```bash
   npx tsc --noEmit
   ```

4. **Test Build** (optional):
   ```bash
   npm run build
   ```

### Continuous Integration Checks

All pull requests must pass:
- ✅ Linting (no errors)
- ✅ Tests (all passing)
- ✅ Build (successful)
- ✅ Type check (no type errors)
- ✅ Docker build (successful)

## Docker

### Building the Image

```bash
docker build -t deafauth:latest .
```

### Running the Container

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  deafauth:latest
```

## Adding New Tests

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Unit Test Example

```typescript
import { myFunction } from '@/lib/utils';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### API Test Example

```typescript
import { GET } from '@/app/api/my-route/route';

describe('My API Route', () => {
  it('should return correct response', async () => {
    const request = {} as Request;
    const response = await GET(request);
    const data = await response.json();
    
    expect(data).toBeDefined();
    expect(data).toHaveProperty('expectedField');
  });
});
```

## Troubleshooting

### Tests Failing Locally

1. Clear Jest cache:
   ```bash
   npx jest --clearCache
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Check Node.js version (requires Node 20.0.0+):
   ```bash
   node --version
   ```

### Build Failing

1. Ensure environment variables are set (even if placeholders)
2. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run build
   ```

### Type Errors

1. Update TypeScript definitions:
   ```bash
   npm install --save-dev @types/node @types/react @types/react-dom
   ```

2. Restart TypeScript server in your IDE

## Best Practices

1. **Write tests for new features**: Every new feature should include tests
2. **Run tests before committing**: Ensure all tests pass locally
3. **Keep tests focused**: Each test should validate one thing
4. **Use descriptive test names**: Test names should explain what they validate
5. **Mock external dependencies**: Tests should be isolated and fast
6. **Maintain test coverage**: Current test suite provides baseline coverage. Run `npm run test:coverage` to see detailed metrics
7. **Review CI results**: Always check GitHub Actions results after pushing

## Continuous Improvement

The DevOps setup is designed to be extended. Consider adding:
- E2E tests with Playwright or Cypress
- Visual regression testing
- Performance monitoring
- Security scanning
- Dependency vulnerability scanning
- Automated deployments
- Branch protection rules

## Support

For questions or issues with the DevOps setup:
1. Check GitHub Actions logs for detailed error messages
2. Review this documentation
3. Check the README.md for setup instructions
4. Open an issue in the repository
