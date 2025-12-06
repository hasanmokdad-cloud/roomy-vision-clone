-- ============================================
-- RLS_QA_CHECKLIST
-- Roomy Security Test Suite
-- ============================================
-- 
-- PURPOSE: Validate all Row Level Security policies work correctly
-- USAGE: Run in Supabase SQL Editor as different roles
-- SAFETY: All tests are read-only or wrapped in ROLLBACK transactions
--
-- ROLE SIMULATION GUIDE:
-- ═══════════════════════════════════════════
-- • Anon: Use Supabase SQL Editor without auth, or use:
--         SET LOCAL ROLE anon;
-- • Authenticated Student: Run while logged in as test student user
-- • Owner: Run while logged in as user with owner role
-- • Admin: Run while logged in as user with admin role
-- • Service Role: Only available via Supabase service key (not tested here)
-- ═══════════════════════════════════════════
--
-- HOW TO RUN:
-- 1. Open Supabase SQL Editor
-- 2. Copy relevant test section
-- 3. Execute and compare results with EXPECTED comments
-- 4. Mark test as PASS/FAIL
-- ============================================


-- ============================================
-- SECTION A: DORMS VISIBILITY TESTS
-- ============================================

-- TEST A1: Anon/Student sees only verified dorms
-- ROLE: anon or authenticated (non-owner)
-- EXPECTED: Only rows where verification_status = 'approved' AND available = true
-- ─────────────────────────────────────────────
SELECT 
  id,
  name,
  verification_status,
  available,
  owner_id
FROM dorms
LIMIT 10;
-- EXPECTED RESULT: All returned rows should have verification_status = 'approved'
-- If you see 'pending' or 'rejected' rows, TEST FAILS

-- TEST A2: Check dorm verification status distribution (Admin only)
-- ROLE: admin
-- EXPECTED: Should see all statuses including pending/rejected
-- ─────────────────────────────────────────────
SELECT 
  verification_status,
  COUNT(*) as count
FROM dorms
GROUP BY verification_status;
-- EXPECTED RESULT: Admins see counts for all statuses
-- Non-admins should only see 'approved' in this query

-- TEST A3: Owner sees their own unverified dorms
-- ROLE: owner (replace with actual owner user_id)
-- EXPECTED: Owner sees all their dorms regardless of verification_status
-- ─────────────────────────────────────────────
-- First, find an owner with pending dorms (run as admin):
/*
SELECT d.id, d.name, d.verification_status, o.user_id as owner_auth_id
FROM dorms d
JOIN owners o ON d.owner_id = o.id
WHERE d.verification_status = 'pending'
LIMIT 5;
*/
-- Then, logged in as that owner, run:
SELECT id, name, verification_status FROM dorms;
-- EXPECTED RESULT: Owner should see their own pending dorms


-- ============================================
-- SECTION B: ROOMS VISIBILITY TESTS
-- ============================================

-- TEST B1: Public sees only rooms from verified dorms
-- ROLE: anon or authenticated student
-- EXPECTED: All returned rooms should belong to verified dorms
-- ─────────────────────────────────────────────
SELECT 
  r.id as room_id,
  r.name as room_name,
  r.available,
  d.name as dorm_name,
  d.verification_status
FROM rooms r
JOIN dorms d ON r.dorm_id = d.id
LIMIT 10;
-- EXPECTED RESULT: All rows should have verification_status = 'approved'
-- If you see rooms from 'pending' dorms, TEST FAILS

-- TEST B2: Count rooms visible to public
-- ROLE: anon
-- EXPECTED: Count should match rooms in verified dorms only
-- ─────────────────────────────────────────────
SELECT COUNT(*) as visible_rooms FROM rooms;
-- Compare with admin count (admin should see more if unverified dorms exist)

-- TEST B3: Owner sees all rooms from their dorms
-- ROLE: owner
-- EXPECTED: Owner sees rooms even from their unverified dorms
-- ─────────────────────────────────────────────
SELECT 
  r.id,
  r.name,
  d.verification_status
FROM rooms r
JOIN dorms d ON r.dorm_id = d.id
WHERE d.owner_id IN (SELECT id FROM owners WHERE user_id = auth.uid());
-- EXPECTED RESULT: Owner sees all their rooms regardless of dorm status


-- ============================================
-- SECTION C: user_devices PRIVACY TESTS
-- ============================================

-- TEST C1: Anon gets 0 rows from user_devices
-- ROLE: anon (SET LOCAL ROLE anon;)
-- EXPECTED: Empty result set
-- ─────────────────────────────────────────────
SELECT * FROM user_devices LIMIT 5;
-- EXPECTED RESULT: 0 rows returned
-- If any rows returned, CRITICAL SECURITY FAILURE

-- TEST C2: Authenticated user sees only own devices
-- ROLE: authenticated user
-- EXPECTED: Only rows where user_id = current user's auth.uid()
-- ─────────────────────────────────────────────
SELECT 
  id,
  user_id,
  device_name,
  is_verified,
  created_at
FROM user_devices;
-- EXPECTED RESULT: All rows have user_id = auth.uid()
-- Verify with: SELECT auth.uid();

-- TEST C3: Cross-user device access blocked
-- ROLE: authenticated user
-- EXPECTED: 0 rows or RLS error when querying another user's devices
-- ─────────────────────────────────────────────
-- First find another user's ID (as admin):
/*
SELECT DISTINCT user_id FROM user_devices LIMIT 3;
*/
-- Then as regular user, try to access:
SELECT * FROM user_devices 
WHERE user_id = '00000000-0000-0000-0000-000000000000'; -- Replace with other user ID
-- EXPECTED RESULT: 0 rows (RLS blocks access)


-- ============================================
-- SECTION D: user_presence PRIVACY TESTS  
-- ============================================

-- TEST D1: User can see own presence
-- ROLE: authenticated user
-- EXPECTED: Can see own presence record
-- ─────────────────────────────────────────────
SELECT * FROM user_presence WHERE user_id = auth.uid();
-- EXPECTED RESULT: Own presence record visible

-- TEST D2: User can see presence of conversation partners
-- ROLE: authenticated user with active conversations
-- EXPECTED: Can see presence of users they have conversations with
-- ─────────────────────────────────────────────
SELECT up.* 
FROM user_presence up
JOIN conversations c ON (up.user_id = c.user_a_id OR up.user_id = c.user_b_id)
WHERE c.user_a_id = auth.uid() OR c.user_b_id = auth.uid()
LIMIT 10;
-- EXPECTED RESULT: Presence of conversation partners visible

-- TEST D3: Cannot see arbitrary user presence
-- ROLE: authenticated user
-- EXPECTED: 0 rows for users not in conversations
-- ─────────────────────────────────────────────
-- Try to query a random user's presence (who you don't have conversation with)
SELECT * FROM user_presence 
WHERE user_id NOT IN (
  SELECT CASE WHEN user_a_id = auth.uid() THEN user_b_id ELSE user_a_id END
  FROM conversations 
  WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
)
AND user_id != auth.uid();
-- EXPECTED RESULT: Should return 0 rows due to RLS


-- ============================================
-- SECTION E: personality_questions ACCESS TESTS
-- ============================================

-- TEST E1: Anyone can read personality questions
-- ROLE: anon
-- EXPECTED: All questions visible
-- ─────────────────────────────────────────────
SELECT id, question, category FROM personality_questions LIMIT 5;
-- EXPECTED RESULT: Questions returned successfully

-- TEST E2: Non-admin cannot INSERT questions
-- ROLE: authenticated student (NOT admin)
-- EXPECTED: Permission denied or 0 rows affected
-- ─────────────────────────────────────────────
BEGIN;
INSERT INTO personality_questions (question, category)
VALUES ('Test Question - Should Fail', 'test');
ROLLBACK; -- Always rollback test data
-- EXPECTED RESULT: RLS policy violation / permission denied

-- TEST E3: Non-admin cannot UPDATE questions
-- ROLE: authenticated student (NOT admin)
-- EXPECTED: Permission denied or 0 rows affected
-- ─────────────────────────────────────────────
BEGIN;
UPDATE personality_questions 
SET question = 'Modified - Should Fail'
WHERE id = (SELECT id FROM personality_questions LIMIT 1);
ROLLBACK;
-- EXPECTED RESULT: 0 rows affected due to RLS

-- TEST E4: Non-admin cannot DELETE questions
-- ROLE: authenticated student (NOT admin)
-- EXPECTED: Permission denied or 0 rows affected
-- ─────────────────────────────────────────────
BEGIN;
DELETE FROM personality_questions 
WHERE id = (SELECT id FROM personality_questions LIMIT 1);
ROLLBACK;
-- EXPECTED RESULT: 0 rows affected due to RLS

-- TEST E5: Admin CAN modify questions (commented example - use with caution)
-- ROLE: admin
-- EXPECTED: Operation succeeds
-- ─────────────────────────────────────────────
/*
BEGIN;
INSERT INTO personality_questions (question, category)
VALUES ('Admin Test Question', 'test');
-- Verify insertion:
SELECT * FROM personality_questions WHERE question = 'Admin Test Question';
ROLLBACK; -- Clean up test data
*/
-- EXPECTED RESULT: Admin can insert/update/delete


-- ============================================
-- SECTION F: system_logs ACCESS TESTS
-- ============================================

-- TEST F1: Non-admin cannot view system logs
-- ROLE: authenticated student
-- EXPECTED: 0 rows returned
-- ─────────────────────────────────────────────
SELECT * FROM system_logs LIMIT 5;
-- EXPECTED RESULT: 0 rows (RLS blocks non-admin access)

-- TEST F2: Admin can view all system logs
-- ROLE: admin
-- EXPECTED: All logs visible
-- ─────────────────────────────────────────────
SELECT id, created_at FROM system_logs LIMIT 10;
-- EXPECTED RESULT: Logs returned (if any exist)

-- TEST F3: System can insert logs (service role only)
-- NOTE: This test verifies the INSERT policy exists
-- Run as admin to verify the policy:
-- ─────────────────────────────────────────────
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'system_logs';
-- EXPECTED RESULT: "System can insert logs" policy with INSERT command


-- ============================================
-- SECTION G: RLS SANITY CHECKS
-- ============================================

-- TEST G1: No tables with RLS enabled but 0 policies
-- ROLE: any
-- EXPECTED: Empty result set
-- ─────────────────────────────────────────────
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables t
WHERE schemaname = 'public'
  AND rowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.schemaname = t.schemaname 
    AND p.tablename = t.tablename
  );
-- EXPECTED RESULT: 0 rows (all RLS-enabled tables have policies)
-- If any rows returned, those tables need policies!

-- TEST G2: List all critical tables and their RLS status
-- ROLE: any
-- EXPECTED: All user-data tables have RLS enabled
-- ─────────────────────────────────────────────
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.tablename) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'students', 'owners', 'admins', 'dorms', 'rooms', 
    'reservations', 'payments', 'messages', 'conversations',
    'user_devices', 'user_presence', 'notifications',
    'personality_responses', 'system_logs', 'personality_questions'
  )
ORDER BY tablename;
-- EXPECTED RESULT: All tables have rls_enabled = true and policy_count > 0

-- TEST G3: Owner messaging view still works
-- ROLE: authenticated owner
-- EXPECTED: Can query owner_messaging_info view
-- ─────────────────────────────────────────────
SELECT * FROM owner_messaging_info LIMIT 5;
-- EXPECTED RESULT: View returns data without RLS errors

-- TEST G4: Conversations load correctly for authenticated user
-- ROLE: authenticated user (student/owner)
-- EXPECTED: User sees only their conversations
-- ─────────────────────────────────────────────
SELECT 
  id,
  user_a_id,
  user_b_id,
  conversation_type,
  created_at
FROM conversations
LIMIT 10;
-- EXPECTED RESULT: All rows have user_a_id OR user_b_id = auth.uid()
--                  OR user is admin seeing all

-- TEST G5: AI Match query works with RLS (verified dorms only)
-- ROLE: authenticated student
-- EXPECTED: Only verified, available dorms returned
-- ─────────────────────────────────────────────
SELECT 
  d.id,
  d.name,
  d.monthly_price,
  d.verification_status,
  d.available
FROM dorms d
WHERE d.available = true
ORDER BY d.monthly_price ASC
LIMIT 10;
-- EXPECTED RESULT: All rows have verification_status = 'approved'


-- ============================================
-- SECTION H: POLICY INVENTORY
-- ============================================

-- TEST H1: List all RLS policies in the database
-- ROLE: any
-- PURPOSE: Documentation and audit trail
-- ─────────────────────────────────────────────
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- EXPECTED RESULT: Comprehensive list of all policies for audit


-- ============================================
-- SUMMARY CHECKLIST
-- ============================================
-- 
-- □ A1: Anon sees only verified dorms
-- □ A2: Admin sees all dorm statuses
-- □ A3: Owner sees own unverified dorms
-- □ B1: Public sees only rooms from verified dorms
-- □ B2: Room count matches verified dorms
-- □ B3: Owner sees all their rooms
-- □ C1: Anon gets 0 devices
-- □ C2: User sees only own devices
-- □ C3: Cross-user device access blocked
-- □ D1: User sees own presence
-- □ D2: User sees conversation partner presence
-- □ D3: Cannot see arbitrary presence
-- □ E1: Anyone can read questions
-- □ E2: Non-admin cannot INSERT
-- □ E3: Non-admin cannot UPDATE
-- □ E4: Non-admin cannot DELETE
-- □ E5: Admin CAN modify
-- □ F1: Non-admin cannot view logs
-- □ F2: Admin can view logs
-- □ F3: System INSERT policy exists
-- □ G1: No RLS tables without policies
-- □ G2: All critical tables have RLS
-- □ G3: Owner messaging works
-- □ G4: Conversations load correctly
-- □ G5: AI Match returns verified only
-- 
-- All tests should PASS for security compliance
-- ============================================
