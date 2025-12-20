-- Update profile_completion_score for all existing students with completed profiles
-- Calculate score based on filled fields

UPDATE public.students
SET profile_completion_score = (
  -- Personal info (25%)
  (CASE WHEN full_name IS NOT NULL AND full_name != '' THEN 10 ELSE 0 END) +
  (CASE WHEN gender IS NOT NULL AND gender != '' THEN 10 ELSE 0 END) +
  (CASE WHEN age IS NOT NULL AND age > 0 THEN 5 ELSE 0 END) +
  
  -- Academic info (25%)
  (CASE WHEN university IS NOT NULL AND university != '' THEN 15 ELSE 0 END) +
  (CASE WHEN major IS NOT NULL AND major != '' THEN 5 ELSE 0 END) +
  (CASE WHEN year_of_study IS NOT NULL AND year_of_study > 0 THEN 5 ELSE 0 END) +
  
  -- Accommodation status (15%)
  (CASE WHEN accommodation_status IS NOT NULL AND accommodation_status != '' THEN 15 ELSE 0 END) +
  
  -- Housing details (20%) - conditional on accommodation_status
  (CASE 
    WHEN accommodation_status = 'have_dorm' AND current_dorm_id IS NOT NULL AND current_room_id IS NOT NULL THEN 20
    WHEN accommodation_status = 'need_dorm' THEN (
      (CASE WHEN budget IS NOT NULL AND budget > 0 THEN 7 ELSE 0 END) +
      (CASE WHEN room_type IS NOT NULL AND room_type != '' THEN 7 ELSE 0 END) +
      (CASE WHEN preferred_housing_area IS NOT NULL AND preferred_housing_area != '' THEN 6 ELSE 0 END)
    )
    ELSE 0
  END) +
  
  -- Optional extras (15%)
  (CASE WHEN profile_photo_url IS NOT NULL AND profile_photo_url != '' THEN 10 ELSE 0 END) +
  (CASE WHEN phone_number IS NOT NULL AND phone_number != '' THEN 5 ELSE 0 END)
)
WHERE onboarding_completed = true OR profile_completion_score = 0;