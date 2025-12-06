# Roomy Security Guidelines

## Overview

This document outlines security requirements and conventions for database schema changes in the Roomy platform. Following these guidelines ensures user data remains protected and prevents security regressions.

## Row Level Security (RLS) Requirements

### Mandatory RLS for Sensitive Tables

Any table containing the following types of data **MUST** have RLS enabled:

| Data Type | Examples | RLS Requirement |
|-----------|----------|-----------------|
| User-owned data | profiles, devices, preferences | Ownership-based (`user_id = auth.uid()`) |
| Business data | reservations, payments, bookings | Role-based + ownership |
| Messages/Communication | messages, conversations | Participant-based |
| Authentication data | devices, sessions, tokens | User-only access |
| Analytics/Logs | system_logs, ai_events | Admin-only or user-own |
| Financial data | payments, payouts, wallets | Strict ownership + admin |

### RLS Policy Checklist

When creating a new table, ensure:

- [ ] RLS is enabled: `ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;`
- [ ] At least one SELECT policy exists
- [ ] INSERT policy uses `WITH CHECK` for ownership validation
- [ ] UPDATE/DELETE policies use `USING` for ownership verification
- [ ] Admin override policies exist where appropriate

### Policy Patterns

#### 1. User-Owned Data Pattern
```sql
-- User can only see their own data
CREATE POLICY "Users view own data"
ON public.table_name FOR SELECT
USING (auth.uid() = user_id);

-- User can only insert their own data
CREATE POLICY "Users insert own data"
ON public.table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### 2. Role-Based Pattern (Owners)
```sql
-- Owners see data related to their dorms
CREATE POLICY "Owners view their dorm data"
ON public.table_name FOR SELECT
USING (
  owner_id IN (
    SELECT id FROM owners WHERE user_id = auth.uid()
  )
);
```

#### 3. Admin Override Pattern
```sql
-- Admins can view all data
CREATE POLICY "Admins view all"
ON public.table_name FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  )
);
```

#### 4. Public Read Pattern
```sql
-- Anyone can read (use sparingly!)
CREATE POLICY "Public read access"
ON public.table_name FOR SELECT
USING (true);

-- IMPORTANT: Add comment explaining why this is safe
COMMENT ON POLICY "Public read access" ON public.table_name IS 
  'This table contains only public reference data with no user PII';
```

## Sensitive Data Classification

### High Sensitivity (Strict RLS Required)
- `user_devices` - Device fingerprints, verification tokens
- `user_presence` - Online status, last seen
- `payments` / `payment_methods` - Financial data
- `reservations` - Booking and payment details
- `messages` - Private communications
- `personality_responses` - Personal assessment data

### Medium Sensitivity (RLS Required)
- `students` / `owners` / `admins` - Profile data
- `conversations` - Chat metadata
- `bookings` - Tour scheduling
- `friendships` - Social connections
- `notifications` - User alerts

### Low Sensitivity (RLS Recommended)
- `dorms` - Verified listings (public read OK)
- `rooms` - Available rooms (public read OK)
- `personality_questions` - Survey questions (public read OK)
- `reviews` - Approved reviews (public read OK)

## Security Monitoring

### Quick Security Check

Run this query to check for issues:
```sql
SELECT * FROM public.security_rls_overview
WHERE security_status != 'OK';
```

### DDL Audit Log

Check recent schema changes:
```sql
SELECT * FROM public.security_schema_audit
WHERE reviewed = false
ORDER BY event_time DESC;
```

### Mark Audit Entry as Reviewed
```sql
UPDATE public.security_schema_audit
SET reviewed = true, reviewed_by = auth.uid(), reviewed_at = now()
WHERE id = 'audit-entry-uuid';
```

## Security Check Script

Run the security baseline check:
```bash
npx ts-node scripts/check_security_baseline.ts
```

Or use the SQL query in Supabase SQL Editor:
```sql
-- Run: tests/security_new_tables_check.sql
```

## Best Practices

### DO ✅
- Enable RLS on every new table immediately after creation
- Use `SECURITY DEFINER` functions sparingly and only when necessary
- Test policies with different user roles before deploying
- Document why a table has public read access (if applicable)
- Use the `security_rls_overview` view to verify your changes

### DON'T ❌
- Create tables without RLS in production
- Use `USING (true)` for sensitive data SELECT policies
- Grant direct table access bypassing RLS
- Store sensitive data in public-readable columns
- Forget to add policies after enabling RLS

## Troubleshooting

### "permission denied for table X"
- RLS is enabled but no matching policy exists
- Check `security_rls_overview` for policy count
- Add appropriate SELECT/INSERT/UPDATE/DELETE policies

### "new row violates row-level security policy"
- INSERT/UPDATE policy `WITH CHECK` clause failed
- Verify the user owns the data they're trying to insert
- Check that `user_id` or `owner_id` matches `auth.uid()`

### Data not showing for user
- SELECT policy `USING` clause not matching
- Verify ownership column values
- Check if user has correct role (student/owner/admin)

---

## Known Security Linter Exceptions

The following security linter warnings are intentional and safe by design:

### 1. Extension in Public Schema (`pg_net`)

**Status**: ✅ Safe - Supabase Requirement

The `pg_net` extension is installed in the `public` schema because Supabase requires it there for HTTP requests from database functions. This extension is:
- Managed by Supabase infrastructure
- Cannot be moved to `extensions` schema without breaking Supabase internals
- Does not expose any security vulnerabilities

### 2. Public Edge Functions (No JWT Required)

The following edge functions are intentionally public (no JWT authentication) but are hardened with alternative security measures:

| Function | Security Measures |
|----------|-------------------|
| `confirm-device` | Cryptographically random tokens (UUID v4), single-use enforcement, 30-minute expiry, no PII on invalid tokens |
| `secure-account` | Token-based auth, single-use tokens, logs security events, revokes all sessions on use |
| `verify-device` | Same as confirm-device |
| `send-device-email` | Internal use only, called by auth triggers |
| `generate-tour-questions` | Rate limiting (5/min/IP), input validation, sanitized responses |
| `send-owner-notification` | Internal use only, called by process-pending-notifications, input validation |
| `process-pending-notifications` | Cron job, no user input |
| `process-booking-reminders` | Cron job, no user input |
| `roomy-chat` | Rate limiting (10/min), input sanitization, tier-gated responses |
| `contact-form-email` | Rate limiting, input validation, no sensitive data returned |

**Why public?** These functions support email verification, device trust, and notification flows that occur before or without user authentication.

### 3. Security Invoker Views

All security monitoring views now use `WITH (security_invoker = on)` to ensure they respect RLS policies of the calling user:

- `security_rls_overview` - Shows RLS status for all tables (authenticated users only)

## Storage Bucket Security

All storage buckets have MIME type restrictions and file size limits:

| Bucket | Allowed Types | Max Size |
|--------|--------------|----------|
| `profile-photos` | PNG, JPEG, WebP, GIF | 10 MB |
| `room-images` | PNG, JPEG, WebP, GIF | 10 MB |
| `dorm-uploads` | PNG, JPEG, WebP, GIF, MP4, WebM, MOV | 100 MB |
| `message-media` | PNG, JPEG, WebP, GIF, MP4, WebM, MOV | 100 MB |

**Blocked file types**: Executables, scripts, HTML, archives (.zip, .rar), PDFs (unless specifically allowed).

---

## Related Files

- `tests/security_rls_checks.sql` - Comprehensive RLS test suite
- `tests/security_new_tables_check.sql` - Quick diagnostic query
- `scripts/check_security_baseline.ts` - CI-ready security check
- `tests/README.md` - Test execution guide
