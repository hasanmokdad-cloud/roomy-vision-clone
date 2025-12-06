# Roomy Security Guidelines

## Current Security Status

✅ **All security errors resolved**  
⚠️ **Only 1 intentional warning remaining**: `pg_net` extension in public schema (Supabase requirement)

### Summary
- RLS enforced on: `owners`, `user_devices`, `inquiries`, `students`, `messages`, `payments`, and all other sensitive tables
- Public endpoints hardened with rate limiting, token-based auth, and input validation
- Storage buckets secured with MIME type and file size restrictions
- All views use `security_invoker=on` to respect RLS

---

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

---

## Sensitive Data Access Rules

### Owner Data Exposure Rules

**Table**: `owners`

**Access Controls**:
- ✅ Owners can view and update their own profile (`auth.uid() = user_id`)
- ✅ Students can view owners they have relationships with (bookings, conversations, inquiries)
- ✅ Admins can view all owner records
- ❌ Anonymous users have NO access
- ❌ No policy allows enumeration of all owners

**Exposed Fields** (via legitimate relationships):
- `full_name` - For communication purposes
- `profile_photo_url` - For profile display
- `email` - Only for direct messaging context

**Protected Fields** (not exposed publicly):
- `phone_number` - Private contact info
- `whatsapp_language` - Preferences
- `payout_*` fields - Financial data
- `whish_account_id` - Payment identifiers

### Device & Session Tracking Data

**Table**: `user_devices`

**Access Controls**:
- ✅ Users can view their own devices (`auth.uid() = user_id`)
- ✅ Users can insert their own devices (`auth.uid() = user_id`)
- ✅ Users can update their own devices (`auth.uid() = user_id`)
- ✅ Users can delete their own devices (`auth.uid() = user_id`)
- ❌ No user can see another user's devices
- ❌ Anonymous users have NO access

**Sensitive Fields Protected**:
- `fingerprint_hash` - Device fingerprint
- `ip_region` - Geographic data
- `browser`, `os` - Technical details
- `verification_token` - Auth tokens

### Student Inquiries & Contact Data

**Table**: `inquiries`

**Access Controls**:
- ✅ Students can view their own inquiries (`student_id` matches student's record)
- ✅ Students can update/delete their own inquiries
- ✅ Owners can view inquiries for their dorms only (`owner_id` matches owner's record)
- ✅ Owners can update inquiries (mark as read/responded)
- ✅ Admins can view all inquiries
- ✅ Anyone can INSERT (for contact forms)
- ❌ Owners cannot see inquiries for other owners' properties
- ❌ Students cannot see other students' inquiries

**Inquiry Data Protected**:
- `student_name`, `student_email`, `student_phone` - PII isolated to owner/admin view
- `message` - Private communication

---

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
- `inquiries` - Contact submissions

### Low Sensitivity (RLS Recommended)
- `dorms` - Verified listings (public read OK)
- `rooms` - Available rooms (public read OK)
- `personality_questions` - Survey questions (public read OK)
- `reviews` - Approved reviews (public read OK)

---

## Security Monitoring

### Private Schema Security Views

The `private` schema contains security monitoring views and functions not exposed via PostgREST/Data API. Access only via Supabase SQL Editor.

#### Suspicious Activity Detection

```sql
-- Multi-region access in <5 minutes (possible credential theft)
SELECT * FROM private.suspicious_multi_region_access;

-- Excessive requests from same IP (DDoS/brute force)
SELECT * FROM private.excessive_ip_requests;

-- Failed security events (device denials, rate limits, invalid tokens)
SELECT * FROM private.failed_security_events;
```

#### Hourly Security Summary

```sql
-- Get security event summary for last 7 days
SELECT * FROM private.get_security_hourly_summary(168);
```

### Automated RLS Regression Testing

Database functions automatically detect RLS issues:

```sql
-- Check for RLS regressions (returns table of issues)
SELECT * FROM private.check_rls_regression();

-- Assert security baseline (raises exception if critical issues found)
SELECT private.assert_security_baseline();
```

**Automated checks include:**
- Sensitive tables without RLS enabled
- RLS-enabled tables with zero policies
- Overly permissive `USING (true)` policies on sensitive tables

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

---

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

---

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

| Function | Rate Limit | Security Measures |
|----------|------------|-------------------|
| `confirm-device` | 5/min/IP | Cryptographically random tokens (UUID v4), single-use enforcement, 30-minute expiry, no PII on invalid tokens |
| `secure-account` | 3/min/IP | Token-based auth, single-use tokens, logs security events, revokes all sessions on use |
| `verify-device` | 5/min/IP | Same as confirm-device |
| `send-device-email` | N/A | Internal use only, called by auth triggers |
| `generate-tour-questions` | 5/min/IP | Input validation (UUID format), sanitized AI responses |
| `send-owner-notification` | 10/min/IP | Internal use, UUID validation, called by cron jobs |
| `process-pending-notifications` | N/A | Cron job, no user input |
| `process-booking-reminders` | N/A | Cron job, no user input |
| `roomy-chat` | 10/min/IP | Input sanitization, tier-gated responses, no PII leakage |
| `contact-form-email` | 5/min/IP | Input validation, no sensitive data returned |

**Rate Limiting Implementation:**
- In-memory rate limiting per IP address (extracted from `x-forwarded-for` or `x-real-ip` headers)
- Returns `429 Too Many Requests` with `Retry-After: 60` header on violations
- Rate limit events logged to `security_events` table for monitoring

**Why public?** These functions support email verification, device trust, and notification flows that occur before or without user authentication.

### 3. Security Invoker Views

All security monitoring views now use `WITH (security_invoker = on)` to ensure they respect RLS policies of the calling user:

- `security_rls_overview` - Shows RLS status for all tables (authenticated users only)

---

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

## Security Events Monitoring

### Overview

The platform includes a centralized security events monitoring system accessible only to admins at `/admin/security`.

### Monitored Event Types

| Event Type | Severity | Description |
|------------|----------|-------------|
| `login_failed` | warning | Failed login attempt |
| `device_verification_failed` | warning | Device verification token expired or invalid |
| `device_verified` | info | Device successfully verified |
| `device_denied` | warning | User denied a suspicious device |
| `all_sessions_revoked` | critical | All user sessions revoked (security response) |
| `rate_limit_exceeded` | warning | API rate limit hit |
| `suspicious_activity` | critical | Detected suspicious behavior patterns |
| `otp_failed` | warning | Failed OTP verification |
| `high_frequency_signup` | warning | Abnormal account creation rate |

### Database Table

```sql
CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID,
  ip_region TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'info',  -- 'info', 'warning', 'critical'
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### RLS Policies

- **SELECT**: Admin-only (`user_roles.role = 'admin'`)
- **INSERT**: Open for edge functions (use service_role key)
- **UPDATE/DELETE**: Not permitted

### Real-time Monitoring

The admin dashboard subscribes to real-time events via Supabase Realtime. Critical events trigger toast notifications.

### Edge Function Integration

The following edge functions log security events:

| Function | Events Logged |
|----------|--------------|
| `confirm-device` | `device_verified`, `device_verification_failed`, `rate_limit_exceeded` |
| `secure-account` | `all_sessions_revoked`, `device_denied`, `rate_limit_exceeded` |
| `send-owner-notification` | `rate_limit_exceeded` |
| `roomy-chat` | `rate_limit_exceeded` |
| `generate-tour-questions` | `rate_limit_exceeded` |

---

## Related Files

- `tests/security_rls_checks.sql` - Comprehensive RLS test suite
- `tests/security_new_tables_check.sql` - Quick diagnostic query
- `scripts/check_security_baseline.ts` - CI-ready security check
- `tests/README.md` - Test execution guide
- `src/pages/admin/AdminSecurityMonitor.tsx` - Security monitoring dashboard