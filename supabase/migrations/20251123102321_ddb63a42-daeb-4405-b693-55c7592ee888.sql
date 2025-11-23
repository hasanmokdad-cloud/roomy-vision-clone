-- Add capacity and deposit columns to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS capacity INTEGER;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deposit NUMERIC;

COMMENT ON COLUMN rooms.capacity IS 'Number of students the room can accommodate';
COMMENT ON COLUMN rooms.deposit IS 'Deposit amount required for the room';