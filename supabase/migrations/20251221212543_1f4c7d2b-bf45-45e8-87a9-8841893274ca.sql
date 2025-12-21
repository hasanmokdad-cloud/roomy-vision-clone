-- Fix orphaned claim for hasan.mokdad (student_id: fcbec427-6ce9-485f-bbcd-449a694b63d9)
-- This claim was not properly updated when the student checked out
UPDATE room_occupancy_claims 
SET status = 'rejected', 
    rejection_reason = 'Student checked out (manual fix)', 
    rejected_at = NOW()
WHERE student_id = 'fcbec427-6ce9-485f-bbcd-449a694b63d9' 
AND status = 'confirmed';