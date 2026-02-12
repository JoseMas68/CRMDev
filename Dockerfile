# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (ignore postinstall scripts)
COPY package.json bun.lockb* ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy files from builder for standalone output
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json

# Generate Prisma Client at runtime (with actual ENV vars)
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
