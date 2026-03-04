

## Student Wizard UI Alignment Plan

### Problem
Every student wizard step uses left-aligned, edge-to-edge layout (`px-6 pt-20 pb-32`) while the owner wizard uses centered, constrained layout (`min-h-screen flex flex-col items-center pt-24 pb-32 px-6` with `max-w-xl mx-auto` inner wrapper and `text-center` headings).

### Approach
Update each student step component's outer wrapper and heading styles to match the owner wizard pattern. There is no shared step wrapper component, so each step file must be updated individually (8 step files + review step).

### Changes per file

**Pattern to apply to all step files** — replace the outer div + heading structure:

From:
```html
<div className="px-6 pt-20 pb-32">
  <motion.div ...>
    <h2 className="text-2xl font-bold ...">
    <p className="text-muted-foreground mb-8">
```

To:
```html
<div className="min-h-screen flex flex-col items-center pt-24 pb-32 px-6">
  <div className="w-full max-w-xl mx-auto">
    <motion.div ...>
      <div className="text-center mb-6">
        <h1 className="text-2xl lg:text-[32px] font-semibold ...">
        <p className="text-muted-foreground mt-2">
      </div>
```

Close with extra `</div>` for the `max-w-xl` wrapper.

**Files to update (8 total):**

1. `BasicInfoStep.tsx` — wrap in centered container, center heading/subtitle
2. `HometownStep.tsx` — same pattern
3. `AcademicStep.tsx` — same pattern
4. `AccommodationStatusStep.tsx` — same pattern; status option cards: change from `grid-cols-1` full-width to `grid-cols-1 lg:grid-cols-2` compact cards
5. `HousingPreferencesStep.tsx` — same pattern
6. `PersonalityMatchingStep.tsx` — already centered heading; just needs outer wrapper alignment
7. `ProfileExtrasStep.tsx` — same pattern
8. `StudentReviewStep.tsx` — same pattern

### No text/label/functionality changes
Only CSS class changes: container centering, max-width constraint, heading size/weight, text alignment, and spacing.

