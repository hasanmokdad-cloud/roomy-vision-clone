

## Bug Analysis

The root cause is in `MobileStudentWizard.tsx` line 200:

```typescript
if (currentStep === totalSteps) {
  await handleSubmit();
}
```

`getTotalSteps()` returns 6-8 (count of form steps), but `currentStep` uses actual step indices (0-11). This comparison is wrong:

- **have_dorm, no personality**: `totalSteps=6`, so at step 6 (Accommodation Status), `currentStep === totalSteps` is TRUE → submits immediately, skipping Profile Extras and Review.
- **need_dorm, no personality**: `totalSteps=7`, so at step 7 (Housing Preferences), it submits immediately.
- **need_dorm, with personality**: `totalSteps=8`, so at step 8 (Phase 3 transition), it submits immediately.
- **have_dorm, with personality**: `totalSteps=7`, submit never triggers because step 11 never equals 7 → wizard gets stuck.

## Fix

**File: `src/components/student/mobile/MobileStudentWizard.tsx`**

One change — line 200: replace `currentStep === totalSteps` with `currentStep === 11`, since step 11 (Review & Submit) is always the final step regardless of which conditional branches were taken.

```typescript
if (currentStep === 11) {
  await handleSubmit();
}
```

The `isLastStep={currentStep === 11}` prop on the footer (line 502) is already correct, so the button label will display "Complete setup" at the right time. No other files need changes.

