-- Add tiered pricing columns for double and triple rooms
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price_1_student numeric DEFAULT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS price_2_students numeric DEFAULT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deposit_1_student numeric DEFAULT NULL;
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS deposit_2_students numeric DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN rooms.price_1_student IS 'Price per month when only 1 student occupies a double/triple room';
COMMENT ON COLUMN rooms.price_2_students IS 'Price per month when 2 students occupy a triple room';
COMMENT ON COLUMN rooms.deposit_1_student IS 'Deposit when only 1 student occupies a double/triple room';
COMMENT ON COLUMN rooms.deposit_2_students IS 'Deposit when 2 students occupy a triple room';