# Multi-stage Dockerfile for MEDISHAHEL ENTERPRISE LOCAL EDITION
# 100% Compliant for Secure, High-Performance Clinical production server deployments

# --- Stage 1: Builder Stage ---
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy full application code and set ownership
COPY --chown=node:node . .

# Generate Prisma client with local engine binaries matching engine platform
RUN npx prisma generate

# Build Vite static assets and bundle server.ts via esbuild
RUN npm run build

# Prune devDependencies to keep the image compact, leaving only production dependencies in node_modules
RUN npm prune --omit=dev

# --- Stage 2: Production Runner Stage ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app

# Set production configurations and correct port binding
ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary manifests, ownership mapped to non-root 'node' user
COPY --chown=node:node --from=builder /app/package*.json ./

# Copy entrypoint.sh script and make it executable
COPY --chown=node:node --from=builder /app/entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh

# Copy pre-compiled bundles in dist
COPY --chown=node:node --from=builder /app/dist ./dist

# Copy pruned, highly optimized node_modules (including generated Prisma Client)
COPY --chown=node:node --from=builder /app/node_modules ./node_modules

# Copy Prisma schema and components for runtime migrations/queries
COPY --chown=node:node --from=builder /app/prisma ./prisma

# Elevate security posture by executing runtime processes as non-root user
USER node

# Expose local network port 3000
EXPOSE 3000

# Configure entrypoint and runtime arguments
ENTRYPOINT ["./entrypoint.sh"]
CMD ["node", "dist/server.cjs"]
