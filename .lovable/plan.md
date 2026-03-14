

# Surgical Fix — Current Housing Modal Dropdowns Race Condition

## Problem Diagnosis ✓

The user's diagnosis is **correct**. The cascading dropdowns are fully implemented but never render due to a race condition:

1. **`getTempBuildingType()`** (line 587) is a plain function that reads from `availableDorms` array
2. The conditional rendering blocks (lines 1201, 1222, 1268) call `getTempBuildingType()` to determine which dropdowns to show
3. When the modal opens, `openFieldModal('current_dorm')` (line 346-347) sets `tempValue` with the selected IDs, but **does not set `selectedBuildingType`**
4. Even though `selectedBuildingType` is correctly set in the building dropdown's `onValueChange` handler (line 1174), it's **not initialized** when the modal opens with existing data
5. The conditional blocks use function calls instead of state variables, so they don't trigger re-renders when `availableDorms` loads

## Solution

Replace all `getTempBuildingType()` calls in conditional rendering with the `selectedBuildingType` state variable, and initialize `selectedBuildingType` when the modal opens.

### Changes Required

**File:** `src/components/profile/StudentProfileEditPage.tsx`

**1. Line 1201** — Dormitory condition:
```tsx
// BEFORE:
{tempValue?.dormId && getTempBuildingType() === 'dormitory' && (

// AFTER:
{tempValue?.dormId && selectedBuildingType === 'dormitory' && (
```

**2. Line 1222** — Apartment/Shared Apartment condition:
```tsx
// BEFORE:
{tempValue?.dormId && (getTempBuildingType() === 'apartment' || getTempBuildingType() === 'shared_apartment') && (

// AFTER:
{tempValue?.dormId && (selectedBuildingType === 'apartment' || selectedBuildingType === 'shared_apartment') && (
```

**3. Line 1268** — Hybrid condition:
```tsx
// BEFORE:
{tempValue?.dormId && getTempBuildingType() === 'hybrid' && (

// AFTER:
{tempValue?.dormId && selectedBuildingType === 'hybrid' && (
```

**4. Lines 346-347** — Initialize `selectedBuildingType` in `openFieldModal`:
```tsx
// BEFORE:
} else if (field === 'current_dorm') {
  setTempValue({ dormId: currentDormId, roomId: currentRoomId, apartmentId: currentApartmentId, bedroomId: currentBedroomId });
}

// AFTER:
} else if (field === 'current_dorm') {
  setTempValue({ dormId: currentDormId, roomId: currentRoomId, apartmentId: currentApartmentId, bedroomId: currentBedroomId });
  if (currentDormId) {
    const dorm = availableDorms.find(d => d.id === currentDormId);
    setSelectedBuildingType(dorm?.property_type || 'dormitory');
  } else {
    setSelectedBuildingType('');
  }
}
```

## Why This Works

- `selectedBuildingType` is a React state variable that triggers re-renders when updated
- It's already being set correctly in the building dropdown's `onValueChange` (line 1174)
- By also setting it in `openFieldModal`, it will have the correct value from the moment the modal opens
- The conditional rendering blocks will now respond to state changes instead of calling a function that reads stale data

## No Side Effects

- `getTempBuildingType()` can remain in the code (it's not harmful, just unused after this fix)
- All other modal logic (apartment/bedroom loaders, save behavior) is already correct
- No changes to database queries, state structure, or other components needed

