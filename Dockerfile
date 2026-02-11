# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install

# Copy source code
COPY . .

# Generate Prisma Client and push schema
RUN bunx prisma generate
RUN bunx prisma db push --skip-generate

# Build Next.js application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
