# /become-owner — Complete Wizard Wireframe

> **Version:** 2.0 — Updated to reflect Phase 3 rebuild  
> **Total Steps:** 30 (indexed 0–29)  
> **Property Types:** Dorm, Apartment, Hybrid  
> **Dorm flow ends at:** Step 27 | **Apartment flow ends at:** Step 29 | **Hybrid flow ends at:** Step 27

---

## PHASE 1: BASICS (Steps 0–6) — All Property Types

### Step 0 — Intro / Landing Page
- Airbnb-style intro page with heading: **"It's easy to get started on Tenanters"**
- Right side shows 3 numbered phases:
  1. "Tell us about your property" — Property type, name, gender preference, highlights & description
  2. "Make it stand out" — Location, essential services, amenities & photos
  3. "Finish up and publish" — Room details, pricing, occupancy & media
- Each phase has a small isometric illustration (bed, laptop, door)
- Bottom: **"Get started"** button (primary, dark)
- If saved progress exists: also shows **"Resume"** button (outline) that restores previous session
- No top bar or progress bar on this step

### Step 1 — Phase 1 Transition (Filler)
- Full-screen animated MP4 video transition
- No user input required
- Excluded from progress bar counting
- Auto-plays video, user clicks Next to proceed

### Step 2 — Property Type Selection
- Heading: **"What type of property are you listing?"**
- 3 selection cards (single-select, tap to select):
  - **Dorm Building** (Building2 icon) — "Stand-alone dorm with private rooms"
  - **Apartment Building** (Building icon) — "Building with multiple apartments"
  - **Hybrid** (Layers icon) — "Dorm building with rooms and apartments"
- This selection determines the ENTIRE flow branch for steps 15+
- Next button disabled until a type is selected

### Step 3 — Property Details
- Heading: **"Tell us about your property"**
- Two sections:
  1. **"What's the name of your property?"**
     - Single text input field
     - Placeholder: "e.g. Sunrise Dorm"
     - Required — Next button disabled if empty
  2. **"Does your property have multiple blocks or buildings?"**
     - 2 selection cards (single-select):
       - **"No, it's one building"** (emoji 🏠)
       - **"Yes, multiple blocks"** (emoji 🏘️)
     - If "Yes, multiple blocks" selected: shows numeric stepper for block count (min 2, max 20)
     - Next button disabled if title empty OR (hasMultipleBlocks=true AND blockCount < 2)

### Step 4 — Tenant Preference
- Heading: **"Who can stay in your [dorm/building]?"** (label adapts by property type)
- Two sections:
  1. **"Who is your property for?"**
     - Sub-heading: "Choose the type of tenants you accept"
     - 2 selection cards (single-select):
       - 🎓 **"Students only"** — "University/college students with valid student ID"
       - 👥 **"Open to everyone"** — "Students, professionals, and anyone looking for housing"
  2. **"Which gender can stay in your units?"**
     - Sub-heading: "You can specify gender restrictions or keep it open to everyone"
     - 3 selection cards (single-select):
       - 👨 **"Male only"**
       - 👩 **"Female only"**
       - 🤝 **"Mixed"** — "No gender restriction"
- Next button disabled until BOTH sections have a selection

### Step 5 — Highlights
- Heading: **"Let's describe your [dorm/building]"**
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

### Step 6 — Description & Rules
- Two sections on one page:
  1. **"Create your description"**
     - Large textarea field (max 500 chars, counter shown)
     - **Auto-populated** with generated text based on highlights selected in Step 5
       - Format: "Welcome to this wonderful [dorm/student housing]! [Concatenated highlight descriptions]."
       - Uses "student housing" for apartment type, "dorm" for dorm/hybrid
     - Owner can freely edit the text
     - Once manually edited, a flag (`descriptionManuallyEdited`) prevents future auto-overwrites
     - Tips box: "💡 Mention nearby universities, hospitals, landmarks, transportation, what's included, and any unique features..."
     - Optional field
  2. **"Building rules & regulations"**
     - Sub-heading: "Let tenants know what's expected. This will be shown on your listing page."
     - Large textarea (max 1000 chars, counter shown)
     - Placeholder: "e.g. No smoking inside the building. Quiet hours from 11PM to 7AM..."
     - Optional field
     - `rulesManuallyEdited` flag set on first edit

---

## PHASE 2: LOCATION & DETAILS (Steps 7–13) — All Property Types

### Step 7 — Phase 2 Transition (Filler)
- Full-screen animated MP4 video transition
- No user input required
- Excluded from progress bar counting

### Step 8 — Location
- Heading: **"Where is your [dorm/building] located?"**
- **3-tier Lebanon location taxonomy:**
  1. **Primary Location** — Dropdown: Beirut, Byblos, Keserwan (single-select)
  2. **Area** — Dropdown filtered by primary location (e.g., Beirut has 23 areas, Byblos has 7, Keserwan has 3)
  3. **Sub-area / Street** — Optional dropdown filtered by area
- **Address** — Auto-generated text field combining selections (e.g., "Hamra, Beirut"). Editable.
- **Shuttle toggle** — "Do you offer shuttle service?" Yes/No switch
- Changing primary location resets area, sub-area, shuttle, and nearby universities
- Next button disabled until Primary Location AND Area are both selected

### Step 9 — Nearby Universities (Optional)
- Heading: **"Select nearby universities"**
- Multi-select checklist of universities **filtered by the primary location** selected in Step 8:
  - Beirut: AUB, LAU Beirut, USJ, LU, Haigazian, AUL, etc.
  - Byblos: LAU Byblos, etc.
  - Keserwan: NDU, USEK, etc.
- Each university shown as a checkbox row with name
- Optional step — owner can skip without selecting any
- Selected universities stored in `nearbyUniversities` array

### Step 10 — Amenities: Essentials
- Heading: **"What essentials do you offer?"**
- Toggle grid of essential amenity cards:
  - **WiFi** — Opens WiFi detail modal (speed tier, provider, etc.)
  - **Electricity** — Opens Electricity detail modal (generator hours, backup, etc.)
  - **Water** — Opens Water detail modal (tank, schedule, etc.)
  - **Laundry** — Opens Laundry detail modal (in-unit, shared, coin-operated, etc.)
  - **Cleaning** — Opens Cleaning detail modal (frequency, common areas, etc.)
  - **Kitchen** (shown for dorm buildings only, replacing "Kitchenette")
- Each amenity can be toggled on/off
- When toggled ON, a detail modal appears for sub-options specific to that amenity
- Amenity details stored in `amenityDetails` object with structured sub-data

### Step 11 — Amenities: Shared Spaces
- Heading: **"What shared spaces are available?"**
- Toggle grid of shared space amenity cards:
  - Living Room, Study Room, Gym, Parking, Rooftop, Balcony, Garden, Swimming Pool, Common Room, TV Room, Game Room, etc.
- **Reception section** (for dorm buildings):
  - "Does your building have a reception?" toggle
  - If yes AND `hasMultipleBlocks = true`: "Does each block have its own reception?" toggle
- Simple toggle on/off (no detail modals for most)
- Each toggled amenity added to the `amenities` array

### Step 12 — Amenities: Safety
- Heading: **"What safety features does your property have?"**
- Toggle grid of safety feature cards:
  - CCTV, Fire Extinguisher, First Aid Kit, 24/7 Security Guard, Smoke Detector, Carbon Monoxide Detector, Emergency Exit, Security Alarm, Door Lock (key/code/smart), Fire Escape, etc.
- Simple toggle on/off
- Each toggled feature added to the `amenities` array

### Step 13 — Photos (Section-Based Upload)
- Heading: **"Add photos of your building"**
- **Section-based upload system** using `building_images` table:
  - **Building Exterior** section — Required (at least 1 photo). Next button disabled if no exterior photo.
  - Additional sections shown dynamically based on amenities selected in Steps 11-12:
    - Study Room, Gym, Pool, Kitchen, Laundry, Garden, Common Area
    - Reception (if `hasReception = true`)
    - If `receptionPerBlock = true`: separate "Reception — Block 1", "Reception — Block 2", etc.
    - Additional Photos (always available as catch-all)
  - Each section has its own upload dropzone with drag-to-reorder
  - Images stored in `buildingImages` array with `sectionType` and `sortOrder`
- Sections with 0 selected amenities are hidden (e.g., no "Gym" section if gym amenity not toggled)

### Step 14 — Phase 3 Transition (Filler)
- Full-screen animated MP4 video transition
- No user input required
- Excluded from progress bar counting
- After this step, the flow DIVERGES based on property type selected in Step 2

---

## PHASE 3: INVENTORY SETUP — DORM FLOW (Steps 15–27)
**Applies when:** `propertyType = "dorm"` or `propertyType = "hybrid"`

### Step 15 — Room Count (Capacity)
- **Single-block heading:** "How many rental units does your dorm have?"
- **Multi-block heading:** "How many rental units does Block [current_block_number] have?"
- Numeric input (1–2000)
- Creates N empty room objects in memory when proceeding to next step
- Next button disabled if value < 1 or > 2000
- **Hybrid flow:** Uses `HybridCapacityStep` instead — two separate numeric steppers for dorm room count and apartment unit count

### Step 16 — Room Unit Setup (NEW — replaces old Upload Method)
- **Single-block heading:** "Tell us about your rental units"
- **Multi-block heading:** "Tell us about Block [N]'s rental units"
- Three single-select card sections:
  1. **Kitchenette configuration:**
     - "None of them" — No units have kitchenettes (→ all Room base type)
     - "All of them" — Every unit has a kitchenette (→ all Studio base type)
     - "Mixed" — Some units have, some don't (→ owner picks per unit on room types page)
  2. **Balcony configuration:**
     - "None of them"
     - "All of them"
     - "Mixed"
  3. **Furnished status:**
     - "All furnished"
     - "All unfurnished"
     - "Mixed"
- Selections stored in `blockSettings[currentBlockNumber]` as `{ kitchenette_type, balcony_type, furnished_type }`
- Next button disabled until all 3 sections have a selection

### Step 17 — Room Names
- **Single-block heading:** "Name your rooms"
- **Multi-block heading:** "Name the rooms in Block [N]"
- Scrollable list of N text inputs (one per room created in Step 15)
- **Auto-sequenced** room numbers based on existing rooms (e.g., if 5 rooms exist and 3 more are added, they auto-name as "Room 6", "Room 7", "Room 8")
- Owner can edit names to custom values
- Next button disabled if any room name is empty
- **No Excel upload option** — manual entry only

### Step 18 — Room Types (Full Redesign)
- Heading: **"What type are your rental units?"**
- Sub-heading: "Assign a type to each unit"
- Each room card shows:
  1. **Capacity selector** — dropdown: Single (1), Double (2), Triple (3), Quadruple (4), Suite
  2. **Base type** — shown ONLY if kitchenette_type = "mixed" AND capacity is NOT "suite":
     - Room (no kitchenette) or Studio (has kitchenette)
  3. **Bed configuration** — shown ONLY for Triple/Quadruple capacity:
     - Table of bed rows: bed type (Single/Double) × quantity
     - Total must match capacity exactly (3 for Triple, 4 for Quadruple)
  4. **Suite configuration** — shown ONLY if capacity = "suite":
     - Number of bedrooms (stepper, min 1)
     - Each bedroom: name + capacity stepper
     - Has kitchenette toggle
     - Number of bathrooms (stepper, min 1)
- **Canonical room type** auto-derived from selections:
  - Format: `[Size Prefix] [Base Type] [Suffix Modifiers]`
  - Size prefix from capacity: Single/Double/Twin/Triple/Quadruple
  - Base type: Room (no kitchenette), Studio (has kitchenette), Suite
  - Suffixes: "with Balcony", "Unfurnished", etc.
- Next button disabled until every room has capacity assigned, base type (if mixed), bed config resolved, and suite config complete

### Step 19 — Room Bulk Selection (LOOP ENTRY POINT)
- Heading: **"Select [rooms] for pricing"** (dynamic terminology)
- Sub-heading: "Choose which [rooms] to configure"
- Checklist of ALL rooms showing:
  - Checkbox per room
  - Room name
  - Room type badge (canonical label)
  - ✅ Green checkmark badge if already configured (in `completedRoomIds`)
- Filter dropdown: "Filter by type" — lists distinct canonical room types
- Action buttons: "Select All" / "Deselect All"
- **LOOP LOGIC:**
  - If ALL rooms already have ✅ completion badges → Next skips directly to Step 26 (Floor Level)
  - Otherwise, Next button disabled if no rooms are selected
- Selected room IDs stored in `selectedRoomIds`

### Step 20 — Room Media (INSIDE LOOP — first step)
- Heading: **"Showcase your rental units"**
- Sub-heading: "Upload photos for your selected units — apply to all at once, then adjust individually if needed"
- For EACH room in the selected batch:
  - Space-based upload sections dynamically generated from room type:
    - **Room types:** Bedroom, Full Bathroom, Workspace/Study Desk, Balcony (if has_balcony)
    - **Studio types:** Bedroom, Kitchenette, Full Bathroom, Workspace/Study Desk, Balcony (if has_balcony)
    - **Suite types:** Bedroom 1, Bedroom 2..N, Living Room, Kitchenette (if suite_has_kitchenette), Full Bathroom 1..N, Workspace/Study Desk, Balcony (if has_balcony)
  - Each space section has multi-image upload
  - Images stored in `room_images` table with `space_type` field
- All media optional

### Step 21 — Room Pricing
- Heading: **"Set pricing for your rental units"**
- For EACH room in the selected batch, shows:
  - Room name + canonical type label
  - **Monthly Price** — Number input (USD)
  - **Deposit** — Number input (USD)
  - **Tiered Pricing Toggle** — Appears for rooms with capacity ≥ 2
    - If enabled: shows per-occupancy price inputs (1 student, 2 students, etc.)
- All pricing inputs optional (can be set to 0 or left empty)

### Step 22 — Tiered Pricing Detail (CONDITIONAL)
- **SHOWN ONLY IF:** Any selected room has `tiered_pricing_enabled = true`
- **SKIPPED IF:** No selected rooms have tiered pricing → jumps directly to Step 23
- Heading: **"Review tiered pricing"**
- Sub-heading: "Confirm pricing for each occupancy level across your tiered units"
- Detailed pricing table per room that has tiered pricing enabled:
  - Per-occupancy-level rows
  - Monthly price + deposit inputs per tier

### Step 23 — Room Area (m²)
- Heading: **"Rental unit dimensions"**
- Sub-heading: "Set the area in square meters for your selected units"
- For EACH room in the selected batch:
  - Room name + canonical type label
  - **Area (m²)** — Optional number input
- All fields optional
- After this step, **ALWAYS skips Step 24** (capacity setup) for dorm flow → goes to Step 25

### Step 24 — Room Capacity Setup (ALWAYS SKIPPED FOR DORM FLOW)
- This step exists in code but is **always skipped** for dorm/hybrid flows
- Capacity is auto-derived from room type on Step 18
- Only rendered for apartment flow

### Step 25 — Room Occupancy (LOOP EXIT POINT)
- Heading: **"Current occupancy"**
- Sub-heading: "How many students are already living in each unit?"
- For EACH room in the selected batch:
  - Room name + canonical type label
  - **Occupancy stepper** (0 to room's max capacity)
  - Explanation text: "Students who are already living here but aren't on Tenanters yet"
- **LOOP EXIT LOGIC (after clicking Next):**
  1. All selected rooms are marked as complete (added to `completedRoomIds`)
  2. Selection is cleared (`selectedRoomIds = []`)
  3. System checks: Are ALL rooms now in `completedRoomIds`?
     - **YES** → Check multi-block:
       - If `hasMultipleBlocks` AND `currentBlockNumber < blockCount` → increment block number, show block transition screen, go to Step 15 for next block
       - Otherwise → proceed to Step 26 (Floor Level)
     - **NO** → Loop back to Step 19 (Room Selection) to configure remaining rooms

### Step 26 — Room Floor Level (NEW — post-loop, pre-review)
- Heading: **"Which floor is each unit on?"**
- Sub-heading: "Help tenants find their way around your building"
- **Single-block buildings:**
  - Bulk apply bar: "Apply floor to all units:" with floor dropdown + "Apply" button
  - Scrollable list of all rooms, each with:
    - Room name + type badge
    - Floor dropdown: B2, B1, G (Ground floor), 1–20
- **Multi-block buildings:**
  - Grouped by block with collapsible sections
  - Each block section has its own bulk apply bar
  - Block headers show unit count badge
- Floor level is optional — Next button is **never disabled** on this step
- Floor values stored in `floor_level` field on each room

### Step 27 — Review & Submit (DORM FINAL STEP)
- Heading: **"Review your listing"**
- Sub-heading: "Almost there! Make sure everything looks good."
- **Isometric room animation** at top (IsometricRoomAnimation component)
- **Summary cards** (each with icon, title, value, completion status, and "Edit" link):
  1. **Location** (MapPin icon) — "[City] • [Area] • [Address]" | Edit → Step 8
  2. **Tenant Preference** (Users icon) — "[tenant type] - [gender]" | Edit → Step 4
  3. **Building Blocks** (Layers icon) — "[N] blocks configured" | Shown only if `hasMultipleBlocks = true` | Edit → Step 3
  4. **[Dorm] Photos** (Camera icon) — "[N] exterior photos, [M] gallery photos across [K] spaces" | Edit → Step 13
  5. **Description** (FileText icon) — Shows title text | Edit → Step 3
  6. **Rental Units Setup** (DoorOpen icon) — "[N] units • [M] types" | Edit → Step 16
  7. **Rental Units Pricing** (DollarSign icon) — "[X]/[Y] units priced" | Edit → Step 19
- Each card shows ✅ green if complete, ⚠️ amber if incomplete
- **"Preview Your Listing"** button (Eye icon) → Opens WizardDormPreviewModal (full mock listing as students would see it)
- **Owner Agreement checkbox:**
  - "I agree to the Owner Agreement" with link to /legal/owner-agreement
  - Must be checked to enable Submit
- **Submit button** in footer (replaces Next) — "Submit for verification"
  - Disabled until: title set AND area set AND agreement checked
- On submit: Creates owner profile → Creates dorm → Creates all rooms → Saves building images → Navigates to /owner dashboard

---

## PHASE 3: INVENTORY SETUP — APARTMENT FLOW (Steps 15–29)
**Applies when:** `propertyType = "apartment"`

### Step 15 — Apartment Count
- Heading: "How many apartments/units does your building have?"
- Numeric input (1–2000)
- Creates N empty apartment objects when proceeding
- **Navigation:** After this step, SKIPS Step 16 entirely → jumps directly to Step 17
- Next button disabled if value < 1

### ~~Step 16~~ — SKIPPED for Apartment Flow
- Upload method / unit setup step is skipped (apartments use manual-only configuration)

### Step 17 — Apartment Names
- Heading: "Name your apartments"
- Scrollable list of N text inputs (one per apartment)
- Pre-labeled as "A1", "A2", "A3", etc. in placeholder text
- Owner types custom names
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
- Same UI pattern as Dorm Room Selection:
  - Checklist with checkboxes per apartment
  - Apartment name + type badge
  - ✅ Green checkmark if already configured (in `completedApartmentIds`)
  - "Select All" / "Select Remaining" buttons
- **LOOP LOGIC:**
  - If ALL apartments already complete → Next skips to Step 28 (Media)
  - Otherwise, Next disabled if no apartments selected

### Step 20 — Reservation Modes (FLEX MODE)
- Heading: "How can students book these apartments?"
- For EACH apartment in the selected batch:
  - Apartment name + type badge
  - **3 toggles** (at least ONE must be enabled):
    1. **Full Apartment Reservation** — "Students can book the entire apartment"
    2. **Bedroom Reservation** — "Students can book individual bedrooms"
    3. **Bed Reservation** — "Students can book individual beds within bedrooms"
- Next button disabled if any selected apartment has ALL three toggles OFF

### Step 21 — Apartment Capacity Setup
- Heading: "Set apartment capacity"
- For EACH apartment in the selected batch:
  - Apartment name + type badge
  - **Max Capacity** — Numeric stepper
  - **Enabled Capacities** — Checkbox grid
  - **Enable Tiered Pricing** toggle
    - If ON: Shows pricing tier inputs per enabled capacity level

### Step 22 — Apartment Tiered Pricing (CONDITIONAL)
- **SHOWN ONLY IF:** Any selected apartment has `enableTieredPricing = true`
- **SKIPPED IF:** No selected apartments have tiered pricing → jumps to Step 23
- Detailed pricing table per apartment with tiered pricing

### Step 23 — Bedroom Count
- Heading: "How many bedrooms?"
- For EACH apartment in the selected batch:
  - **Bedroom Count** — Numeric stepper
- Next button disabled if any apartment has bedroom count < 1

### Step 24 — Bedroom Names
- Heading: "Name your bedrooms"
- Grouped by apartment:
  - List of text inputs per bedroom (pre-labeled "Bedroom 1", "Bedroom 2", etc.)

### Step 25 — Bedroom Configuration
- Heading: "Configure bedrooms"
- For EACH bedroom:
  - **Bed Type** — Dropdown (descriptive only)
  - **Base Capacity** / **Max Capacity** — Numeric steppers
  - **Allow Extra Beds** — Toggle
  - **Pricing Mode** — Per Bed / Per Bedroom / Both
  - **Bedroom Images** — Multi-image upload

### Step 26 — Bed Setup (CONDITIONAL)
- **SHOWN ONLY IF:** Any bedroom has pricing mode = "per_bed" or "both"
- **SKIPPED IF:** All bedrooms use "per_bedroom" pricing only
- Individual bed entries with label, type, capacity contribution, price, deposit, availability

### Step 27 — Bedroom Pricing (LOOP EXIT POINT)
- Pricing inputs per bedroom based on pricing mode
- **LOOP EXIT LOGIC:**
  1. Selected apartments marked complete
  2. All complete? → Step 28 (Media). Otherwise → back to Step 19

### Step 28 — Apartment Media
- Photos & videos per apartment
- All media optional

### Step 29 — Review & Submit (APARTMENT FINAL STEP)
- Same layout as Dorm Review (Step 27) but with apartment-adapted terminology
- Same Owner Agreement checkbox and submission flow

---

## PHASE 3: INVENTORY SETUP — HYBRID FLOW (Steps 15–27)
**Applies when:** `propertyType = "hybrid"`

### Step 15 — Hybrid Capacity
- Heading: "Set up your hybrid property"
- **TWO separate numeric steppers:**
  1. **"How many dorm rooms?"** — Stepper for dorm room count
  2. **"How many apartment units?"** — Stepper for apartment unit count
- Total capacity = sum of both values
- Creates room objects where apartment-typed rooms get `type = "Apartment"` pre-set
- Next button disabled if total < 1

### Steps 16–27 — Same as Dorm Flow
- After Step 15, hybrid follows the EXACT same dorm flow (Steps 16–27)
- Apartment-typed rooms appear in the room list alongside dorm rooms
- They do NOT branch into the full apartment sub-flow (no bedrooms, beds, reservation modes)

---

## PERSISTENT UI ELEMENTS (Present on Steps 1+)

### Top Bar (AirbnbWizardTopBar)
- Fixed at top of screen
- Left: **"Tenanters"** text logo (links to home)
- Right: **"Save & Exit"** button
  - Saves current step + all form data to localStorage
  - Shows confirmation dialog
  - On confirm: navigates to /listings
- Not shown on Step 0 (Intro)

### Progress Bar (3-segment)
- Three horizontal bar segments below top bar, one per phase
- **Phase 1 content steps:** 2, 3, 4, 5, 6 (maps to 0%–33%)
- **Phase 2 content steps:** 8, 9, 10, 11, 12, 13 (maps to 33%–66%)
- **Phase 3 content steps:** 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27 (maps to 66%–100%)
- Filler/transition steps (1, 7, 14) snap to phase boundaries
- Each segment fills independently with smooth transition animation

### Footer (WizardFooter)
- Fixed at bottom of screen
- Left: **"Back"** underlined text button — goes to previous step with smart skip logic
- Right: **"Next"** button (dark, rounded) — proceeds to next step
  - Changes to **"Submit for verification"** on the final step (27 for dorm/hybrid, 29 for apartment)
  - Shows loading spinner when submitting
  - Shows bouncing dots when video preloading
  - Disabled state when validation fails
- **"Clear all"** button (with RotateCcw icon) available on steps 2+
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

### Dorm Flow (Steps 15–27)
```
15 (Room Count)
  → 16 (Room Unit Setup — kitchenette/balcony/furnished)
    → 17 (Room Names — manual only, auto-sequenced)
      → 18 (Room Types — capacity + base type + bed config + suite config)
        → 19 (Bulk Selection) ← LOOP ENTRY
          → 20 (Room Media — space-based upload, inside loop)
            → 21 (Pricing)
              → 22 (Tiered Pricing) — ONLY IF any selected room has tiered pricing enabled
              → [skip 22] — IF no tiered pricing
                → 23 (Area m²)
                  → [ALWAYS SKIP 24] — capacity auto-derived from type
                    → 25 (Occupancy) → LOOP EXIT
                      → IF unconfigured rooms remain: → back to 19
                      → IF all rooms complete:
                        → IF multi-block AND more blocks remain:
                          → block transition screen → 15 (next block)
                        → ELSE: → 26 (Floor Level)
                          → 27 (Review & Submit) ✅
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

### Hybrid Flow (Steps 15–27)
```
15 (Hybrid Capacity — dorm rooms + apartment units)
  → 16–27: Same as Dorm Flow (apartment units treated as rooms with type="Apartment")
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
| `tenantSelection` | `string` | Step 4 |
| `hasMultipleBlocks` | `boolean` | Step 3 |
| `blockCount` | `number` | Step 3 (min 2 if multi-block) |
| `blockSettings` | `Record<string, { kitchenette_type, balcony_type, furnished_type }>` | Step 16 (per block) |
| `currentBlockNumber` | `number` | Multi-block loop tracking |
| `buildingImages` | `BuildingImage[]` | Step 13 (section-based) |
| `highlights` | `string[]` | Step 5 |
| `title` | `string` | Step 3 |
| `description` | `string` | Step 6 (auto-generated from highlights) |
| `descriptionManuallyEdited` | `boolean` | Prevents auto-overwrite |
| `rulesAndRegulations` | `string` | Step 6 |
| `rulesManuallyEdited` | `boolean` | Prevents auto-overwrite |
| `hasReception` | `boolean` | Step 11 |
| `receptionPerBlock` | `boolean` | Step 11 (if multi-block) |
| `rooms` | `WizardRoomData[]` | Steps 17–26 (dorm/hybrid) |
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
| `type` | `string` | Step 18 (canonical label) |
| `capacityType` | `string` | Step 18 (single/double/triple/quadruple/suite) |
| `baseType` | `string` | Step 18 (room/studio, for mixed kitchenette) |
| `bedType` | `string` | Descriptive only |
| `bed_configuration` | `jsonb` | Step 18 (triple/quadruple bed layout) |
| `suite_bedrooms` | `jsonb` | Step 18 (suite bedroom config) |
| `suite_has_kitchenette` | `boolean` | Step 18 (suite only) |
| `suite_bathroom_count` | `number` | Step 18 (suite only) |
| `is_furnished` | `boolean` | Derived from Step 16 block settings |
| `has_balcony` | `boolean` | Derived from Step 16 block settings |
| `block_number` | `number` | Multi-block tracking |
| `floor_level` | `string` | Step 26 (B2/B1/G/1-20) |
| `price` | `number \| null` | Step 21 |
| `deposit` | `number \| null` | Step 21 |
| `tiered_pricing_enabled` | `boolean` | Step 21 |
| `price_1_student` | `number \| null` | Step 21/22 (tiered) |
| `price_2_students` | `number \| null` | Step 21/22 (tiered) |
| `deposit_1_student` | `number \| null` | Step 21/22 (tiered) |
| `deposit_2_students` | `number \| null` | Step 21/22 (tiered) |
| `capacity` | `number \| null` | Auto-derived from type |
| `capacity_occupied` | `number` | Step 25 |
| `area_m2` | `number \| null` | Step 23 |
| `images` | `string[]` | Step 20 (via room_images table) |
| `video_url` | `string \| null` | Step 20 |

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

---

## DATABASE TABLES USED

### `dorms` table — Building-level data
Key columns set by wizard:
- `name`, `dorm_name`, `address`, `area`, `description`, `location`
- `capacity`, `amenities`, `shuttle`, `gender_preference`
- `cover_image`, `image_url`, `gallery_images`
- `nearby_universities`
- `verification_status` (set to "Pending" on submit)
- `property_type` (dorm/apartment/hybrid)
- `tenant_selection` (student_only/mixed)
- `has_multiple_blocks`, `block_count`, `block_settings`
- `has_reception`, `reception_per_block`
- `rules_and_regulations`

### `building_images` table — Section-based building photos
- `dorm_id`, `section_type`, `sort_order`, `url`
- Section types: exterior, study_room, gym, pool, kitchen, laundry, garden, common_area, reception, reception_block_1..N, additional

### `rooms` table — Individual rental units
- Created via `create-room` edge function
- Key columns: `dorm_id`, `name`, `type`, `bed_type`, `price`, `deposit`, `capacity`, `capacity_occupied`, `area_m2`, `images`, `video_url`, `available`
- New columns: `block_number`, `floor_level`, `is_furnished`, `has_balcony`, `suite_has_kitchenette`, `suite_bathroom_count`, `bed_configuration`, `suite_bedrooms`

### `room_images` table — Space-based unit photos
- `room_id`, `space_type`, `sort_order`, `url`
- Space types: bedroom, kitchenette, full_bathroom, workspace, balcony, living_room, bedroom_1..N, full_bathroom_1..N
