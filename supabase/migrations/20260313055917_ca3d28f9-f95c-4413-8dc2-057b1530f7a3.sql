ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS tenant_role text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_partner_overnight text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_home_frequency text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_conflict_address_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_expense_handling text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_pet_ownership text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_pet_comfort text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_housing_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS preferred_apartment_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_apartment_id uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_bedroom_id uuid DEFAULT NULL;