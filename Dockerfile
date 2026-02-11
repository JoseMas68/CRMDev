# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json bun.lockb* ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client and push schema
RUN npx prisma generate
RUN npx prisma db push --skip-generate

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

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
