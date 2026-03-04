# Tenanters — Student Onboarding Wizard Wireframe

> **Document version:** 1.0  
> **Last updated:** 2026-03-04  
> **Purpose:** Complete page-by-page wireframe for the Student Profile Setup Wizard  
> **Entry point:** "Get Started" button on `/profile` page (desktop) or auto-triggered for new students

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Persistent UI Shell](#2-persistent-ui-shell)
3. [Step-by-Step Wireframes](#3-step-by-step-wireframes)
4. [Conditional Flow Logic](#4-conditional-flow-logic)
5. [Data Model](#5-data-model)
6. [Validation Rules](#6-validation-rules)
7. [State Management & Persistence](#7-state-management--persistence)

---

## 1. Overview & Architecture

### Step Index Map

| Step | Type | Name | Phase |
|------|------|------|-------|
| 0 | Intro | Welcome / Resume Screen | — |
| 1 | Transition | Phase 1 Overview ("About You") | Phase 1 |
| 2 | Form | Basic Info | Phase 1 |
| 3 | Form | Hometown | Phase 1 |
| 4 | Form | Academic | Phase 1 |
| 5 | Transition | Phase 2 Overview ("Accommodation") | Phase 2 |
| 6 | Form | Accommodation Status | Phase 2 |
| 7 | Form (conditional) | Housing Preferences | Phase 2 |
| 8 | Transition (conditional) | Phase 3 Overview ("Lifestyle & Habits") | Phase 3 |
| 9 | Form (conditional) | Personality Matching | Phase 3 |
| 10 | Form | Profile Extras | Final |
| 11 | Form | Review & Submit | Final |

**Total form steps:** 6–8 (depending on conditional branches)  
**Transition steps:** 1, 5, 8 (auto-advance after 1.5s animation)

---

## 2. Persistent UI Shell

### Top Bar (`StudentWizardTopBar`)
- **Layout:** Fixed at top, full-width, `z-50`, white background
- **Left:** "Tenanters" gradient logo text (clickable → triggers Save & Exit)
- **Right:** "Save & exit" pill button (border, rounded-full, `#222222` text)
- **Padding:** `px-8 lg:px-16 xl:px-24 py-4`
- **Behavior:** Clicking either the logo or button saves progress to `localStorage` and navigates to `/listings`

### Footer (`StudentWizardFooter`)
- **Layout:** Fixed at bottom, full-width
- **Left:** "Back" button (underlined text, no border)
- **Right:** "Next" button (solid black, rounded, disabled state when validation fails)
- **Last step variant:** "Next" becomes "Complete Setup" (gradient primary button)
- **Hidden on:** Intro step (step 0) and all transition steps (1, 5, 8)

### Progress Indicator
- **Type:** Segmented progress bar (thin line at top, below TopBar)
- **Segments:** Only counts form steps (not intro/transitions)
- **Dynamic count:** Adjusts based on conditional steps (housing prefs, personality matching)

---

## 3. Step-by-Step Wireframes

---

### Step 0 — Welcome / Intro Screen (`StudentAirbnbIntroStep`)

**Layout:** Full-screen, no TopBar, no Footer (self-contained)

```
┌─────────────────────────────────────────────┐
│                                             │
│   [Tenanters Logo - gradient]               │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │                                     │   │
│   │   Illustration / Animation          │   │
│   │   (Welcome graphic)                 │   │
│   │                                     │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   "Let's set up your profile"               │
│   (subtitle text explaining benefits)       │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │  [Get Started]  (primary button)    │   │
│   └─────────────────────────────────────┘   │
│                                             │
│   ┌─────────────────────────────────────┐   │ ← Only if saved progress exists
│   │  [Resume where you left off]        │   │
│   │  (secondary/outline button)         │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior:**
- "Get Started" clears any saved progress and advances to Step 1
- "Resume" (conditionally shown) restores saved `formData` + `currentStep` from `localStorage`
- `hasSavedProgress` flag set on mount by checking `localStorage` key `roomy_student_onboarding_{userId}`

---

### Step 1 — Phase 1 Overview: "About You" (`StudentStepOverview phase=1`)

**Type:** Transition (auto-advances after 1.5s)

```
┌─────────────────────────────────────────────┐
│ [TopBar]                                    │
├─────────────────────────────────────────────┤
│                                             │
│           Phase indicator icon              │
│           (animated entrance)               │
│                                             │
│      "Step 1"  (small label)                │
│      "About You"  (large heading)           │
│      "Tell us a bit about yourself"         │
│      (subtitle)                             │
│                                             │
│      [Animated dots / spinner]              │
│                                             │
└─────────────────────────────────────────────┘
```

**Behavior:** Auto-advances to Step 2 after 1.5 seconds. No footer shown.

---

### Step 2 — Basic Info (`BasicInfoStep`)

**Required fields:** `full_name`, `gender`  
**Optional fields:** `age`

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━░░░░░░░░░░░░░░░░░░░░░] Progress 1/N  │
├─────────────────────────────────────────────┤
│                                             │
│  "Tell us about yourself"                   │
│  "This helps match you with compatible      │
│   dorms and roommates"                      │
│                                             │
│  ┌─ Full name ──────────────────────────┐   │
│  │  [Text input: "Enter your full name"]│   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Age                                        │
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ [-]  │  │  18  │  │ [+]  │              │
│  └──────┘  └──────┘  └──────┘              │
│  (Stepper: min 16, max 99, circular btns)  │
│                                             │
│  Gender                                     │
│  ┌───────────────┐  ┌───────────────┐      │
│  │ 👨 Male       │  │ 👩 Female     │      │
│  └───────────────┘  └───────────────┘      │
│  (Radio-style cards, selected = primary     │
│   border + fill)                            │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]                        [Next →]    │
└─────────────────────────────────────────────┘
```

**Validation:** `Next` enabled only when `full_name.trim()` is non-empty AND `gender` is selected.

---

### Step 3 — Hometown (`HometownStep`)

**All fields optional** (no validation blocking)

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━━━━━░░░░░░░░░░░░░░░░░] Progress 2/N  │
├─────────────────────────────────────────────┤
│                                             │
│  "Where are you from?"                      │
│  "Helps find students from your area"       │
│                                             │
│  Governorate (Mohafaza)                     │
│  ┌──────────────────────────────────────┐   │
│  │ [Select dropdown]                    │   │
│  │ Options: All Lebanon governorates    │   │
│  │ (Beirut, Mount Lebanon, North, etc.) │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  District (Qada)                            │
│  ┌──────────────────────────────────────┐   │
│  │ [Select dropdown]                    │   │
│  │ (Filtered by selected governorate)   │   │
│  │ Disabled until governorate selected  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Town / Village                             │
│  ┌──────────────────────────────────────┐   │
│  │ [Select dropdown]                    │   │
│  │ (Filtered by selected district)      │   │
│  │ Disabled until district selected     │   │
│  └──────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]                        [Next →]    │
└─────────────────────────────────────────────┘
```

**Data source:** `residentialAreas` static data (3-tier cascading: Governorate → District → Town/Village)  
**Back behavior:** Goes to Step 2 (skips transition Step 1 → jumps to Step 0)

---

### Step 4 — Academic Info (`AcademicStep`)

**Required:** `university`  
**Optional:** `major`, `year_of_study`

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━━━━━━━━━░░░░░░░░░░░░░] Progress 3/N  │
├─────────────────────────────────────────────┤
│                                             │
│  "Academic information"                     │
│  "Connect with students from your           │
│   university"                               │
│                                             │
│  University *                               │
│  ┌──────────────────────────────────────┐   │
│  │ [Select dropdown]                    │   │
│  │ Options: All Lebanese universities   │   │
│  │ (from universities.ts data file)     │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Major                                      │
│  ┌──────────────────────────────────────┐   │
│  │ [Text input: "e.g. Computer Science"]│   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Year of Study                              │
│  ┌──────────────────────────────────────┐   │
│  │ [Select dropdown]                    │   │
│  │ Year 1 (Freshman)                    │   │
│  │ Year 2 (Sophomore)                   │   │
│  │ Year 3 (Junior)                      │   │
│  │ Year 4 (Senior)                      │   │
│  │ Year 5+                              │   │
│  │ Graduate Student                     │   │
│  └──────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]                        [Next →]    │
└─────────────────────────────────────────────┘
```

**Validation:** `Next` enabled only when `university` is selected.

---

### Step 5 — Phase 2 Overview: "Accommodation" (`StudentStepOverview phase=2`)

**Type:** Transition (auto-advances after 1.5s)

```
Same layout as Step 1 transition, but with:
- "Step 2"
- "Accommodation"
- "Let's find your living situation"
```

**Back behavior:** Step 6 → Back skips Step 5 → goes to Step 4

---

### Step 6 — Accommodation Status (`AccommodationStatusStep`)

**This is the primary branching step.**

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━━━━━━━━━━━━━░░░░░░░░░] Progress 4/N  │
├─────────────────────────────────────────────┤
│                                             │
│  "Do you currently have a dorm?"            │
│  "This helps us understand your needs"      │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 🏠  "I already have a dorm"         │   │
│  │     (have_dorm)                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 🔍  "I need to find a dorm"         │   │
│  │     (need_dorm)                      │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ══════════════════════════════════════════  │
│                                             │
│  IF "have_dorm" SELECTED:                   │
│  ┌──────────────────────────────────────┐   │
│  │ Select Your Dorm *                   │   │
│  │ [Dropdown: verified dorms list]      │   │
│  │ (fetched from DB: verified + avail.) │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ Select Your Room *                   │   │
│  │ [Dropdown: rooms in selected dorm]   │   │
│  │ Each shows: name, type, occupancy    │   │
│  │ badge (e.g. "2/3 occupied")          │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │ ⚠️ Full rooms shown as disabled      │   │
│  │ with "(Full)" badge                  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ── COMMON SECTION (both paths) ──────────  │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 🤝 Need a Roommate?    [Toggle OFF]  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  IF needs_roommate = true:                  │
│  ┌──────────────────────────────────────┐   │
│  │ ✨ Enable Personality   [Toggle OFF]  │   │
│  │    Matching                           │   │
│  │ "Get matched based on lifestyle,     │   │
│  │  habits, and personality"            │   │
│  └──────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]                        [Next →]    │
└─────────────────────────────────────────────┘
```

**Validation for `have_dorm`:** Both `current_dorm_id` AND `current_room_id` must be selected  
**Validation for `need_dorm`:** Always valid (status is pre-selected)

**Next behavior (CRITICAL BRANCHING):**
| Current State | Next Step |
|---|---|
| `have_dorm` + personality matching OFF | → Step 10 (Profile Extras) |
| `have_dorm` + personality matching ON | → Step 8 (Phase 3 transition) |
| `need_dorm` | → Step 7 (Housing Preferences) |

---

### Step 7 — Housing Preferences (`HousingPreferencesStep`)

**Shown only if:** `accommodation_status === 'need_dorm'`  
**Required:** `budget > 0`, `room_type`, `city`

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━━━━━━━━━━━━━━━━░░░░░░] Progress 5/N  │
├─────────────────────────────────────────────┤
│                                             │
│  "What are you looking for?"                │
│  "We'll match you with the best options"    │
│                                             │
│  Monthly Budget (USD)                       │
│  ┌──────────────────────────────────────┐   │
│  │ $300 ═══════●══════════════ $2000    │   │
│  │          [Slider]                    │   │
│  │ Current: $500                        │   │
│  └──────────────────────────────────────┘   │
│  Quick-pick: [$300] [$500] [$800] [$1000]  │
│  (Budget preset chips)                      │
│                                             │
│  Preferred Room Type *                      │
│  ┌──────────────────────────────────────┐   │
│  │ [Select dropdown]                    │   │
│  │ All 17 room types from roomTypes.ts  │   │
│  │ (Single, Double, Triple, Studio,     │   │
│  │  Suite, Shared, etc.)                │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  City *                                     │
│  ┌──────────────────────────────────────┐   │
│  │ [Select: Byblos / Beirut]            │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  Preferred Area                             │
│  ┌──────────────────────────────────────┐   │
│  │ [Select dropdown]                    │   │
│  │ (Filtered by selected city)          │   │
│  │ Byblos: Blat, Nahr Ibrahim, etc.     │   │
│  │ Beirut: Hamra, Manara, Ashrafieh...  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ── ROOMMATE SECTION ────────────────────   │
│  (only if room_type is NOT single)          │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │ 🤝 Need a Roommate?    [Toggle]      │   │
│  └──────────────────────────────────────┘   │
│  IF needs_roommate = true:                  │
│  ┌──────────────────────────────────────┐   │
│  │ ✨ Enable Personality   [Toggle]      │   │
│  │    Matching                           │   │
│  └──────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]                        [Next →]    │
└─────────────────────────────────────────────┘
```

**Validation:** `budget > 0` AND `room_type` selected AND `city` selected

**Next behavior:**
| State | Next Step |
|---|---|
| personality matching OFF | → Step 10 (skip Steps 8, 9) |
| personality matching ON | → Step 8 (Phase 3 transition) |

---

### Step 8 — Phase 3 Overview: "Lifestyle & Habits" (`StudentStepOverview phase=3`)

**Type:** Transition (auto-advances after 1.5s)  
**Shown only if:** `enable_personality_matching === true`

```
Same layout as other transitions:
- "Step 3"
- "Lifestyle & Habits"
- "Let's find your perfect match"
```

---

### Step 9 — Personality Matching (`PersonalityMatchingStep`)

**Shown only if:** `enable_personality_matching === true`

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━━━━━━━━━━━━━━━━━━░░░░] Progress N-2/N│
├─────────────────────────────────────────────┤
│                                             │
│         [🧠 Brain icon in circle]           │
│                                             │
│  "Personality Matching"                     │
│  "Answer a few questions to help us find    │
│   your ideal roommate"                      │
│                                             │
│  IF survey NOT completed:                   │
│  ┌──────────────────────────────────────┐   │
│  │  [Take the Survey]  (primary btn)    │   │
│  │  Auto-opens PersonalitySurveyModal   │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  IF survey COMPLETED:                       │
│  ┌──────────────────────────────────────┐   │
│  │  ✅ "Survey Complete!"               │   │
│  │  "Your personality profile is saved" │   │
│  │  [Retake Survey] (outline btn)       │   │
│  └──────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]                        [Next →]    │
└─────────────────────────────────────────────┘
```

**Modal:** `PersonalitySurveyModal` opens automatically on step entry if survey is not yet completed.  
**DB check:** Queries `students.personality_test_completed` on mount.

---

### Step 10 — Profile Extras (`ProfileExtrasStep`)

**All fields optional**

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━━━━━━━━━━━━━━━━━━━━░░] Progress N-1/N│
├─────────────────────────────────────────────┤
│                                             │
│  "Optional extras"                          │
│  "You can add these later from your profile"│
│                                             │
│  Profile photo                              │
│  ┌──────────────────────────────────────┐   │
│  │ [Avatar placeholder]  [URL input]    │   │
│  │  📷                   "Paste image   │   │
│  │  (80x80 circle)       URL or skip"   │   │
│  │                       (helper text)  │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  📱 Phone number                            │
│  ┌──────────────────────────────────────┐   │
│  │ [Input: "+961 XX XXX XXX"]           │   │
│  │ "Only shared with confirmed matches" │   │
│  └──────────────────────────────────────┘   │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]                        [Next →]    │
└─────────────────────────────────────────────┘
```

---

### Step 11 — Review & Submit (`StudentReviewStep`)

```
┌─────────────────────────────────────────────┐
│ [TopBar]                     [Save & exit]  │
│ [━━━━━━━━━━━━━━━━━━━━━━━━━━] Progress N/N  │
├─────────────────────────────────────────────┤
│                                             │
│  "Review your profile"                      │
│  "Make sure everything looks good"          │
│                                             │
│  ┌── Personal Info ─────────── [Edit ✏️] ──┐ │
│  │ Name:   John Doe                       │ │
│  │ Age:    20 years                       │ │
│  │ Gender: Male                           │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌── Location ─────────────── [Edit ✏️] ──┐ │
│  │ From: Jbeil, Mount Lebanon             │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌── Academic ─────────────── [Edit ✏️] ──┐ │
│  │ University: LAU                        │ │
│  │ Major:      Computer Science           │ │
│  │ Year:       Year 3                     │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  ┌── Preferences ──────────── [Edit ✏️] ──┐ │
│  │ City:      Byblos                      │ │
│  │ Area:      Blat                        │ │
│  │ Budget:    $500/mo                     │ │
│  │ Room Type: Double                      │ │
│  │ Roommate:  Yes                         │ │
│  └────────────────────────────────────────┘ │
│  (Preferences section only shown if         │
│   accommodation_status === 'need_dorm')     │
│                                             │
├─────────────────────────────────────────────┤
│ [← Back]               [Complete Setup ✓]   │
└─────────────────────────────────────────────┘
```

**Edit buttons:** Each "Edit" navigates directly to the corresponding step number (e.g., Personal Info → Step 2).  
**"Complete Setup" button:** Triggers `handleSubmit()`.

---

## 4. Conditional Flow Logic

### Complete Navigation Decision Tree

```
Step 0 (Intro)
  ├── "Get Started" → Step 1 (transition)
  └── "Resume" → Saved step

Step 1 (transition, 1.5s) → Step 2

Step 2 (Basic Info) → Step 3
Step 3 (Hometown) → Step 4
Step 4 (Academic) → Step 5 (transition)

Step 5 (transition, 1.5s) → Step 6

Step 6 (Accommodation Status)
  ├── have_dorm + personality OFF → Step 10
  ├── have_dorm + personality ON  → Step 8
  └── need_dorm                   → Step 7

Step 7 (Housing Prefs)
  ├── personality OFF → Step 10
  └── personality ON  → Step 8

Step 8 (transition, 1.5s) → Step 9
  └── BUT if personality OFF → Step 10 (skip 9)

Step 9 (Personality Matching) → Step 10
Step 10 (Profile Extras) → Step 11
Step 11 (Review) → Submit
```

### Back Navigation (reverse skips)

| From Step | Back Goes To | Reason |
|-----------|-------------|--------|
| 2 | 0 | Skip transition Step 1 |
| 6 | 4 | Skip transition Step 5 |
| 9 (have_dorm) | 6 | Skip transition Step 8 |
| 9 (need_dorm) | 7 | Skip transition Step 8 |
| 10 (personality OFF, have_dorm) | 6 | Skip Steps 7–9 |
| 10 (personality OFF, need_dorm) | 7 | Skip Steps 8–9 |
| 10 (personality ON) | 9 | Normal back |

---

## 5. Data Model

### `WizardFormData` Interface

```typescript
interface WizardFormData {
  // Phase 1: About You
  full_name: string;          // Required
  age: number;                // Default: 18, min: 16
  gender: string;             // Required: "Male" | "Female"
  
  // Phase 1: Hometown
  governorate: string;        // Optional (Lebanon governorate)
  district: string;           // Optional (filtered by governorate)
  town_village: string;       // Optional (filtered by district)
  
  // Phase 1: Academic
  university: string;         // Required
  major: string;              // Optional
  year_of_study: number;      // Default: 1 (1-6)
  
  // Phase 2: Accommodation
  accommodation_status: string;  // "need_dorm" | "have_dorm"
  current_dorm_id: string;      // Required if have_dorm
  current_room_id: string;      // Required if have_dorm
  
  // Phase 2: Housing (conditional)
  city: string;                  // Required if need_dorm
  preferred_housing_area: string; // Optional
  budget: number;                // Default: 300, required if need_dorm
  room_type: string;             // Required if need_dorm
  
  // Roommate
  needs_roommate: boolean;              // Default: false
  enable_personality_matching: boolean;  // Default: false
  
  // Profile Extras
  profile_photo_url: string;   // Optional (URL)
  phone_number: string;        // Optional
}
```

---

## 6. Validation Rules

| Step | Field | Rule |
|------|-------|------|
| 2 | `full_name` | Non-empty after trim |
| 2 | `gender` | Must be selected |
| 4 | `university` | Must be selected |
| 6 (have_dorm) | `current_dorm_id` | Must be selected |
| 6 (have_dorm) | `current_room_id` | Must be selected |
| 7 | `budget` | Must be > 0 |
| 7 | `room_type` | Must be selected |
| 7 | `city` | Must be selected |

All other steps have no blocking validation.

---

## 7. State Management & Persistence

### localStorage Key
`roomy_student_onboarding_{userId}`

### Saved Shape
```json
{
  "step": 4,
  "data": { /* WizardFormData */ },
  "timestamp": 1709568000000
}
```

### Save triggers
- Every `formData` change (after step 0)
- Every step change (after step 0)

### Clear triggers
- "Get Started" button (clears before starting fresh)
- Successful submit (clears on completion)

### Submit Actions
1. Fetch student record by `user_id`
2. Calculate `profile_completion_score` via `calculateProfileCompletion()`
3. Update `students` table with all form fields + `onboarding_completed: true`
4. If `have_dorm` with dorm+room selected: invoke `student-change-room` edge function to create room occupancy claim
5. Clear localStorage
6. Set `sessionStorage` flag: `roomy_onboarding_{userId} = 'completed'`
7. Toast "Profile setup complete!" and navigate to `/listings`
