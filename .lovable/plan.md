

# Phase 2 — Tenant Profile Pages Plan

## Files to Modify

1. **`src/pages/Profile.tsx`** — Mobile public profile: role badge, copy fixes
2. **`src/components/profile/StudentProfileEditPage.tsx`** — Edit page: Role section, conditional academic, copy updates, survey button states
3. **`src/components/profile/PersonalitySurveyModal.tsx`** — Pre-fill answers on open, add Save button (profile-only), `openedFrom` prop
4. **`src/components/profile/AboutMeTab.tsx`** — Desktop public profile: role badge, copy fix

No database changes needed — all columns already exist.

---

## Section 1 — Role Badge on Public Profile

**Profile.tsx (mobile, ~line 336-339):** After the `<h2>` name, replace hardcoded `<p>Student</p>` with dynamic badge:
- If `studentProfileData?.tenant_role === 'student'` → show `🎓 Student` badge
- If `tenant_role === 'non_student'` → show `💼 Non-student`
- If null → show nothing
- Style: small `<span>` with `text-sm text-muted-foreground`

Need to fetch `tenant_role` — add it to the `select()` query on lines 88 and 157.

**AboutMeTab.tsx (desktop, line 77):** Same logic — replace hardcoded "Student" with dynamic role badge. Pass `tenantRole` as a new prop from Profile.tsx.

## Section 2 — Copy Fix: "Complete Your Profile" Section

**Profile.tsx (mobile, line 357):** Change "Set up your profile to get personalized dorm matches" → "Set up your profile to get personalized rental matches"

**AboutMeTab.tsx (desktop, line 90):** Change "...help other students get to know you." → "...help other tenants get to know you."

## Section 3 — New "Role" Section in Edit Page

**StudentProfileEditPage.tsx:** 
- Add `tenant_role` to `StudentProfile` interface and `loadProfile`
- Add `tenantRole` local state
- Insert new "Your Role" section between Personal Information and Academic Information (~line 481)
- Two cards: 🎓 Student / 💼 Non-student, same card style as accommodation status cards
- Pre-select from DB, update local state on click (saved with global save)

## Section 4 — Conditional Academic Section

**StudentProfileEditPage.tsx (~line 483-491):** Wrap Academic Information section in `{tenantRole === 'student' && (...)}`. No data deletion.

## Section 5 — Accommodation Status Copy

**StudentProfileEditPage.tsx (~lines 507-522):**
- "Need Dorm" → "Need a Place", "I'm looking for a dorm" → "I'm looking for accommodation"
- "Have Dorm" → "Have a Place", "I already have a dorm" → "I already have accommodation"
- Current dorm modal title (~line 874): "Current dorm & room" → "Current housing"
- Dorm label (~line 880): "Dorm" → "Housing building"
- SelectValue placeholder (~line 889): "Select dorm" → "Select housing"

## Section 6 — Survey Button Dynamic States

**StudentProfileEditPage.tsx:** Replace the current simple Start/Edit button with 3-state logic:
- Load all 17 personality columns on profile load
- Define `PERSONALITY_COLUMNS` array of the 17 column names
- Compute: `filledCount` = count of non-null columns, `totalCount` = 17
- If `filledCount === 0` → "Start" button (primary gradient style)
- If `0 < filledCount < 17` → "Continue" button (outline + small progress text like "12/17")
- If `filledCount === 17` → "Edit" button (ghost/outline)
- After modal closes, re-query and update state

## Section 7 — PersonalitySurveyModal: Pre-fill + Save Button

**PersonalitySurveyModal.tsx:**
- Add `openedFrom?: 'wizard' | 'profile'` prop (default `'wizard'`)
- On `open` change to `true` AND `openedFrom === 'profile'`: fetch current user's personality columns from DB and populate `answers` state
- Add `handleSaveAndClose()`: saves current step's answers to DB, closes modal, calls `onComplete()`
- Footer layout change: when `openedFrom === 'profile'`:
  - All steps except last: `[Back] [Save] [Next →]`
  - Last step: `[Back] [Save] [Complete ✓]`
- When `openedFrom === 'wizard'`: keep current footer (no Save button)

**StudentProfileEditPage.tsx:** Pass `openedFrom="profile"` to the modal.

## Section 8 — "Find Matches" Button Rename

**StudentProfileEditPage.tsx (~line 393):** Change `'Find Dorm Matches'` → `'Find Matches'`

## Section 9 — Profile Subtitle Copy

**StudentProfileEditPage.tsx (~line 468):** Change "Students can see your profile when looking for roommates or dorms." → "Other tenants can see your profile when looking for rentals or roommates."

## Section 10 — Save tenant_role on Save

**StudentProfileEditPage.tsx:** The edit page uses per-field save modals (no global "Save Changes" button). The role cards should save immediately on click, same as `handleAccommodationStatusChange`. Add `handleRoleChange(role)` that updates local state + DB immediately.

---

## Summary

| File | Changes |
|------|---------|
| `Profile.tsx` | Fetch `tenant_role`, dynamic badge on mobile, copy fix |
| `AboutMeTab.tsx` | New `tenantRole` prop, dynamic badge, copy fix |
| `StudentProfileEditPage.tsx` | Role section, conditional academic, copy updates, survey button states, save role, rename button |
| `PersonalitySurveyModal.tsx` | `openedFrom` prop, pre-fill from DB, Save button |

