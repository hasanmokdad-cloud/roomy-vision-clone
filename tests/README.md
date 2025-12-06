# RLS Security Tests

Comprehensive Row Level Security (RLS) test suite for Roomy platform.

## Purpose

Validates that all RLS policies work correctly to ensure:
- User data privacy (devices, presence, messages)
- Proper dorm/room visibility (only verified listings public)
- Admin-only access for system tables
- Protected personality questions (read-only for non-admins)

## Files

- `security_rls_checks.sql` - Main SQL test suite

## How to Run Tests

### Prerequisites
- Access to Supabase SQL Editor
- Test accounts for each role:
  - **Student**: Regular user without owner/admin roles
  - **Owner**: User with owner profile and dorms
  - **Admin**: User with admin role in user_roles table

### Running Tests

1. **Open Supabase Dashboard** → SQL Editor

2. **Copy test sections** from `security_rls_checks.sql`

3. **Switch roles** (if needed):
   - Log out/in with different test accounts
   - Or use `SET LOCAL ROLE anon;` for anonymous tests

4. **Execute and compare** results with `EXPECTED` comments

5. **Mark checklist** at bottom of SQL file

## Test Categories

| Section | Description | Key Validation |
|---------|-------------|----------------|
| A | Dorms Visibility | Only verified dorms public |
| B | Rooms Visibility | Rooms inherit dorm verification |
| C | user_devices Privacy | Users see only own devices |
| D | user_presence Privacy | Limited to conversation partners |
| E | personality_questions | Read-only for non-admins |
| F | system_logs | Admin-only access |
| G | Sanity Checks | No orphan RLS, views work |
| H | Policy Inventory | Full audit listing |

## Safety Notes

⚠️ **All write tests use `BEGIN; ... ROLLBACK;`** - no data is modified

⚠️ **Never run tests with service role** unless absolutely necessary

⚠️ **Production-safe** - tests only read data or rollback changes

## Expected Results

### PASS Criteria
- Anon/student sees ONLY verified dorms
- Owners see their own unverified dorms
- Admins see everything
- No cross-user data leakage
- All RLS-enabled tables have policies

### FAIL Indicators
- Unverified dorms visible to public
- User can see another user's devices
- Non-admin can modify personality questions
- Empty policies on RLS-enabled tables

## Troubleshooting

### "permission denied" errors
- Expected for non-admin write tests
- Indicates RLS is working correctly

### "0 rows returned" when expecting data
- Check if test user has correct role
- Verify test data exists in database

### Unexpected rows visible
- **SECURITY ISSUE** - investigate immediately
- Check if correct RLS policies exist
- Verify policy USING clauses

## Related Documentation

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Roomy Security Policies](../docs/security.md)
