

# Phase 1 — Tenant Onboarding Wizard Master Plan

This is a large, multi-section implementation. I will break it into discrete tasks matching the 11 sections in the prompt.

---

## Database Changes

A new `tenant_role` column is needed on the `students` table (values: `'student'` or `'non_student'`). This drives conditional academic step visibility and review page rendering.

**Migration SQL:**
```sql
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS tenant_role text DEFAULT NULL;
```

New personality survey columns are also needed for the 4 new questions not currently in the `students` table:
- `personality_partner_overnight` (text) — Q4 Step 1
- `personality_home_frequency` (text) — Q2 Step 2  
- `personality_conflict_address_method` (text) — Q3 Step 3
- `personality_expense_handling` (text) — Q3 Step 4
- `personality_pet_ownership` (text) — Q1 Step 5
- `personality_pet_comfort` (text) — Q2 Step 5

```sql
ALTER TABLE public.students 
  ADD COLUMN IF NOT EXISTS tenant_role text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_partner_overnight text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_home_frequency text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_conflict_address_method text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_expense_handling text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_pet_ownership text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS personality_pet_comfort text DEFAULT NULL;
```

---

## Section 1 — Route Rename `/onboarding/student` → `/onboarding/tenant`

**Files to change:**
- `src/App.tsx` line 321: route path string
- `src/pages/Profile.tsx` line 646: navigate string
- `src/pages/student/StudentOnboarding.tsx`: no route string inside, just the component — no change needed

---

## Section 2 — Intro Page Copy Updates

**File:** `src/components/student/mobile/steps/StudentAirbnbIntroStep.tsx`
- Line 27: Change step 1 description from "...academic background..." to "...background..."
- Line 32: Change step 2 description from "...in a dorm and whether you need a roommate match." to "...in a rental and your housing preferences"

---

## Section 3 — Basic Info: Subtitle + New "Role" Field

**File:** `src/components/student/mobile/steps/BasicInfoStep.tsx`
- Change subtitle from "This helps match you with compatible dorms and roommates" to "This helps us personalize your experience"
- Add new `role` field prop (`tenant_role: string`)
- Add Role selection cards (Student / Non-student) below Gender, same card style as Gender cards
- Emojis: 🎓 for Student, 💼 for Non-student

**File:** `src/components/student/mobile/MobileStudentWizard.tsx`
- Add `tenant_role: string` to `WizardFormData` interface and `INITIAL_DATA`
- Pass `tenant_role` to BasicInfoStep
- Update `canProceed()` for step 2 to also require `formData.tenant_role`
- Update `handleSubmit()` to save `tenant_role` to students table

---

## Section 4 — Academic Page Conditional Skip

**File:** `src/components/student/mobile/MobileStudentWizard.tsx`
- In `handleNext()`: if `tenant_role === 'non_student'` and `currentStep === 3` (Hometown), skip step 4 (Academic) and go to step 5 (Phase 2 overview)
- In `handleBack()`: if `tenant_role === 'non_student'` and `currentStep === 5` or `currentStep === 6`, go back to step 3 (Hometown) instead of step 4
- Update `getTotalSteps()` to subtract 1 if non-student
- Update `getDisplayStep()` to adjust numbering for non-student

---

## Section 6 — Accommodation Status: Labels, Dropdowns, and Building-Type Logic

**File:** `src/components/student/mobile/steps/AccommodationStatusStep.tsx`

**Copy changes:**
- Heading: "Do you need a dorm?" → "What is your current accommodation status?"
- Card labels: "Need Dorm" → "Need Housing", "Have Dorm" → "Have Housing"
- Container title: "Your Current Dorm" → "Your Current Housing"
- Dropdown labels: "Select your dorm" → "Select your housing building"

**New dropdown logic for "Have Housing":**
After building is selected, fetch its `property_type` from the `dorms` table:
- If `property_type === 'dormitory'` → show "Select your room" dropdown (rooms table, current behavior)
- If `property_type === 'apartment'` or `property_type === 'shared_apartment'` → show "Select your apartment" dropdown (apartments table by building_id), then after selection show "Select your bedroom" dropdown (bedrooms table by apartment_id)
- If `property_type === 'hybrid'` → show "Select your rental" dropdown that combines rooms and apartments. After selection: if it's a room → no further dropdown; if it's an apartment → show "Select your bedroom" dropdown

**New form data fields needed in WizardFormData:**
- `current_apartment_id: string`
- `current_bedroom_id: string`

These already exist on the `students` table.

**Roommate toggle logic replacement:**
- Stand-alone room (dormitory/hybrid building): show toggle if room is non-single AND `capacity_occupied ≤ capacity - 1`
- Apartment unit: check apartment-level `max_capacity` vs occupied. Show toggle if `occupied ≤ max_capacity - 1`
- AI Personality Matching toggle beneath if roommate toggle = YES

---

## Section 7 — Housing Preferences: New "Preferred Housing Type" Field

**File:** `src/components/student/mobile/steps/HousingPreferencesStep.tsx`

**Copy change:** Subtitle "Find dorms that fit your needs" → "Find rentals that fit your needs"

**New field above room type dropdown:**
- "Preferred housing type" with two cards: "Room" and "Apartment"

**Conditional logic:**
- Room selected → show existing room_type dropdown. Roommate toggle only if room_type ≠ Single
- Apartment selected → hide room_type dropdown, show new "Preferred apartment type" dropdown with "Family-style apartment" and "Shared apartment". Roommate toggle always shown

**New form data fields:**
- `preferred_housing_type: string` (room/apartment)
- `preferred_apartment_type: string`

Add these to `WizardFormData`, `INITIAL_DATA`, and `handleSubmit()`.

---

## Section 8 — Phase 3 Transition Copy

**File:** `src/components/student/mobile/steps/StudentStepOverview.tsx`

No direct change here — the "13 quick questions" text is in `PersonalityMatchingStep.tsx` line ~97. Change "13 quick questions about your lifestyle" → "17 quick questions about your lifestyle".

---

## Section 9 — Personality Survey Full Replacement

**File:** `src/components/profile/PersonalitySurveyModal.tsx`

Complete rewrite of the questions array to 5 steps with 17 questions as specified. New sections:
1. Lifestyle & Daily Rhythm (6 questions — adds partner overnight Q4)
2. Work & Daily Routine (2 questions — replaces old Study & Work)
3. Social & Compatibility (4 questions — adds conflict address method Q3)
4. Habits & Preferences (3 questions — adds expense handling Q3)
5. Pets & Dealbreakers (2 questions — entirely new)

Update `PersonalityAnswers` interface to add 6 new fields. Update the save logic to include new fields. Update `computePersonalityVector` to incorporate new dimensions.

---

## Section 10 — Profile Extras: Photo Upload Redesign

**File:** `src/components/student/mobile/steps/ProfileExtrasStep.tsx`

- Delete the URL input field and small avatar+camera placeholder
- Replace with `ProfilePhotoUpload` component (already exists, same as `/profile?editMode=true`)
- Need to pass `userId` as a prop — add to ProfileExtrasStep props
- New description text centered below: "A photo helps other tenants, including potential roommates, and owners to recognize you"
- Pass `userInitial` derived from `formData.full_name`

**File:** `src/components/student/mobile/MobileStudentWizard.tsx`
- Pass `userId` and `full_name` to ProfileExtrasStep

---

## Section 11 — Review Page: Role Card + Conditional Academic

**File:** `src/components/student/mobile/steps/StudentReviewStep.tsx`

- Add `tenant_role` to props data interface
- Add new "Role" summary card between Personal Info and Location cards
- Card shows "Student" or "Non-student", edit links to step 2
- If `tenant_role === 'non_student'` → filter out the "Academic" section from sections array

---

## Summary of All Files Modified

1. `src/App.tsx` — route rename
2. `src/pages/Profile.tsx` — navigate string
3. `src/components/student/mobile/steps/StudentAirbnbIntroStep.tsx` — copy
4. `src/components/student/mobile/steps/BasicInfoStep.tsx` — subtitle + role field
5. `src/components/student/mobile/MobileStudentWizard.tsx` — form data, navigation, conditional skip, new props
6. `src/components/student/mobile/steps/AccommodationStatusStep.tsx` — labels + building-type dropdown logic
7. `src/components/student/mobile/steps/HousingPreferencesStep.tsx` — subtitle + housing type field
8. `src/components/student/mobile/steps/PersonalityMatchingStep.tsx` — question count copy
9. `src/components/profile/PersonalitySurveyModal.tsx` — full survey replacement
10. `src/components/student/mobile/steps/ProfileExtrasStep.tsx` — photo upload redesign
11. `src/components/student/mobile/steps/StudentReviewStep.tsx` — role card + conditional academic

**Database migration:** Add `tenant_role` + 6 new personality columns to `students` table.

