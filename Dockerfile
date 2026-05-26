# Multi-stage Dockerfile for MEDISHAHEL ENTERPRISE LOCAL EDITION
# 100% Offline-First compliant bundle for local Ubuntu servers

FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy full application code
COPY . .

# Build Vite static assets and bundle server.ts via esbuild
ENV NODE_ENV=production
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary manifests
COPY package*.json ./

# Install ONLY production dependencies to keep the image compact & fast
RUN npm ci --only=production

# Copy pre-compiled bundles in dist
COPY --from=builder /app/dist ./dist

# Expose local network port 3000
EXPOSE 3000

# Start server
CMD ["node", "dist/server.cjs"]
