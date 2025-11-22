# ./deafauth/Dockerfile
# 1) Builder stage: install deps and compile TypeScript
FROM node:18-alpine AS builder

# Required build dependencies for some native modules
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package manifests first to leverage Docker layer caching
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

# Install deps (prefer npm ci if package-lock.json present)
# Adjust to yarn/pnpm if you use them
RUN if [ -f package-lock.json ]; then npm ci --production=false; else npm install; fi

# Copy source and compile
COPY tsconfig.json ./
COPY src ./src
# Any other files needed at build time (e.g., scripts, migrations)
# COPY scripts ./scripts
# COPY migrations ./migrations

# Build step - assumes "build" script in package.json runs tsc (or equivalent)
RUN npm run build

# 2) Production stage: slim runtime image
FROM node:18-alpine AS runtime

WORKDIR /app

# Only copy package.json and production deps from the builder stage
COPY package.json package-lock.json* ./
# Install only production dependencies
RUN if [ -f package-lock.json ]; then npm ci --production=true; else npm install --only=production; fi

# Copy built artifacts from builder stage
COPY --from=builder /app/dist ./dist
# If you need static assets, copy them too
# COPY --from=builder /app/public ./public

# Environment defaults (can be overridden by docker-compose / env file)
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start command - adjust the path if your build outputs a different entrypoint
CMD ["node", "dist/index.js"]
