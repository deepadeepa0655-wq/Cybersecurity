# =============================================================================
# Cyber Shield Platform - Production Dockerfile
# Multi-stage build for optimized production image
# =============================================================================

# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install the runtime dependencies.
RUN npm ci --omit=dev

# Production stage
FROM node:24-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy built dependencies from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs server.js index.html ./
COPY --chown=nodejs:nodejs assets ./assets
COPY --chown=nodejs:nodejs styles ./styles
COPY --chown=nodejs:nodejs js ./js

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
