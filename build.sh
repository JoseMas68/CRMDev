#!/bin/sh
set -e
echo "=== Starting build ==="
cd /app
echo "Running next build..."
npx next build 2>&1 | tee /build.log
echo "=== Build completed with exit code $? ==="
cat /build.log
