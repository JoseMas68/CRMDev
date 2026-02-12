# Build stage
FROM node:20-alpine AS builder

# Declare build arguments for Next.js
ARG NEXT_PUBLIC_APP_URL
ARG BETTER_AUTH_URL
ARG BETTER_AUTH_SECRET

WORKDIR /app

# Set build environment variables
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
# Use --secret flag for sensitive data (Better Auth)
# ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}

# Install dependencies
COPY package.json bun.lockb* ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build Next.js application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Declare build arguments
ARG NEXT_PUBLIC_APP_URL
ARG BETTER_AUTH_URL

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV BETTER_AUTH_URL=${BETTER_AUTH_URL}

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
