-- Fix roomy lebanon's data: reject wrong claim and create correct one for Room 1 in Test Dorm

-- 1. Reject current claim for Room A1 in Test Dorm 2
UPDATE room_occupancy_claims 
SET status = 'rejected',
    rejection_reason = 'Data correction: wrong dorm selected',
    rejected_at = NOW()
WHERE id = '6e209eb8-87b1-4562-8888-bea34e1c37d8';

-- 2. Decrement roomy_confirmed_occupants for Room A1 in Test Dorm 2
UPDATE rooms 
SET roomy_confirmed_occupants = GREATEST(0, COALESCE(roomy_confirmed_occupants, 0) - 1)
WHERE id = 'd9e93b23-1102-46e3-abd0-e8d4fd972eff';

-- 3. Create pending claim for Room 1 in Test Dorm (552f8b6c-90ae-4854-b59c-1c498731e167)
INSERT INTO room_occupancy_claims (student_id, room_id, dorm_id, owner_id, status, claim_type)
SELECT 
  'de731209-acdf-4342-97ef-d7c7b0a7646a',
  '2f40bf45-5d43-46fb-93f1-dd74d0640727',
  '552f8b6c-90ae-4854-b59c-1c498731e167',
  d.owner_id,
  'pending',
  'legacy'
FROM dorms d WHERE d.id = '552f8b6c-90ae-4854-b59c-1c498731e167'
ON CONFLICT DO NOTHING;

-- 4. Update student's current_room_id and current_dorm_id to Room 1 in Test Dorm
UPDATE students
SET current_room_id = '2f40bf45-5d43-46fb-93f1-dd74d0640727',
    current_dorm_id = '552f8b6c-90ae-4854-b59c-1c498731e167',
    room_confirmed = false
WHERE id = 'de731209-acdf-4342-97ef-d7c7b0a7646a';