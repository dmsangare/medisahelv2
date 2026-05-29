# Multi-stage Dockerfile for MEDISHAHEL ENTERPRISE LOCAL EDITION
# 100% Offline-First compliant bundle for local Ubuntu servers

FROM node:20-alpine AS builder
WORKDIR /app

# Set environment to allow proper build hooks
ENV NODE_ENV=production

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy full application code
COPY . .

# Generate Prisma client with local engine binaries
RUN npx prisma generate

# Build Vite static assets and bundle server.ts via esbuild
RUN npm run build

# Prune devDependencies to keep the image compact, leaving only production dependencies in node_modules
RUN npm prune --omit=dev

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary manifests
COPY package*.json ./

# Copy pre-compiled bundles in dist
COPY --from=builder /app/dist ./dist

# Copy pruned, highly optimized node_modules (including generated Prisma Client) from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema and components for runtime migrations/queries
COPY --from=builder /app/prisma ./prisma

# Expose local network port 3000
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]

