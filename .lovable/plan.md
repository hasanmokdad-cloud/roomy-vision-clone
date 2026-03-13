

## Bug: "Submit for verification" button missing on dorm flow

### Root Cause

The wizard has two flows:
- **Apartment flow**: Steps go up to 29 (ReviewStep at step 29)
- **Dorm flow**: Steps end at 26 (ReviewStep at step 26), steps 27-29 return `null`

The `isLastStep` check on line 1289 is:
```typescript
const isLastStep = currentStep === TOTAL_STEPS - 1; // always checks step 29
```

This means for the dorm flow, step 26 (which IS the last real step) shows "Next" instead of "Submit for verification". Clicking "Next" advances to step 27, which renders nothing (blank page).

### Fix

Make `isLastStep` flow-aware:

```typescript
const isLastStep = isApartmentFlow 
  ? currentStep === TOTAL_STEPS - 1  // step 29 for apartments
  : currentStep === 26;               // step 26 for dorms
```

Also update `handleNext` to not advance past step 26 for dorm flow (it currently goes to 27+ because the generic `currentStep < TOTAL_STEPS - 1` check passes).

### Files to Change

| File | Change |
|------|--------|
| `src/components/owner/mobile/MobileDormWizard.tsx` | Update `isLastStep` logic on line 1289 to be flow-aware |

### Technical Details

- Line 1289: Change `isLastStep` to check step 26 for dorm flow, step 29 for apartment flow
- The `isApartmentFlow` variable already exists in the component and correctly identifies the flow type
- No other files need changes -- `WizardFooter` already handles `isLastStep` prop correctly
