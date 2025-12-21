-- Fix all orphaned confirmed claims for students who have changed rooms
-- This fixes roomy lebanon (student_id: de731209-acdf-4342-97ef-d7c7b0a7646a) and any other orphaned claims

-- Update claims where the student is no longer in that room
UPDATE room_occupancy_claims roc
SET 
    status = 'rejected', 
    rejection_reason = 'Student changed rooms (orphan fix)', 
    rejected_at = NOW()
FROM students s
WHERE roc.student_id = s.id
  AND roc.status IN ('confirmed', 'pending')
  AND (
    -- Student's current room doesn't match the claim's room
    s.current_room_id IS DISTINCT FROM roc.room_id
    OR s.current_room_id IS NULL
  );

-- Also decrement roomy_confirmed_occupants for rooms that had confirmed claims that are now rejected
-- We need to recalculate this based on actual confirmed claims per room
UPDATE rooms r
SET roomy_confirmed_occupants = (
  SELECT COUNT(*)
  FROM room_occupancy_claims roc
  WHERE roc.room_id = r.id
    AND roc.status = 'confirmed'
)
WHERE EXISTS (
  SELECT 1 FROM room_occupancy_claims roc2
  WHERE roc2.room_id = r.id
);