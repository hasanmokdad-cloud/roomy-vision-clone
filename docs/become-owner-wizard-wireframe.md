# /become-owner — Complete Wizard Wireframe

> **Total Steps:** 30 (indexed 0–29)
> **Property Types:** Dorm, Apartment, Hybrid
> **Dorm flow ends at:** Step 26 | **Apartment flow ends at:** Step 29 | **Hybrid flow ends at:** Step 26

---

## PHASE 1: BASICS (Steps 0–6) — All Property Types

### Step 0 — Intro / Landing Page
- Airbnb-style intro page with heading: **"It's easy to get started on Tenanters"**
- Right side shows 3 numbered phases:
  1. "Tell us about your property" — Property type, name, gender preference, highlights & description
  2. "Make it stand out" — Location, essential services, amenities & photos
  3. "Finish up and publish" — Room details, pricing, occupancy & media
- Each phase has a small isometric illustration (bed, laptop, door)
- Bottom: **"Get started"** button (primary, blue)
- If saved progress exists: also shows **"Resume"** button (outline) that restores previous session
- No top bar or progress bar on this step

### Step 1 — Phase 1 Transition (Filler)
- Full-screen animated MP4 video transition
- No user input required
- Excluded from progress bar counting
- Auto-plays video, user clicks Next to proceed

### Step 2 — Property Type Selection
- Heading: "What type of property are you listing?"
- 3 selection cards (single-select, tap to select):
  - **Dorm** — Traditional dormitory with shared rooms
  - **Apartment** — Apartment building with individual units
  - **Hybrid** — Mix of dorm rooms and apartment units
- This selection determines the ENTIRE flow branch for steps 15+
- Next button disabled until a type is selected

### Step 3 — Property Title
- Heading: "Give your property a name"
- Single text input field
- Placeholder text varies by property type (e.g., "Enter your dorm name" vs "Enter your building name")
- Next button disabled if empty

### Step 4 — Gender Preference
- Heading: "Who can stay at your [dorm/building]?"
- 3 selection cards (single-select):
  - **Male only**
  - **Female only**
  - **Mixed (Co-ed)**
- Label text adapts based on property type selected in Step 2
- Next button disabled until selected

### Step 5 — Highlights
- Heading: "What makes your place special?"
- Multi-select chip/tag grid with ~35+ descriptive options organized visually:
  - peaceful, unique, student-friendly, modern, central, spacious, cozy, affordable
  - quiet-study, social-atmosphere, near-campus, safe-secure, well-maintained, bright-airy
  - pet-friendly, fast-wifi, fully-furnished, recently-renovated, great-views
  - close-to-shops, public-transport, utilities-included, flexible-lease
  - communal-kitchen, laundry-onsite, rooftop-access, outdoor-space, parking-available
  - generator-backup, sea-view, mountain-view, city-view, balcony, private-bathroom
  - quiet-neighborhood, vibrant-area, study-room, gym-access
- Tapping a chip toggles it on/off (highlighted when selected)
- Selected highlights are used to auto-generate the description in the next step
- Optional step (can proceed with 0 highlights)

### Step 6 — Description
- Heading: "Describe your place"
- Large textarea field
- **Auto-populated** with generated text based on highlights selected in Step 5
  - Format: "Welcome to this wonderful [dorm/student housing]! [Concatenated highlight descriptions]."
  - Uses "student housing" for apartment type, "dorm" for dorm/hybrid
- Owner can freely edit the text
- Once manually edited, a flag (`descriptionManuallyEdited`) prevents future auto-overwrites
- Optional step (can proceed with empty description)

---

## PHASE 2: LOCATION & DETAILS (Steps 7–14) — All Property Types

### Step 7 — Phase 2 Transition (Filler)
- Full-screen animated MP4 video transition
- No user input required
- Excluded from progress bar counting

### Step 8 — Location
- Heading: "Where is your [dorm/building] located?"
- **3-tier Lebanon location taxonomy:**
  1. **Primary Location** — Dropdown: Beirut, Byblos, Keserwan (single-select)
  2. **Area** — Dropdown filtered by primary location (e.g., Beirut has 23 areas, Byblos has 7, Keserwan has 3)
  3. **Sub-area / Street** — Optional dropdown filtered by area (e.g., Kaslik, Bliss Street, Geitawi Street)
- **Address** — Auto-generated text field combining selections (e.g., "Hamra, Beirut"). Editable.
- **Shuttle toggle** — "Do you offer shuttle service?" Yes/No switch
- Changing primary location resets area, sub-area, shuttle, and nearby universities
- Next button disabled until Primary Location AND Area are both selected

### Step 9 — Nearby Universities (Optional)
- Heading: "Select nearby universities"
- Multi-select checklist of universities **filtered by the primary location** selected in Step 8:
  - Beirut: AUB, LAU Beirut, USJ, LU, Haigazian, AUL, etc.
  - Byblos: LAU Byblos, etc.
  - Keserwan: NDU, USEK, etc.
- Each university shown as a checkbox row with name
- Optional step — owner can skip without selecting any
- Selected universities stored in `nearbyUniversities` array

### Step 10 — Amenities: Essentials
- Heading: "What essentials do you offer?"
- Toggle grid of essential amenity cards:
  - **WiFi** — Opens WiFi detail modal (speed tier, provider, etc.)
  - **Electricity** — Opens Electricity detail modal (generator hours, backup, etc.)
  - **Water** — Opens Water detail modal (tank, schedule, etc.)
  - **Laundry** — Opens Laundry detail modal (in-unit, shared, coin-operated, etc.)
  - **Cleaning** — Opens Cleaning detail modal (frequency, common areas, etc.)
- Each amenity can be toggled on/off
- When toggled ON, a detail modal appears for sub-options specific to that amenity
- Amenity details stored in `amenityDetails` object with structured sub-data

### Step 11 — Amenities: Shared Spaces
- Heading: "What shared spaces are available?"
- Toggle grid of shared space amenity cards:
  - Kitchen, Living Room, Study Room, Gym, Parking, Rooftop, Balcony, Garden, Swimming Pool, Common Room, TV Room, Game Room, etc.
- Simple toggle on/off (no detail modals)
- Each toggled amenity added to the `amenities` array

### Step 12 — Amenities: Safety
- Heading: "What safety features does your property have?"
- Toggle grid of safety feature cards:
  - CCTV, Fire Extinguisher, First Aid Kit, 24/7 Security Guard, Smoke Detector, Carbon Monoxide Detector, Emergency Exit, Security Alarm, Door Lock (key/code/smart), Fire Escape, etc.
- Simple toggle on/off
- Each toggled feature added to the `amenities` array

### Step 13 — Photos
- Heading: "Add photos of your [dorm/building]"
- **Cover Image** (required):
  - Upload dropzone / tap-to-upload area
  - Integrated pre-upload image editor (crop, rotate, adjust)
  - Shows preview thumbnail after upload
  - Required — Next button disabled if no cover image
- **Gallery Images** (optional):
  - Multi-image upload grid
  - Drag-to-reorder functionality
  - Each image can be removed individually
  - Same pre-upload editor available per image
- Images uploaded to Supabase storage, URLs stored in `coverImage` and `galleryImages`

### Step 14 — Phase 3 Transition (Filler)
- Full-screen animated MP4 video transition
- No user input required
- Excluded from progress bar counting
- After this step, the flow DIVERGES based on property type selected in Step 2

---

## PHASE 3: INVENTORY SETUP — DORM FLOW (Steps 15–26)
**Applies when:** `propertyType = "dorm"`

### Step 15 — Room Count (Capacity)
- Heading: "How many rooms does your dorm have?"
- Numeric stepper input (1–2000)
- Creates N empty room objects in memory when proceeding to next step
- Next button disabled if value < 1 or > 2000

### Step 16 — Upload Method
- Heading: "How would you like to add your rooms?"
- 2 selection cards (single-select):
  - **Manual** — "Enter rooms one by one" (icon: keyboard/form)
  - **Excel Upload** — "Import from a spreadsheet" (icon: table/file)
- Next button disabled until method selected

### Step 17 — Room Names (or Excel Upload)
**If Upload Method = Manual:**
- Heading: "Name your rooms"
- Scrollable list of N text inputs (one per room created in Step 15)
- Pre-labeled as "Room 1", "Room 2", etc. in placeholder text
- Owner types custom names (e.g., "101", "Ground Floor A", etc.)
- Next button disabled if any room name is empty

**If Upload Method = Excel:**
- Heading: "Upload your room data"
- File upload dropzone accepting .xlsx/.csv files
- Preview table showing parsed rows after upload
- Auto-creates room objects from spreadsheet data
- Next button disabled until valid file is parsed and rooms are created

### Step 18 — Room Types
- Heading: "Set room types"
- List of all rooms with a dropdown per room
- Dropdown options (comprehensive owner list):
  - Single, Small Single, Large Single
  - Double, Small Double, Large Double
  - Triple
  - Quadruple
  - Suite, Junior Suite, Executive Suite, Presidential Suite
  - Studio, Apartment
- Next button disabled if any room has no type selected
- **Back navigation:** If upload method was "manual", Back goes to Step 17. If "excel", Back goes to Step 16 (skips Excel step).

### Step 19 — Room Bulk Selection (LOOP ENTRY POINT)
- Heading: "Select rooms to configure"
- Checklist of ALL rooms showing:
  - Checkbox per room
  - Room name
  - Room type badge
  - ✅ Green checkmark badge if already configured (in `completedRoomIds`)
- Action buttons: "Select All" / "Select Remaining" (unconfigured rooms only)
- Owner selects a batch of rooms to configure together in the next steps
- **LOOP LOGIC:**
  - If ALL rooms already have ✅ completion badges → Next skips directly to Step 25 (Media)
  - Otherwise, Next button disabled if no rooms are selected
- Selected room IDs stored in `selectedRoomIds`

### Step 20 — Room Pricing
- Heading: "Set pricing for selected rooms"
- For EACH room in the selected batch, shows:
  - Room name + type label
  - **Monthly Price** — Number input (USD)
  - **Deposit** — Number input (USD)
  - **Tiered Pricing Toggle** — Appears ONLY for Double/Triple room types
    - If enabled for Double rooms: shows "Price for 1 student" + "Price for 2 students" inputs (+ deposit per tier)
    - If enabled for Triple rooms: shows "Price for 1 student" + "Price for 2 students" + "Price for 3 students" inputs (+ deposit per tier)
- All pricing inputs optional (can be set to 0 or left empty)

### Step 21 — Tiered Pricing Detail (CONDITIONAL)
- **SHOWN ONLY IF:** Any selected room is a Double or Triple type with tiered pricing enabled
- **SKIPPED IF:** No selected rooms have tiered pricing → jumps directly to Step 22
- Heading: "Configure tiered pricing"
- Detailed pricing table per room that has tiered pricing enabled:
  - Per-occupancy-level rows (1 student, 2 students, 3 students depending on room type)
  - Monthly price input per tier
  - Deposit input per tier
- Rooms without tiered pricing are not shown on this step

### Step 22 — Room Area (m²)
- Heading: "Room dimensions"
- For EACH room in the selected batch:
  - Room name + type label
  - **Area (m²)** — Optional number input
- All fields optional

### Step 23 — Room Capacity Setup (CONDITIONAL)
- **SHOWN ONLY IF:** Any selected room type does NOT have auto-capacity
  - Auto-capacity types (SKIPPED): Single (→1), Double (→2), Triple (→3), Quadruple (→4)
  - Manual capacity types (SHOWN): Suite, Junior Suite, Executive Suite, Presidential Suite, Studio, Apartment, or any custom type
- **SKIPPED IF:** All selected rooms are Single/Double/Triple/Quadruple → jumps directly to Step 24
- Heading: "Set room capacity"
- For each non-auto-capacity room in the selected batch:
  - Room name + type label
  - **Max Capacity** — Numeric stepper (how many students can live in this room)

### Step 24 — Room Occupancy (LOOP EXIT POINT)
- Heading: "Current occupancy"
- For EACH room in the selected batch:
  - Room name + type label
  - **"How many students currently live here?"** — Numeric stepper (0 to room's max capacity)
  - This sets the pre-Tenanters legacy occupant count (`capacity_occupied`)
  - Explanation text: "This counts students who are already living here but aren't on Tenanters yet"
- **LOOP EXIT LOGIC (after clicking Next):**
  1. All selected rooms are marked as complete (added to `completedRoomIds`)
  2. Selection is cleared (`selectedRoomIds = []`)
  3. System checks: Are ALL rooms now in `completedRoomIds`?
     - **YES** → Proceed to Step 25 (Media)
     - **NO** → Loop back to Step 19 (Room Selection) to configure remaining rooms

### Step 25 — Room Media
- Heading: "Add photos & videos to your rooms"
- Shown ONLY after ALL rooms are configured (all in `completedRoomIds`)
- For EACH room (all rooms, not just a batch):
  - Room name + type label
  - **Photos** — Multi-image upload grid with drag-to-reorder
  - **Video** — Optional single video upload (max 100MB)
  - Pre-upload image editor available
- All media optional

### Step 26 — Review & Submit (DORM FINAL STEP)
- Heading: "Review your listing"
- Subheading: "Almost there! Make sure everything looks good."
- **Isometric room animation** at top
- **Summary cards** (each with icon, title, value, completion status, and "Edit" link):
  1. **Location** — "Byblos • Blat • Address" | Edit → Step 8
  2. **Capacity & Gender** — "12 rooms • Mixed (Co-ed)" | Edit → Step 15 (capacity step, mapped as editStep: 14 in code)
  3. **Photos** — "1 cover, 5 gallery" | Edit → Step 13 (mapped as editStep: 12)
  4. **Description** — Shows title text | Edit → Step 3
  5. **Rooms Setup** — "12 rooms • 3 types" | Edit → Step 18 (mapped as editStep: 16)
  6. **Rooms Pricing** — "10/12 rooms priced" | Edit → Step 20 (mapped as editStep: 19)
- Each card shows ✅ green if complete, ⚠️ amber if incomplete
- **Additional info section:**
  - "X amenities selected"
  - "Y of Z rooms have photos"
  - Room type badges
- **"Preview Your Listing"** button → Opens WizardDormPreviewModal (full mock listing as students would see it)
- **Owner Agreement checkbox:**
  - "I agree to the Owner Agreement" with link to /legal/owner-agreement
  - Must be checked to enable Submit
- **Status banner:**
  - If all complete + agreement checked: Green banner — "Ready to submit! Your dorm will be reviewed by our team."
  - If agreement not checked: Amber — "Please accept the Owner Agreement"
  - If sections incomplete: Amber — "Some sections need attention"
- **Submit button** in footer (replaces Next) — disabled until all sections complete AND agreement checked
- On submit: Creates owner profile → Creates dorm → Creates all rooms → Navigates to /owner dashboard

---

## PHASE 3: INVENTORY SETUP — APARTMENT FLOW (Steps 15–29)
**Applies when:** `propertyType = "apartment"`

### Step 15 — Apartment Count
- Heading: "How many apartments/units does your building have?"
- Numeric stepper input (1–2000)
- Creates N empty apartment objects when proceeding
- **Navigation:** After this step, SKIPS Step 16 entirely → jumps directly to Step 17
- Next button disabled if value < 1

### ~~Step 16~~ — SKIPPED for Apartment Flow
- Upload method step is skipped (apartments use manual-only configuration)

### Step 17 — Apartment Names
- Heading: "Name your apartments"
- Scrollable list of N text inputs (one per apartment)
- Pre-labeled as "A1", "A2", "A3", etc. in placeholder text
- Owner types custom names (e.g., "Unit 101", "Penthouse A", etc.)
- Next button disabled if any apartment name is empty

### Step 18 — Apartment Types
- Heading: "Set apartment types"
- List of all apartments with a dropdown per apartment
- Dropdown options:
  - Small Apartment
  - Medium Apartment
  - Large Apartment
  - Studio
  - Penthouse
- Next button disabled if any apartment has no type selected

### Step 19 — Apartment Selection (LOOP ENTRY POINT)
- Heading: "Select apartments to configure"
- Same UI pattern as Dorm Room Selection (Step 19 in dorm flow):
  - Checklist with checkboxes per apartment
  - Apartment name + type badge
  - ✅ Green checkmark if already configured (in `completedApartmentIds`)
  - "Select All" / "Select Remaining" buttons
- **LOOP LOGIC:**
  - If ALL apartments already complete → Next skips to Step 28 (Media)
  - Otherwise, Next disabled if no apartments selected
- Selected apartment IDs stored in `selectedApartmentIds`

### Step 20 — Reservation Modes (FLEX MODE)
- Heading: "How can students book these apartments?"
- For EACH apartment in the selected batch:
  - Apartment name + type badge
  - **3 toggles** (at least ONE must be enabled):
    1. **Full Apartment Reservation** — "Students can book the entire apartment"
    2. **Bedroom Reservation** — "Students can book individual bedrooms"
    3. **Bed Reservation** — "Students can book individual beds within bedrooms"
  - Each toggle is independent (can enable any combination)
- Next button disabled if any selected apartment has ALL three toggles OFF

### Step 21 — Apartment Capacity Setup
- Heading: "Set apartment capacity"
- For EACH apartment in the selected batch:
  - Apartment name + type badge
  - **Max Capacity** — Numeric stepper (total students the apartment can hold)
  - **Enabled Capacities** — Checkbox grid (which occupancy levels are offered to students)
    - e.g., for max capacity 4: checkboxes for [1] [2] [3] [4]
  - **Enable Tiered Pricing** toggle
    - If ON: Shows pricing tier inputs per enabled capacity level
    - Each tier: Capacity level + Monthly Price input + Deposit input
- Next button disabled if any apartment has max capacity < 1

### Step 22 — Apartment Tiered Pricing (CONDITIONAL)
- **SHOWN ONLY IF:** Any selected apartment has `enableTieredPricing = true`
- **SKIPPED IF:** No selected apartments have tiered pricing → jumps to Step 23
- Heading: "Configure tiered pricing"
- Detailed pricing table per apartment with tiered pricing:
  - Row per enabled capacity level
  - Monthly price + deposit inputs per tier
  - e.g., "1 person: $500/mo + $200 deposit" / "2 people: $350/mo + $150 deposit"

### Step 23 — Bedroom Count
- Heading: "How many bedrooms?"
- For EACH apartment in the selected batch:
  - Apartment name + type badge
  - **Bedroom Count** — Numeric stepper
  - Creates N bedroom objects per apartment when proceeding
- Next button disabled if any apartment has bedroom count < 1

### Step 24 — Bedroom Names
- Heading: "Name your bedrooms"
- Grouped by apartment:
  - **[Apartment Name]** header
  - List of text inputs per bedroom (pre-labeled "Bedroom 1", "Bedroom 2", etc.)
  - Owner types custom names
- Shows all apartments in the selected batch with their bedrooms

### Step 25 — Bedroom Configuration
- Heading: "Configure bedrooms"
- For EACH bedroom across all selected apartments:
  - Bedroom name + parent apartment label
  - **Bed Type** — Dropdown (descriptive only, does NOT affect capacity):
    - Single Bed, Double Bed, Master Bed, King Bed, Bunk Bed
  - **Base Capacity** — Numeric stepper (owner-defined, minimum occupancy)
  - **Max Capacity** — Numeric stepper (owner-defined, maximum occupancy)
  - **Allow Extra Beds** — Toggle (can additional beds be added?)
  - **Pricing Mode** — 3 options (single-select):
    - **Per Bed** — Price each bed individually (requires Bed Setup in Step 26)
    - **Per Bedroom** — Price the whole bedroom as one unit
    - **Both** — Offer both pricing options to students
  - **Bedroom Images** — Multi-image upload grid

### Step 26 — Bed Setup (CONDITIONAL)
- **SHOWN ONLY IF:** Any bedroom in the selected apartments has pricing mode = "per_bed" or "both"
- **SKIPPED IF:** All bedrooms use "per_bedroom" pricing only → jumps to Step 27
- Heading: "Set up individual beds"
- For EACH bedroom that uses per_bed or both pricing mode:
  - Bedroom name + apartment label
  - List of individual bed entries (auto-created based on bedroom capacity):
    - **Label** — Auto-generated: "Bed A", "Bed B", "Bed C", etc. (editable)
    - **Bed Type** — Dropdown: Single, Double, Master, King, Bunk (descriptive only)
    - **Capacity Contribution** — Numeric stepper (how many people this bed accommodates, default 1)
    - **Monthly Price** — Number input (USD)
    - **Deposit** — Number input (USD)
    - **Available** — Toggle (is this bed currently available?)

### Step 27 — Bedroom Pricing (LOOP EXIT POINT)
- Heading: "Set bedroom pricing"
- For EACH bedroom across all selected apartments:
  - Bedroom name + apartment label
  - **If pricing mode = "per_bedroom":**
    - Bedroom Monthly Price input
    - Bedroom Deposit input
  - **If pricing mode = "per_bed":**
    - Shows read-only summary of per-bed prices set in Step 26
    - No additional input needed
  - **If pricing mode = "both":**
    - Bedroom Monthly Price input + Deposit (for whole-bedroom booking)
    - Plus read-only summary of per-bed prices (for per-bed booking)
    - Both options will be presented to students
- **LOOP EXIT LOGIC (after clicking Next):**
  1. All selected apartments are marked as complete (added to `completedApartmentIds`)
  2. Selection is cleared (`selectedApartmentIds = []`)
  3. System checks: Are ALL apartments now in `completedApartmentIds`?
     - **YES** → Proceed to Step 28 (Media)
     - **NO** → Loop back to Step 19 (Apartment Selection) to configure remaining apartments

### Step 28 — Apartment Media
- Heading: "Add photos & videos to your apartments"
- Shown ONLY after ALL apartments are configured
- For EACH apartment (all apartments, not just a batch):
  - Apartment name + type label
  - **Photos** — Multi-image upload grid with drag-to-reorder
  - **Video** — Optional single video upload
  - Pre-upload image editor available
- All media optional

### Step 29 — Review & Submit (APARTMENT FINAL STEP)
- Same layout as Dorm Review (Step 26) but with apartment-adapted terminology
- Summary cards show apartment-specific metrics:
  - Apartment count instead of room count
  - Apartment types instead of room types
  - Apartment pricing summary
- Preview modal shows apartment-style listing
- Same Owner Agreement checkbox and submission flow
- On submit: Creates owner profile → Creates building → Creates all apartments → Creates bedrooms → Creates beds → Navigates to /owner

---

## PHASE 3: INVENTORY SETUP — HYBRID FLOW (Steps 15–26)
**Applies when:** `propertyType = "hybrid"`

### Step 15 — Hybrid Capacity
- Heading: "Set up your hybrid property"
- **TWO separate numeric steppers:**
  1. **"How many dorm rooms?"** — Stepper for dorm room count
  2. **"How many apartment units?"** — Stepper for apartment unit count
- Total capacity = sum of both values
- Creates room objects where:
  - First N rooms (dorm room count) are standard dorm rooms
  - Remaining rooms have `type = "Apartment"` pre-set
- Next button disabled if total < 1

### Steps 16–26 — Same as Dorm Flow
- After Step 15, hybrid follows the EXACT same dorm flow (Steps 16–26)
- Apartment-typed rooms appear in the room list alongside dorm rooms
- They use the same pricing/area/capacity/occupancy configuration as dorm rooms
- They do NOT branch into the full apartment sub-flow (no bedrooms, beds, reservation modes)
- In the Review step (26), terminology adapts for hybrid properties

> **Important Note:** In the current implementation, Hybrid mode treats apartment units as simple "rooms" with type="Apartment". It does NOT use the full Apartment flow's bedroom/bed hierarchy. This is a simplified approach for the initial release.

---

## PERSISTENT UI ELEMENTS (Present on Steps 1+)

### Top Bar (AirbnbWizardTopBar)
- Fixed at top of screen
- Left: **"Tenanters"** text logo (links to home)
- Right: **"Save & Exit"** button
  - Saves current step + all form data to localStorage
  - Shows confirmation dialog: "Your progress will be saved. You can continue where you left off anytime."
  - On confirm: navigates back to previous page
- Not shown on Step 0 (Intro)

### Progress Bar
- Thin horizontal bar below top bar
- Shows progress percentage across total steps
- Filler/transition steps (1, 7, 14) are excluded from the count
- Visually indicates how far the owner has progressed

### Footer (WizardFooter)
- Fixed at bottom of screen
- Left: **"Back"** button (← arrow) — goes to previous step with smart skip logic
- Right: **"Next"** button — proceeds to next step with smart skip logic
  - Changes to **"Submit"** on the final step (26 for dorm/hybrid, 29 for apartment)
  - Shows loading spinner when submitting
  - Disabled state when validation fails (grayed out)
- **"Clear All"** option available on steps 2+ — opens destructive confirmation dialog
- Not shown on Step 0 (Intro — has its own buttons)

### Save & Exit Confirmation Dialog
- Title: "Save & exit?"
- Description: "Your progress will be saved. You can continue where you left off anytime."
- Buttons: "Save & exit" (confirm) | "Cancel"

### Clear All Confirmation Dialog
- Title: "Clear all data?"
- Description: "This will reset all entered information and start fresh. This action cannot be undone."
- Buttons: "Clear all" (destructive red) | "Cancel"
- Resets to Step 0 with empty form data

---

## CONDITIONAL NAVIGATION FLOW CHARTS

### Dorm Flow (Steps 15–26)
```
15 (Room Count)
  → 16 (Upload Method)
    → 17a (Room Names — if manual)
    → 17b (Excel Upload — if excel)
      → 18 (Room Types)
        → 19 (Bulk Selection) ← LOOP ENTRY
          → 20 (Pricing)
            → 21 (Tiered Pricing) — ONLY IF any selected room is Double/Triple
            → [skip 21] — IF no Double/Triple rooms
              → 22 (Area)
                → 23 (Capacity) — ONLY IF non-auto-capacity room types (Suite, Studio, etc.)
                → [skip 23] — IF all rooms are Single/Double/Triple/Quadruple
                  → 24 (Occupancy) → LOOP EXIT
                    → IF unconfigured rooms remain: → back to 19
                    → IF all rooms complete: → 25 (Media)
                      → 26 (Review & Submit) ✅
```

### Apartment Flow (Steps 15–29)
```
15 (Apartment Count)
  → [SKIP 16] → 17 (Apartment Names)
    → 18 (Apartment Types)
      → 19 (Apartment Selection) ← LOOP ENTRY
        → 20 (Reservation Modes)
          → 21 (Capacity Setup)
            → 22 (Tiered Pricing) — ONLY IF any selected apt has tiered pricing enabled
            → [skip 22] — IF no tiered pricing
              → 23 (Bedroom Count)
                → 24 (Bedroom Names)
                  → 25 (Bedroom Config)
                    → 26 (Bed Setup) — ONLY IF any bedroom uses per_bed or both pricing
                    → [skip 26] — IF all bedrooms use per_bedroom pricing only
                      → 27 (Bedroom Pricing) → LOOP EXIT
                        → IF unconfigured apartments remain: → back to 19
                        → IF all apartments complete: → 28 (Media)
                          → 29 (Review & Submit) ✅
```

### Hybrid Flow (Steps 15–26)
```
15 (Hybrid Capacity — dorm rooms + apartment units)
  → 16–26: Same as Dorm Flow (apartment units treated as rooms with type="Apartment")
```

---

## DATA MODEL SUMMARY

### Form State (`WizardFormData`)
| Field | Type | Used By |
|-------|------|---------|
| `propertyType` | `'dorm' \| 'apartment' \| 'hybrid'` | Step 2, determines flow |
| `city` | `string` | Step 8 |
| `area` | `string` | Step 8 |
| `subArea` | `string` | Step 8 |
| `address` | `string` | Step 8 (auto-generated) |
| `shuttle` | `boolean` | Step 8 |
| `nearbyUniversities` | `string[]` | Step 9 |
| `capacity` | `number` | Step 15 |
| `dormRoomCount` | `number` | Step 15 (hybrid only) |
| `apartmentCount` | `number` | Step 15 (hybrid only) |
| `amenities` | `string[]` | Steps 10–12 |
| `amenityDetails` | `AmenityDetails` | Step 10 (detail modals) |
| `genderPreference` | `string` | Step 4 |
| `coverImage` | `string` | Step 13 |
| `galleryImages` | `string[]` | Step 13 |
| `highlights` | `string[]` | Step 5 |
| `title` | `string` | Step 3 |
| `description` | `string` | Step 6 |
| `uploadMethod` | `'manual' \| 'excel' \| ''` | Step 16 (dorm only) |
| `rooms` | `WizardRoomData[]` | Steps 17–25 (dorm/hybrid) |
| `selectedRoomIds` | `string[]` | Step 19 batch selection |
| `completedRoomIds` | `string[]` | Tracks configured rooms |
| `apartments` | `WizardApartmentData[]` | Steps 17–28 (apartment) |
| `selectedApartmentIds` | `string[]` | Step 19 batch selection |
| `completedApartmentIds` | `string[]` | Tracks configured apartments |

### Room Data (`WizardRoomData`) — Dorm/Hybrid
| Field | Type | Set At |
|-------|------|--------|
| `id` | `string` | Auto-generated |
| `name` | `string` | Step 17 |
| `type` | `string` | Step 18 |
| `bedType` | `string` | Descriptive only |
| `price` | `number \| null` | Step 20 |
| `deposit` | `number \| null` | Step 20 |
| `price_1_student` | `number \| null` | Step 20/21 (tiered) |
| `price_2_students` | `number \| null` | Step 20/21 (tiered) |
| `capacity` | `number \| null` | Step 23 or auto |
| `capacity_occupied` | `number` | Step 24 |
| `area_m2` | `number \| null` | Step 22 |
| `images` | `string[]` | Step 25 |
| `video_url` | `string \| null` | Step 25 |

### Apartment Data (`WizardApartmentData`) — Apartment Flow
| Field | Type | Set At |
|-------|------|--------|
| `id` | `string` | Auto-generated |
| `name` | `string` | Step 17 |
| `type` | `string` | Step 18 |
| `maxCapacity` | `number` | Step 21 |
| `enabledCapacities` | `number[]` | Step 21 |
| `enableTieredPricing` | `boolean` | Step 21 |
| `pricingTiers` | `ApartmentPricingTier[]` | Steps 21/22 |
| `enableFullApartmentReservation` | `boolean` | Step 20 |
| `enableBedroomReservation` | `boolean` | Step 20 |
| `enableBedReservation` | `boolean` | Step 20 |
| `bedroomCount` | `number` | Step 23 |
| `bedrooms` | `WizardBedroomData[]` | Steps 24–27 |
| `images` | `string[]` | Step 28 |
| `videoUrl` | `string \| null` | Step 28 |

### Bedroom Data (`WizardBedroomData`) — Apartment Flow
| Field | Type | Set At |
|-------|------|--------|
| `id` | `string` | Auto-generated |
| `name` | `string` | Step 24 |
| `bedType` | `string` | Step 25 (descriptive) |
| `baseCapacity` | `number` | Step 25 |
| `maxCapacity` | `number` | Step 25 |
| `allowExtraBeds` | `boolean` | Step 25 |
| `pricingMode` | `'per_bed' \| 'per_bedroom' \| 'both'` | Step 25 |
| `bedroomPrice` | `number` | Step 27 |
| `bedroomDeposit` | `number` | Step 27 |
| `beds` | `WizardBedData[]` | Step 26 |
| `images` | `string[]` | Step 25 |

### Bed Data (`WizardBedData`) — Apartment Flow
| Field | Type | Set At |
|-------|------|--------|
| `id` | `string` | Auto-generated |
| `label` | `string` | Step 26 (auto: Bed A, B…) |
| `bedType` | `string` | Step 26 (descriptive) |
| `capacityContribution` | `number` | Step 26 |
| `monthlyPrice` | `number` | Step 26 |
| `deposit` | `number` | Step 26 |
| `available` | `boolean` | Step 26 |
