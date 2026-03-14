

# Phase 2 Fix Plan — Implementation

## FIX 1 — Back Navigation Arrow

Add `<button>` with `ArrowLeft` icon before the two-column layout at line 476. Already imported.

**Line 476:** Insert before `<div className="max-w-[1200px]...">`:
```tsx
<button onClick={() => navigate('/profile')} className="absolute top-[100px] left-6 p-2 rounded-full hover:bg-[#F7F7F7] transition-colors z-20">
  <ArrowLeft className="w-5 h-5 text-[#717171]" />
</button>
```

## FIX 2 — AI Personality Matching Row Visibility

The code at line 635 already gates with `{(needsRoommateCurrentPlace || needsRoommateNewDorm) && (...)}`. However, the issue is that `showRoommateToggle` (line 617) gates the entire **section**, so if `showRoommateToggle` is `true` but both roommate toggles are OFF, the section still shows with just the "Looking for a roommate?" toggle — and the AI row is hidden. This is correct behavior.

**The real bug**: `showRoommateToggle` for `need_dorm` path (line 448) returns `true` when `room_type` is non-single, even without checking `preferredHousingType`. This means the roommate section shows even when there's no housing type selected. The fix is part of FIX 5's `showRoommateToggle` rewrite.

Also need to verify: the condition on line 635 checks `needsRoommateCurrentPlace || needsRoommateNewDorm` — these are separate state variables for each path. This is correct. **No additional change needed for Fix 2 beyond what Fix 3/5 do to `showRoommateToggle`.**

## FIX 3 — Roommate Toggle: Capacity-Aware for "Have a Place"

Update `loadDorms` (line 238) to fetch `property_type`:
```ts
.select('id, name, area, property_type')
```

Add new state:
- `selectedBuildingType: string` — derived from selected dorm's `property_type`
- `currentApartmentId: string`, `currentBedroomId: string`
- `availableApartments: any[]`, `availableBedrooms: any[]`
- `currentApartmentData: any` (for capacity check)

Update `showRoommateToggle` for `have_dorm` path to mirror `AccommodationStatusStep.getShowRoommateToggle()`:
- If `currentRoomId` selected: check non-single + `roomy_confirmed_occupants + 1 <= capacity - 1`
- If `currentApartmentId` selected: check `max_capacity > 1`
- Otherwise: `false`

## FIX 4 — Full Building Type Dropdown Hierarchy in "Current Housing" Modal

Replace the current_dorm modal (lines 956-1006) with building-type-aware logic matching `AccommodationStatusStep.tsx`:

Add loader functions: `loadApartmentsForBuilding(buildingId)`, `loadBedroomsForApartment(aptId)`

Modal structure based on `selectedBuildingType`:
- **dormitory**: Building dropdown → Room dropdown (current)
- **apartment/shared_apartment**: Building → Apartment → Bedroom
- **hybrid**: Building → combined Room+Apartment dropdown → if apartment, Bedroom

Update `tempValue` to `{ dormId, roomId, apartmentId, bedroomId }`.

Update `saveFieldValue` for `current_dorm` to save all 4 IDs.

Update `getCurrentDormDisplay()` to show apartment/bedroom names.

Update `openFieldModal('current_dorm')` to include apartment/bedroom IDs in tempValue.

## FIX 5 — "Need a Place": Housing Type Cards + Apartment Type

Add state:
- `preferredHousingType: 'room' | 'apartment' | ''` — loaded from `preferred_housing_type`
- `preferredApartmentType: string` — loaded from `preferred_apartment_type`

Add `'apartment_type'` to `EditableField` union type.

Update `loadProfile` to set these from DB.

Add `handlePreferredHousingTypeChange(type)` — immediate save like `handleAccommodationStatusChange`.

Replace `need_dorm` content (lines 601-607):
1. Budget row (unchanged)
2. Preferred areas row (unchanged)
3. **New**: Two cards — 🛏 Room / 🏠 Apartment
4. If Room: show Room type field row. 
5. If Apartment: show Apartment type field row (new modal with Family-style / Shared apartment)
6. If neither: hide type fields

Add new apartment_type modal.

Update `saveFieldValue` to handle `apartment_type`.

Rewrite `showRoommateToggle` for `need_dorm`:
- `preferredHousingType === 'room'` → show only if `room_type` selected and not single
- `preferredHousingType === 'apartment'` → always show
- Otherwise → hide

## Summary of Changes

**File: `src/components/profile/StudentProfileEditPage.tsx`**

| Change | Lines Affected |
|--------|---------------|
| Back arrow | Insert before line 476 |
| `EditableField` type | Line 24 — add `'apartment_type'` |
| `StudentProfile` interface | Lines 26-50 — add `preferred_housing_type`, `preferred_apartment_type`, `current_apartment_id`, `current_bedroom_id` |
| New state variables | After line 82 — `preferredHousingType`, `preferredApartmentType`, `currentApartmentId`, `currentBedroomId`, `availableApartments`, `availableBedrooms`, `selectedBuildingType`, `currentApartmentData` |
| `loadDorms` | Line 241 — add `property_type` to select |
| `loadProfile` | Lines 216-236 — load new fields |
| New loaders | `loadApartmentsForBuilding()`, `loadBedroomsForApartment()` |
| `handlePreferredHousingTypeChange()` | New function |
| `showRoommateToggle` | Lines 445-462 — full rewrite |
| `getCurrentDormDisplay()` | Lines 391-398 — include apartment/bedroom |
| `openFieldModal('current_dorm')` | Line 285 — include apartment/bedroom IDs |
| `saveFieldValue('current_dorm')` | Lines 313-320 — save 4 IDs |
| Need a Place UI | Lines 601-607 — housing type cards + conditional fields |
| Have a Place modal | Lines 956-1006 — building-type-aware dropdowns |
| New apartment_type modal | After room_type modal |

