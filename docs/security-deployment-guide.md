# Security Fixes Deployment Guide

**Date**: 2026-03-11
**Version**: v1.1.0-security

---

## Overview

This deployment includes critical security fixes for webhooks, API key encryption, and CORS configuration.

## Pre-Deployment Checklist

### 1. Environment Variables

Add these to your production environment:

```bash
# CRITICAL: Required for production
ENCRYPTION_SECRET="<generate-with-openssl-rand-hex-32>"
GITHUB_WEBHOOK_SECRET="<from-github-webhook-settings>"

# Optional but recommended
ALLOWED_CORS_ORIGINS="https://claude.ai,https://yourdomain.com"
```

### 2. Generate Encryption Secret

```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**⚠️ IMPORTANT**: Save this secret securely. If you lose it, encrypted data cannot be decrypted.

### 3. GitHub Webhook Secret

If using GitHub webhooks:
1. Go to your GitHub repository
2. Settings → Webhooks → Select webhook
3. Edit webhook → Set "Secret" to a random value
4. Copy that value to `GITHUB_WEBHOOK_SECRET` env var

---

## Deployment Steps

### Step 1: Deploy Code

```bash
git pull origin main
pnpm install
pnpm build
```

### Step 2: Database Migration

The new encryption fields need to be added to the database:

```bash
# Option A: Push schema changes (recommended for development)
pnpm db:push

# Option B: Create migration (recommended for production)
pnpm db:migrate
# Name: encrypt_openai_keys
pnpm db:migrate:deploy
```

### Step 3: Encrypt Existing OpenAI Keys

If you have existing OpenAI API keys in the database:

```bash
# Set ENCRYPTION_SECRET first in .env
pnpm tsx prisma/migrate-openai-keys.ts
```

This script will:
- Find all organizations with plaintext keys
- Encrypt them using AES-256-GCM
- Store encrypted version + nonce
- Keep original key for fallback

### Step 4: Verify Deployment

#### Test Webhook Signature Verification

```bash
# Test ticket webhook with valid signature
curl -X POST https://yourdomain.com/api/webhooks/tickets \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=$(echo -n '{"projectId":"test","subject":"Test","description":"Test"}' | openssl dgst -sha256 -hmac 'YOUR_SECRET')" \
  -d '{"projectId":"test","subject":"Test","description":"Test"}'

# Should return 401 with invalid signature
curl -X POST https://yourdomain.com/api/webhooks/tickets \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: sha256=invalid" \
  -d '{"projectId":"test","subject":"Test","description":"Test"}'
```

#### Test GitHub Webhook

```bash
# Should return 500 if GITHUB_WEBHOOK_SECRET not set
curl -X POST https://yourdomain.com/api/webhooks/github \
  -H "Content-Type: application/json" \
  -d '{"test":true}'
```

#### Test CORS Configuration

```bash
# Test allowed origin
curl -X OPTIONS https://yourdomain.com/api/mcp/rest \
  -H "Origin: https://claude.ai" \
  -H "Access-Control-Request-Method: POST" \
  -v

# Check for Access-Control-Allow-Origin header in response
```

---

## Rollback Plan

If issues arise:

### Option 1: Revert Commits

```bash
git revert <commit-hash>
pnpm build
# Deploy
```

### Option 2: Manual Rollback

1. Comment out encryption logic in `src/app/api/ai/chat/route.ts`
2. Restore old CORS config in `src/lib/cors.ts`
3. Revert webhook changes in `src/app/api/webhooks/`

---

## Post-Deployment

### 1. Monitor Logs

Watch for these errors:
- `[TICKET_WEBHOOK] Invalid signature from IP:` → Possible attack
- `[GITHUB_WEBHOOK] GITHUB_WEBHOOK_SECRET not configured` → Configuration error
- `ENCRYPTION_SECRET environment variable not set` → Data cannot be encrypted

### 2. Remove Legacy Fields (After Verification)

Once encrypted keys are verified working:

1. Update application code to only use encrypted fields
2. Remove `openaiApiKey` from `prisma/schema.prisma`
3. Create migration to drop the column
4. Deploy migration

### 3. Update Documentation

- Update CLAUDE.md with new security requirements
- Document ENCRYPTION_SECRET in team wiki
- Add to onboarding checklist

---

## Security Improvements Summary

### Fixed Vulnerabilities

| ID | Severity | Description | Status |
|----|----------|-------------|--------|
| CRITICAL-001 | Critical | Ticket webhook timing attack | ✅ Fixed |
| CRITICAL-002 | Critical | GitHub webhook bypass | ✅ Fixed |
| HIGH-002 | High | OpenAI keys in plaintext | ✅ Fixed |
| HIGH-005 | High | Hardcoded CORS origins | ✅ Fixed |

### What Changed

**Webhooks:**
- HMAC-SHA256 signature verification
- Timing-safe comparison
- Mandatory signature validation
- Rate limiting (10 req/min)

**API Keys:**
- AES-256-GCM encryption at rest
- Encrypted fields in database
- Migration script for existing keys
- Backward compatible

**CORS:**
- Environment-based configuration
- Development-only localhost origins
- Customizable via ALLOWED_CORS_ORIGINS

---

## Troubleshooting

### Issue: "ENCRYPTION_SECRET not set"

**Solution**: Add ENCRYPTION_SECRET to environment variables (min 32 chars)

### Issue: "Webhook not configured" (500)

**Solution**: Set TICKET_WEBHOOK_SECRET or configure per-project secret

### Issue: "Invalid signature" (401)

**Possible causes:**
1. Signature header missing
2. Secret mismatch between sender and receiver
3. Payload modified in transit

**Debug:**
```bash
# Verify signature generation
echo -n 'payload' | openssl dgst -sha256 -hmac 'secret'
```

### Issue: Encrypted keys returning null

**Possible causes:**
1. ENCRYPTION_SECRET changed after encryption
2. Nonce corrupted/missing
3. Using old code that expects plaintext

**Debug:**
```typescript
// Check if encrypted fields exist
console.log(org.openaiApiKeyEncrypted, org.openaiApiKeyNonce);
```

---

## Contact

For questions or issues:
- GitHub Issues: https://github.com/JoseMas68/CRMDev/issues
- Security Audit: `docs/security-audit-report.md`
- Implementation Plan: `plans/260311-security-fixes/`

---

**Generated**: 2026-03-11
**Expires**: After next security audit
