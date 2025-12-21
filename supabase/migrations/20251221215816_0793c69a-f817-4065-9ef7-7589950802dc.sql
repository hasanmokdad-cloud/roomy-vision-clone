-- Fix orphaned confirmed claims: claims where student's current_room_id doesn't match claim's room_id
-- These cause "ghost occupants" on room cards

-- Step 1: Reject orphaned confirmed claims
UPDATE room_occupancy_claims 
SET 
  status = 'rejected', 
  rejection_reason = 'Orphan cleanup: student moved to different room'
WHERE status = 'confirmed'
  AND id IN (
    SELECT roc.id 
    FROM room_occupancy_claims roc
    JOIN students s ON s.id = roc.student_id
    WHERE roc.status = 'confirmed'
      AND (s.current_room_id IS NULL OR s.current_room_id != roc.room_id)
  );

-- Step 2: Recalculate roomy_confirmed_occupants for ALL rooms based on actual confirmed claims
UPDATE rooms r
SET roomy_confirmed_occupants = (
  SELECT COUNT(*) 
  FROM room_occupancy_claims roc
  WHERE roc.room_id = r.id 
    AND roc.status = 'confirmed'
);