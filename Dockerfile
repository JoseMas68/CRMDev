# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (ignore postinstall scripts)
COPY package.json bun.lockb* ./
RUN npm install --legacy-peer-deps --ignore-scripts

# Copy source code and build script
COPY . .
COPY build.sh /tmp/
RUN chmod +x /tmp/build.sh

# Build Next.js application using script for better error logging
RUN /tmp/build.sh || npx next build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy all files from builder (standalone disabled for debugging)
COPY --from=builder /app ./

# Generate Prisma Client at runtime (with actual ENV vars)
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
