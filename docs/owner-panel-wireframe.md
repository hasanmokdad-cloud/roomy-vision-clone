# Tenanters — Owner Control Panel Wireframe

> **Document version:** 1.0  
> **Last updated:** 2026-03-04  
> **Purpose:** Complete page-by-page wireframe for the Owner Portal at `/owner/*`  
> **Access:** Authenticated users with `role = 'owner'`

---

## Table of Contents

1. [Layout & Navigation Shell](#1-layout--navigation-shell)
2. [Page Wireframes](#2-page-wireframes)
   - [Dashboard](#21-dashboard-owner)
   - [Finance Hub](#22-finance-hub-ownerfinance)
   - [Tour Management (Schedule Hub)](#23-tour-management-ownerschedule)
   - [Room Management](#24-room-management-ownerrooms)
   - [Bulk Operations](#25-bulk-operations-ownerbulk-operations)
   - [Reviews](#26-reviews-ownerreviews)
   - [My Listings](#27-my-listings-ownerlistings)
   - [Statistics](#28-statistics-ownerstats)
   - [Account Settings](#29-account-settings-owneraccount)

---

## 1. Layout & Navigation Shell

### `OwnerLayout` Wrapper

All owner pages are wrapped in `<OwnerLayout>` which provides:

```
┌────────────────────────────────────────────────────────────────┐
│ [OwnerNavbar - fixed top, h=70px, z-50]                       │
│ ┌─────────┐                           [🔔] [Avatar] [Menu]    │
│ │Tenanters│  breadcrumb trail                                  │
│ └─────────┘                                                    │
├───────────┬────────────────────────────────────────────────────┤
│           │                                                    │
│ [Sidebar] │  Main Content Area                                 │
│  w=240px  │  (pt-[70px] padding for navbar)                    │
│  fixed    │                                                    │
│           │                                                    │
│ ┌───────┐ │                                                    │
│ │ 🏢    │ │                                                    │
│ │ Owner │ │                                                    │
│ │ Portal│ │                                                    │
│ ├───────┤ │                                                    │
│ │Manage-│ │                                                    │
│ │ment   │ │                                                    │
│ ├───────┤ │                                                    │
│ │📊 Dash│ │                                                    │
│ │💰 Fin │ │                                                    │
│ │📅 Tour│ │                                                    │
│ │🚪 Room│ │                                                    │
│ │⚙️ Bulk│ │                                                    │
│ │⭐ Rev │ │                                                    │
│ │🏠 List│ │                                                    │
│ │📈 Stat│ │                                                    │
│ └───────┘ │                                                    │
│           │                                                    │
└───────────┴────────────────────────────────────────────────────┘
```

### Sidebar Menu Items

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| LayoutDashboard | Dashboard | `/owner` | Overview + quick actions |
| DollarSign | Finance Hub | `/owner/finance` | Wallet, payouts, earnings |
| Calendar | Tour Management | `/owner/schedule` | Bookings + calendar |
| DoorOpen | Room Management | `/owner/rooms` | Room inventory + occupants |
| Settings | Bulk Operations | `/owner/bulk-operations` | Excel/batch room ops |
| Star | Reviews | `/owner/reviews` | Student reviews + responses |
| Building2 | My Listings | `/owner/listings` | Dorm listing CRUD |
| TrendingUp | Statistics | `/owner/stats` | Performance metrics |

### Responsive Behavior
- **Desktop (≥768px):** Sidebar open, content shifts `ml-[240px]`
- **Mobile (<768px):** Sidebar hidden (hamburger toggle), overlays with backdrop

---

## 2. Page Wireframes

---

### 2.1 Dashboard (`/owner`)

**File:** `OwnerHome.tsx` (514 lines)

```
┌─────────────────────────────────────────────────┐
│  "Welcome back, {owner_name}!"                  │
│  "Here's what's happening with your properties" │
│                                                 │
│  ┌─────── Quick Stats Row ────────────────────┐ │
│  │ 🏠 Properties  │ 👁️ Views  │ 💬 Messages   │ │
│  │ {count}        │ {count}   │ {unread}      │ │
│  └────────────────┴───────────┴───────────────┘ │
│                                                 │
│  ┌─── Payout Setup Banner ────────────────────┐ │
│  │ ⚠️ "Set up your payout method to receive   │ │
│  │    payments"  [Set Up Now]                  │ │
│  │ (only shown if no payout card configured)  │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Upcoming Tours Widget ──────────────────┐ │
│  │ 📅 "Upcoming Tours"        [View All →]    │ │
│  │ ┌────────────────────────────────────────┐  │ │
│  │ │ Student: Ali K. | Dorm: Sunset Dorm   │  │ │
│  │ │ Date: Mar 10 | Time: 2:00 PM          │  │ │
│  │ │ Status: ✅ Approved                    │  │ │
│  │ ├────────────────────────────────────────┤  │ │
│  │ │ Student: Sara M. | Dorm: Cedar Dorm   │  │ │
│  │ │ Date: Mar 12 | Time: 10:00 AM         │  │ │
│  │ │ Status: ✅ Approved                    │  │ │
│  │ └────────────────────────────────────────┘  │ │
│  │ + {pendingCount} pending requests           │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── My Properties ─────────────────────────┐ │
│  │ 🏠 "Your Properties"      [+ Add New]     │ │
│  │ ┌────────────────────────────────────────┐ │ │
│  │ │ [Cover Image] Sunset Dorm              │ │ │
│  │ │ Status: ✅ Verified                     │ │ │
│  │ │ Location: Blat, Byblos                 │ │ │
│  │ │ Rooms: 12 | Occupancy: 8/12           │ │ │
│  │ │ [👁️ Preview] [✏️ Edit] [🚪 Rooms]      │ │ │
│  │ ├────────────────────────────────────────┤ │ │
│  │ │ [Cover Image] Cedar Dorm               │ │ │
│  │ │ Status: ⏳ Pending Review               │ │ │
│  │ │ ...                                    │ │ │
│  │ └────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Quick Actions Row ─────────────────────┐ │
│  │ [➕ Add Dorm] [📅 Bookings] [💰 Wallet]    │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Key features:**
- Real-time subscription on `dorms`, `bookings`, `conversations`
- Inline `DormEditModal` for quick edits
- `PayoutSetupBanner` conditional display
- `NotificationBell` in navbar

---

### 2.2 Finance Hub (`/owner/finance`)

**File:** `OwnerFinanceHub.tsx` (430 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Breadcrumb: Dashboard > Finance Hub]        │
│                                                 │
│  ┌─── Earnings Summary Cards ─────────────────┐ │
│  │ ┌──────────────┐ ┌──────────────┐          │ │
│  │ │ 💰 Total     │ │ 📊 Pending   │          │ │
│  │ │ Earnings     │ │ Payouts      │          │ │
│  │ │ $X,XXX.XX    │ │ $XXX.XX      │          │ │
│  │ └──────────────┘ └──────────────┘          │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Payout Card Management ─────────────────┐ │
│  │ "Payout Method"               [+ Add Card] │ │
│  │ ┌────────────────────────────────────────┐  │ │
│  │ │ 💳 Visa •••• 4242                     │  │ │
│  │ │ Exp: 12/27 | Country: LB              │  │ │
│  │ │ Balance: $X,XXX.XX                    │  │ │
│  │ │ [👁️ View] [🗑️ Remove]                 │  │ │
│  │ └────────────────────────────────────────┘  │ │
│  │ (Whish Money payment integration)           │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Payout History Table ───────────────────┐ │
│  │ Student | Dorm | Room | Amount | Fee | Net │ │
│  │ ────────┼──────┼──────┼────────┼─────┼──── │ │
│  │ Ali K.  │ Sun  │ R101 │ $500   │ $50 │$450 │ │
│  │ Sara M. │ Ced  │ R205 │ $300   │ $30 │$270 │ │
│  │ ...                                        │ │
│  │ Status badges: Paid / Pending / Failed     │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Key features:**
- Whish Money tokenized card management
- Commission split display (deposit - Tenanters fee = owner receives)
- Mock card add flow (`MockWhishOwnerAddCard`)

---

### 2.3 Tour Management (`/owner/schedule`)

**File:** `OwnerScheduleHub.tsx` (157 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Breadcrumb: Dashboard > Tour Management]    │
│                                                 │
│  ┌─── Stats Cards ───────────────────────────┐  │
│  │ ⏳ Pending: {N}  │  📅 Upcoming: {N}      │  │
│  └──────────────────┴────────────────────────┘  │
│                                                 │
│  ┌─── Two-Panel Layout ──────────────────────┐  │
│  │                                            │  │
│  │  [📋 Bookings Tab] [📅 Calendar Tab]       │  │
│  │                                            │  │
│  │  BOOKINGS TAB:                             │  │
│  │  ┌─ Booking Card ────────────────────────┐ │  │
│  │  │ Student: Ali K.                       │ │  │
│  │  │ Dorm: Sunset Dorm                     │ │  │
│  │  │ 📅 Mar 10, 2026 | ⏰ 2:00 PM         │ │  │
│  │  │ Message: "I'd like to see..."         │ │  │
│  │  │ Status: ⏳ Pending                     │ │  │
│  │  │                                       │ │  │
│  │  │ [✅ Accept] [❌ Decline] [💬 Message]  │ │  │
│  │  └───────────────────────────────────────┘ │  │
│  │                                            │  │
│  │  ACCEPT MODAL (AcceptBookingModal):        │  │
│  │  - Meeting platform select (Zoom/Google/   │  │
│  │    Teams/In-Person/WhatsApp)               │  │
│  │  - Meeting link input                      │  │
│  │  - Owner notes textarea                    │  │
│  │  - Sends system message in chat            │  │
│  │                                            │  │
│  │  DECLINE FLOW:                             │  │
│  │  - Reason textarea (required)              │  │
│  │  - Sends decline notification              │  │
│  │                                            │  │
│  │  CALENDAR TAB:                             │  │
│  │  ┌───────────────────────────────────────┐ │  │
│  │  │ Month calendar view with booking dots │ │  │
│  │  │ Click date → shows day's bookings     │ │  │
│  │  │ Color-coded: pending / approved       │ │  │
│  │  └───────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Features:**
- Real-time booking subscription
- Accept modal with meeting platform integration
- "Add to Calendar" dropdown (Google Calendar / iCal)
- Tour system messages sent to chat conversation

---

### 2.4 Room Management (`/owner/rooms`)

**File:** `OwnerRooms.tsx` (472 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Breadcrumb: Dashboard > Room Management]    │
│                                                 │
│  ┌─── Pending Occupant Claims Banner ─────────┐ │
│  │ ⚠️ {N} students have claimed rooms          │ │
│  │ (PendingOccupantClaims component)            │ │
│  │ Each claim card: Student name, Room, Dorm    │ │
│  │ Actions: [✅ Approve] [❌ Reject]             │ │
│  └──────────────────────────────────────────────┘│
│                                                 │
│  ── Per-Dorm Accordion ──────────────────────── │
│                                                 │
│  ┌─── Sunset Dorm ──── [▼ Expand/Collapse] ──┐ │
│  │ Status: ✅ Verified | Area: Blat            │ │
│  │                                             │ │
│  │ ┌─ Room Card ────────────────────────────┐  │ │
│  │ │ Room 101 (Double)                      │  │ │
│  │ │ Price: $500/mo | Area: 25m²            │  │ │
│  │ │ Capacity: 1/2 occupied                 │  │ │
│  │ │ Status: ✅ Available                    │  │ │
│  │ │                                        │  │ │
│  │ │ Occupants:                             │  │ │
│  │ │ ┌────────────────────────────────────┐ │  │ │
│  │ │ │ 👤 Ali K. (Confirmed)              │ │  │ │
│  │ │ │ [RoomOccupantPreview component]    │ │  │ │
│  │ │ └────────────────────────────────────┘ │  │ │
│  │ │                                        │  │ │
│  │ │ [Toggle Available/Unavailable]         │  │ │
│  │ └────────────────────────────────────────┘  │ │
│  │                                             │ │
│  │ ┌─ Room Card ────────────────────────────┐  │ │
│  │ │ Room 102 (Single)                      │  │ │
│  │ │ ... (same structure)                   │  │ │
│  │ └────────────────────────────────────────┘  │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Cedar Dorm ──── [▶ Collapsed] ─────────┐ │
│  │ (Click to expand)                           │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Features:**
- Collapsible per-dorm accordion
- Room availability toggle (Switch)
- Occupant preview with confirmed student details
- Pending claims approval workflow

---

### 2.5 Bulk Operations (`/owner/bulk-operations`)

**File:** `BulkRoomOps.tsx` (1539 lines — largest owner page)

```
┌─────────────────────────────────────────────────┐
│  [← Breadcrumb: Dashboard > Bulk Operations]    │
│                                                 │
│  ┌─── Tabs ──────────────────────────────────┐  │
│  │ [📥 Import] [📊 Batch Edit] [📤 Export]    │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  IMPORT TAB:                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ Select Dorm: [Dropdown]                    │  │
│  │                                            │  │
│  │ [📥 Download Template] (.xlsx)             │  │
│  │                                            │  │
│  │ ┌─ Drag & Drop Zone ───────────────────┐  │  │
│  │ │ 📁 Drag Excel file here or [Browse]  │  │  │
│  │ └─────────────────────────────────────┘  │  │
│  │                                            │  │
│  │ Preview Table (after upload):              │  │
│  │ Name | Type | Price | Deposit | Capacity  │  │
│  │ ─────┼──────┼───────┼─────────┼──────────  │  │
│  │ R101 │ Dbl  │ $500  │ $200    │ 2         │  │
│  │ R102 │ Sgl  │ $400  │ $150    │ 1         │  │
│  │                                            │  │
│  │ [✅ Import Rooms] (with validation summary)│  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  BATCH EDIT TAB:                                │
│  ┌────────────────────────────────────────────┐  │
│  │ Select Dorm: [Dropdown]                    │  │
│  │                                            │  │
│  │ ☑ Select All | Select rooms to edit:       │  │
│  │ ☐ Room 101 (Double) - $500                │  │
│  │ ☐ Room 102 (Single) - $400                │  │
│  │ ☑ Room 103 (Triple) - $600                │  │
│  │                                            │  │
│  │ Batch Actions:                             │  │
│  │ ┌─── Update Pricing ────────────────────┐ │  │
│  │ │ New Price: [$___] | New Deposit: [$__] │ │  │
│  │ │ Tiered: 1-student price | 2-student   │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │ ┌─── Update Media ─────────────────────┐ │  │
│  │ │ [Upload Images] [Upload Video]        │ │  │
│  │ │ Apply to all selected rooms           │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │ ┌─── Toggle Availability ──────────────┐ │  │
│  │ │ [Mark Available] [Mark Unavailable]   │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │                                            │  │
│  │ [Apply Changes]                            │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  EXPORT TAB:                                    │
│  ┌────────────────────────────────────────────┐  │
│  │ Select Dorm: [Dropdown]                    │  │
│  │ [📤 Download as Excel]                     │  │
│  │ Exports all rooms with current data        │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Features:**
- Excel import/export via `xlsx` library
- Image compression via `browser-image-compression`
- Batch pricing with tiered pricing support (`price_1_student`, `price_2_students`)
- Per-room media upload with progress indicators

---

### 2.6 Reviews (`/owner/reviews`)

**File:** `ReviewManagement.tsx` (313 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Breadcrumb: Dashboard > Reviews]            │
│                                                 │
│  ┌─── Tabs ──────────────────────────────────┐  │
│  │ [All] [Pending Response] [Responded]       │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Review Card ───────────────────────────┐  │
│  │ ⭐⭐⭐⭐☆ (4/5)                             │  │
│  │ Student: Ali K. | Dorm: Sunset Dorm       │  │
│  │ Date: Feb 15, 2026                         │  │
│  │                                            │  │
│  │ "Great location and clean rooms. The       │  │
│  │  WiFi could be better though."             │  │
│  │                                            │  │
│  │ IF has response:                           │  │
│  │ ┌── Owner Response ─────────────────────┐ │  │
│  │ │ "Thank you for your feedback! We're   │ │  │
│  │ │  upgrading our internet this month."  │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │                                            │  │
│  │ IF no response:                            │  │
│  │ ┌──────────────────────────────────────┐  │  │
│  │ │ [Textarea: Write your response...]   │  │  │
│  │ │ [Submit Response]                    │  │  │
│  │ └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  (Real-time subscription on reviews +           │
│   review_responses tables)                      │
└─────────────────────────────────────────────────┘
```

---

### 2.7 My Listings (`/owner/listings`)

**File:** `OwnerListings.tsx` (183 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Breadcrumb: Dashboard > My Listings]        │
│                                                 │
│  [+ Add New Listing] (navigates to wizard)      │
│                                                 │
│  ┌─── Listings Table ────────────────────────┐  │
│  │ Name        │ Status     │ Rooms │ Actions│  │
│  │ ────────────┼────────────┼───────┼────────│  │
│  │ Sunset Dorm │ ✅ Verified │ 12    │ 👁✏️🗑 │  │
│  │ Cedar Dorm  │ ⏳ Pending  │ 8     │ 👁✏️🗑 │  │
│  │ ...                                       │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  Actions per row:                               │
│  - 👁️ Preview: opens AdminDormPreviewModal       │
│  - ✏️ Edit: opens DormEditModal inline           │
│  - 🚪 Rooms: navigates to /owner/dorms/{id}/rooms│
│  - 🗑 Delete: confirmation dialog + soft delete  │
│                                                 │
│  DormEditModal (inline overlay):                │
│  - All dorm fields editable                     │
│  - Gallery image management                     │
│  - Amenities checklist                          │
│  - Save triggers refetch                        │
└─────────────────────────────────────────────────┘
```

---

### 2.8 Statistics (`/owner/stats`)

**File:** `OwnerStats.tsx` (39 lines)

```
┌─────────────────────────────────────────────────┐
│  "Statistics"                                   │
│  "View your performance metrics"                │
│                                                 │
│  ┌────────────────────────────────────────────┐  │
│  │        📊                                  │  │
│  │  "Statistics Dashboard"                    │  │
│  │  "Detailed analytics and performance       │  │
│  │   metrics coming soon..."                  │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  (Placeholder — future implementation)          │
└─────────────────────────────────────────────────┘
```

**Planned features (not yet implemented):**
- Views per listing over time
- Booking conversion rate
- Average occupancy rate
- Revenue trends
- Student demographics breakdown

---

### 2.9 Account Settings (`/owner/account`)

**File:** `OwnerAccount.tsx` (275 lines)

```
┌─────────────────────────────────────────────────┐
│  "Account Settings"                             │
│                                                 │
│  ┌─── Profile Section ───────────────────────┐  │
│  │                                            │  │
│  │  [Profile Photo Upload]                    │  │
│  │  (ProfilePhotoUpload component)            │  │
│  │  - Click to upload / drag & drop          │  │
│  │  - Crop modal                             │  │
│  │  - Uploads to Supabase storage            │  │
│  │                                            │  │
│  │  Full Name                                │  │
│  │  [Text input: "John Doe"]                 │  │
│  │                                            │  │
│  │  Phone Number                             │  │
│  │  [Text input: "+961 XX XXX XXX"]          │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Notification Preferences ──────────────┐  │
│  │                                            │  │
│  │  📧 Email Notifications    [Toggle ON]     │  │
│  │  📱 WhatsApp Notifications [Toggle ON]     │  │
│  │                                            │  │
│  │  WhatsApp Language                        │  │
│  │  [Select: EN / AR]                        │  │
│  │                                            │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  [💾 Save Changes]                              │
│                                                 │
│  ┌─── Danger Zone ───────────────────────────┐  │
│  │ [🚪 Sign Out]                              │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Features:**
- Profile photo upload with storage integration
- Notification channel preferences (email + WhatsApp)
- WhatsApp language preference (EN/AR) for automated messages
