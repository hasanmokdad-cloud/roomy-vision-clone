# Tenanters — Admin Control Panel Wireframe

> **Document version:** 1.0  
> **Last updated:** 2026-03-04  
> **Purpose:** Complete page-by-page wireframe for the Admin Portal at `/admin/*`  
> **Access:** Authenticated users with `role = 'admin'`  
> **Production domain:** `admin.tenanters.com`

---

## Table of Contents

1. [Layout & Navigation Shell](#1-layout--navigation-shell)
2. [Page Wireframes](#2-page-wireframes)
   - [Dashboard](#21-dashboard-admin)
   - [Finance Hub](#22-finance-hub-adminfinance)
   - [Review Forms (Pending Review)](#23-review-forms-adminpending-review)
   - [Messages Hub](#24-messages-hub-adminmessages-hub)
   - [Manage Students](#25-manage-students-adminstudents)
   - [Manage Owners](#26-manage-owners-adminowners)
   - [Manage Properties](#27-manage-properties-admindorms)
   - [Analytics](#28-analytics-adminanalytics)
   - [Personality Insights](#29-personality-insights-adminpersonality-insights)
   - [AI Diagnostics](#210-ai-diagnostics-adminai-diagnostics)
   - [System & Logs](#211-system--logs-adminsystem)

---

## 1. Layout & Navigation Shell

### `AdminLayout` Wrapper

All admin pages are wrapped in `<AdminLayout>` which provides:

```
┌────────────────────────────────────────────────────────────────┐
│ [AdminNavbar - fixed top, h=70px, z-50]                        │
│ ┌──────────┐                       [🔔 NotifBell] [☰ Toggle]  │
│ │Tenanters │                                                   │
│ └──────────┘                                                   │
├────────────┬───────────────────────────────────────────────────┤
│            │                                                   │
│ [Sidebar]  │  Main Content Area                                │
│  w=240px   │  (pt-[70px] for navbar clearance)                 │
│  fixed     │                                                   │
│            │                                                   │
│ ┌────────┐ │                                                   │
│ │ 🔴     │ │                                                   │
│ │ Admin  │ │                                                   │
│ │ Portal │ │                                                   │
│ ├────────┤ │                                                   │
│ │MANAGE- │ │                                                   │
│ │MENT    │ │                                                   │
│ ├────────┤ │                                                   │
│ │📊 Dash │ │                                                   │
│ │💰 Fin  │ │                                                   │
│ │📝 Rev  │ │                                                   │
│ │💬 Msg  │ │                                                   │
│ │👥 Stud │ │                                                   │
│ │🏢 Own  │ │                                                   │
│ │🔑 Prop │ │                                                   │
│ │📈 Anal │ │                                                   │
│ │🧠 Pers │ │                                                   │
│ │🤖 AI   │ │                                                   │
│ │⚙️ Sys  │ │                                                   │
│ └────────┘ │                                                   │
│            │                                                   │
└────────────┴───────────────────────────────────────────────────┘
```

### Sidebar Menu Items

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| LayoutDashboard | Dashboard | `/admin` (exact) | Overview + pending queue |
| DollarSign | Finance Hub | `/admin/finance` | Wallet, commissions, earnings |
| FileText | Review Forms | `/admin/pending-review` | Dorm verification queue |
| MessageSquare | Messages Hub | `/admin/messages-hub` | All user conversations |
| Users | Manage Students | `/admin/students` | Student CRUD + profiles |
| Building2 | Manage Owners | `/admin/owners` | Owner CRUD + profiles |
| Key | Manage Properties | `/admin/dorms` | All dorms + rooms |
| BarChart3 | Analytics | `/admin/analytics` | Charts + metrics |
| Brain | Personality Insights | `/admin/personality-insights` | Survey completion data |
| Activity | AI Diagnostics | `/admin/ai-diagnostics` | AI model performance |
| Activity | System & Logs | `/admin/system` | Audit logs, RLS, monitoring |

### Responsive Behavior
- **Desktop (≥768px):** Sidebar open by default, content shifts `ml-[240px]`
- **Mobile (<768px):** Sidebar hidden, hamburger toggle, overlay with backdrop at `z-30`
- Mobile backdrop starts at `top: 70px` to clear the navbar

### Admin Notification Bell (`AdminNotificationBell`)
- Real-time subscription on `admin_notifications` table
- Badge count for unread
- Dropdown panel with notification list
- Mark as read on click

---

## 2. Page Wireframes

---

### 2.1 Dashboard (`/admin`)

**File:** `AdminDashboard.tsx` (419 lines)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ┌─── Overview Stats Cards (animated) ───────┐ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │
│  │ │ 👥       │ │ 🏢       │ │ 🏠       │    │ │
│  │ │ Students │ │ Owners   │ │ Verified │    │ │
│  │ │ {count}  │ │ {count}  │ │ Dorms    │    │ │
│  │ │          │ │          │ │ {count}  │    │ │
│  │ └──────────┘ └──────────┘ └──────────┘    │ │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │
│  │ │ ⏳       │ │ 💰       │ │ 💬       │    │ │
│  │ │ Pending  │ │ Total    │ │ Messages │    │ │
│  │ │ Dorms    │ │ Commiss. │ │ {count}  │    │ │
│  │ │ {count}  │ │ ${amt}   │ │          │    │ │
│  │ └──────────┘ └──────────┘ └──────────┘    │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Pending Approvals Queue ───────────────┐ │
│  │ (PendingApprovalsQueue component)          │ │
│  │                                            │ │
│  │ ┌── Dorm Card ──────────────────────────┐ │ │
│  │ │ 🏠 "Sunset Student Living"            │ │ │
│  │ │ Owner: John D. | Location: Blat       │ │ │
│  │ │ Submitted: 2 days ago                 │ │ │
│  │ │ Rooms: 12 | Price range: $300-$600    │ │ │
│  │ │                                       │ │ │
│  │ │ [👁️ Preview] [✅ Approve] [❌ Reject]  │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │                                            │ │
│  │ Empty state: "No pending submissions 🎉"  │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Quick Action Cards ────────────────────┐ │
│  │ [→ Manage Students]  [→ Manage Owners]    │ │
│  │ [→ View Analytics]   [→ System Logs]      │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  Real-time subscriptions:                       │
│  - students table (count updates)               │
│  - owners table (count updates)                 │
│  - dorms table (pending queue refresh)          │
└─────────────────────────────────────────────────┘
```

**Key features:**
- Real-time stat counters via Supabase subscriptions
- Inline dorm approval/rejection without page navigation
- Earnings stats from `admin_income_history` + `admin_wallet`

---

### 2.2 Finance Hub (`/admin/finance`)

**File:** `AdminFinanceHub.tsx` (443 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]                          │
│  [Breadcrumb: Dashboard > Finance Hub]          │
│                                                 │
│  ┌─── Earnings Overview Cards ───────────────┐ │
│  │ ┌──────────────┐ ┌──────────────┐         │ │
│  │ │ 💰 Total     │ │ ✅ Payouts   │         │ │
│  │ │ Commission   │ │ Completed    │         │ │
│  │ │ ${amount}    │ │ ${amount}    │         │ │
│  │ └──────────────┘ └──────────────┘         │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Admin Wallet Card ─────────────────────┐ │
│  │ "Admin Wallet"                 [+ Add Card]│ │
│  │                                            │ │
│  │ IF card exists:                            │ │
│  │ ┌────────────────────────────────────────┐ │ │
│  │ │ 💳 {brand} •••• {last4}               │ │ │
│  │ │ Exp: {MM}/{YY} | Country: {code}      │ │ │
│  │ │ Balance: ${balance}                    │ │ │
│  │ │ [🗑 Remove Card]                       │ │ │
│  │ └────────────────────────────────────────┘ │ │
│  │                                            │ │
│  │ IF no card:                                │ │
│  │ "No payout card configured"               │ │
│  │ [+ Add Card] → MockWhishAdminAddCard      │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Commission History Table ──────────────┐ │
│  │ "Recent Commissions"          [🔄 Refresh] │ │
│  │                                            │ │
│  │ Reservation │ Student │ Owner │ Amt  │ Stat│ │
│  │ ────────────┼─────────┼───────┼──────┼─────│ │
│  │ #abc123     │ Ali K.  │ J.D.  │ $50  │ Paid│ │
│  │ #def456     │ Sara M. │ J.D.  │ $30  │ Pend│ │
│  │ ...                                       │ │
│  │                                            │ │
│  │ Status badges:                            │ │
│  │ - ✅ paid (green)                         │ │
│  │ - ⏳ pending (yellow)                     │ │
│  │ - ❌ failed (red)                         │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  ┌─── Reservation Details (expandable) ──────┐ │
│  │ Click any row → opens detail view with:   │ │
│  │ - Full payment breakdown                  │ │
│  │ - Student info + Owner info              │ │
│  │ - Room + Dorm details                    │ │
│  │ - Transaction timeline                   │ │
│  └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

---

### 2.3 Review Forms (`/admin/pending-review`)

**File:** `AdminPendingReview.tsx` (333 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]                          │
│  "Pending Property Reviews"                     │
│                                                 │
│  ┌─── Pending Dorm Cards ────────────────────┐ │
│  │                                            │ │
│  │ ┌── Dorm Submission Card ───────────────┐ │ │
│  │ │ 🏠 "Cedar Student Housing"            │ │ │
│  │ │ Owner: Jane D. | Email: jane@...      │ │ │
│  │ │ Location: Hamra, Beirut               │ │ │
│  │ │ Property Type: Dorm                   │ │ │
│  │ │ Rooms: 8                              │ │ │
│  │ │ Submitted: Mar 1, 2026                │ │ │
│  │ │                                       │ │ │
│  │ │ Room Details (collapsed list):        │ │ │
│  │ │  - R101: Double, $500, 25m²           │ │ │
│  │ │  - R102: Single, $400, 18m²           │ │ │
│  │ │  - ... (fetched with dorm query)      │ │ │
│  │ │                                       │ │ │
│  │ │ [👁️ Full Preview]                      │ │ │
│  │ │                                       │ │ │
│  │ │ ┌────────────────────────────────┐    │ │ │
│  │ │ │ [✅ Approve]  [❌ Reject]       │    │ │ │
│  │ │ └────────────────────────────────┘    │ │ │
│  │ └──────────────────────────────────────┘ │ │
│  │                                            │ │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  PREVIEW MODAL (AdminDormPreviewModal):         │
│  - Full dorm details rendered as listing page   │
│  - Gallery images carousel                      │
│  - Amenities list                               │
│  - Room cards with pricing + photos             │
│  - Map placeholder                              │
│                                                 │
│  REJECT DIALOG:                                 │
│  ┌────────────────────────────────────────────┐  │
│  │ "Reject Property Submission"               │  │
│  │                                            │  │
│  │ Reason for rejection: *                    │  │
│  │ [Textarea: "Please provide details..."]    │  │
│  │                                            │  │
│  │ [Cancel]  [Confirm Rejection]              │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  On Approve: Sets verification_status='Verified'│
│  On Reject: Sets verification_status='Rejected' │
│             + saves rejection_reason             │
│  Both: Set reviewed_at + reviewed_by timestamps  │
└─────────────────────────────────────────────────┘
```

---

### 2.4 Messages Hub (`/admin/messages-hub`)

**File:** `AdminMessagesHub.tsx` (780 lines — largest admin page)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]                          │
│  "Messages Hub"                                 │
│                                                 │
│  ┌─── Tabs ──────────────────────────────────┐  │
│  │ [All Chats] [Analytics]                    │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ALL CHATS TAB:                                 │
│  ┌─── Filter Bar ────────────────────────────┐  │
│  │ 🔍 [Search users...]                      │  │
│  │ Type: [All ▼] [Student-Student ▼]         │  │
│  │       [Student-Owner ▼]                   │  │
│  │ Time: [All ▼] [Today] [7 days] [30 days]  │  │
│  │ Sort: [Newest ▼] [Oldest] [Most Messages] │  │
│  │ [✕ Clear Filters]                         │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Conversation List ─────────────────────┐  │
│  │ ┌── Conversation Card ──────────────────┐ │  │
│  │ │ [Avatar A] Ali K. ↔ [Avatar B] Sara M.│ │  │
│  │ │ Type: Student-Student                 │ │  │
│  │ │ Last msg: "Hey, are you still..."     │ │  │
│  │ │ Time: 2 hours ago                     │ │  │
│  │ │ Messages: 45 | Unread: 3              │ │  │
│  │ │ [View Chat →]                         │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  │ ┌── Conversation Card ──────────────────┐ │  │
│  │ │ [Avatar] Ali K. ↔ [Avatar] Owner J.D. │ │  │
│  │ │ Type: Student-Owner                   │ │  │
│  │ │ Dorm: Sunset Dorm                     │ │  │
│  │ │ Last msg: "When can I visit?"         │ │  │
│  │ │ ...                                   │ │  │
│  │ └──────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ANALYTICS TAB:                                 │
│  ┌─── Chat Statistics Cards ─────────────────┐  │
│  │ 💬 Total Convos │ 👥 Active Users │ Avg Msgs│ │
│  │ {count}         │ {count}         │ {avg}   │ │
│  └──────────────────┴────────────────┴────────┘  │
│  ┌─── Messages Over Time (Bar Chart) ────────┐  │
│  │ [Recharts BarChart]                        │  │
│  │ X: Date | Y: Message count                │  │
│  │ Grouped by Student-Student vs Student-Owner│  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  VIEW CHAT (navigates to /admin/chat?id={id}):  │
│  - Full message thread view                     │
│  - Read-only admin view (no sending)            │
│  - Message metadata (timestamps, read status)   │
└─────────────────────────────────────────────────┘
```

---

### 2.5 Manage Students (`/admin/students`)

**File:** `AdminStudents.tsx` (333 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]                          │
│  "Manage Students"                              │
│                                                 │
│  ┌─── Students Table ────────────────────────┐  │
│  │                                            │  │
│  │ Name     │ Email    │ Uni   │ Status│ Acts │  │
│  │ ─────────┼──────────┼───────┼───────┼──────│  │
│  │ Ali K.   │ ali@...  │ LAU   │ ✅    │ 👁💬🗑│  │
│  │ Sara M.  │ sara@... │ AUB   │ ✅    │ 👁💬🗑│  │
│  │ Omar H.  │ omar@... │ USJ   │ ⛔    │ 👁💬🗑│  │
│  │ ...                                       │  │
│  │                                            │  │
│  │ Status indicators:                        │  │
│  │ ✅ Active (onboarding_completed)           │  │
│  │ ⛔ Banned                                  │  │
│  │ ⏳ Incomplete profile                      │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ROW ACTIONS:                                   │
│  👁️ View → Opens StudentProfileModal            │
│  💬 Message → Creates/gets conversation,        │
│              navigates to /messages              │
│  ⛔ Ban → Toggles student status                 │
│  🗑 Delete → AlertDialog confirmation            │
│                                                 │
│  STUDENT PROFILE MODAL:                         │
│  ┌────────────────────────────────────────────┐  │
│  │ [Avatar]  Ali Khalil                       │  │
│  │ Email: ali@university.edu                  │  │
│  │ Phone: +961 71 XXX XXX                     │  │
│  │                                            │  │
│  │ University: LAU                            │  │
│  │ Major: Computer Science                   │  │
│  │ Year: 3                                   │  │
│  │                                            │  │
│  │ From: Jbeil, Mount Lebanon                │  │
│  │ Gender: Male | Age: 20                    │  │
│  │                                            │  │
│  │ Accommodation: Need Dorm                  │  │
│  │ Budget: $500 | Room Type: Double          │  │
│  │ Preferred Area: Blat, Byblos              │  │
│  │                                            │  │
│  │ Personality Test: ✅ Completed             │  │
│  │ Profile Completion: 85%                   │  │
│  │                                            │  │
│  │ Joined: Jan 15, 2026                      │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  Real-time subscription on students table       │
└─────────────────────────────────────────────────┘
```

---

### 2.6 Manage Owners (`/admin/owners`)

**File:** `AdminOwners.tsx` (463 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]                          │
│  "Manage Owners"                                │
│                                                 │
│  ┌─── Search Bar ────────────────────────────┐  │
│  │ 🔍 [Search by name or email...]           │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Owners Table ─────────────────────────┐   │
│  │                                            │  │
│  │ Name   │ Email   │ Phone │ Status│ Dorms│Act│ │
│  │ ───────┼─────────┼───────┼───────┼──────┼───│ │
│  │ John D.│ j@d.com │ +961..│ ✅    │ 2    │...│ │
│  │ Jane D.│ jane@.. │ +961..│ ✅    │ 1    │...│ │
│  │ ...                                       │  │
│  │                                            │  │
│  │ Status: ✅ Active | ⛔ Suspended            │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ROW ACTIONS:                                   │
│  👁️ View → Opens OwnerProfileModal              │
│  💬 Message → Creates/gets conversation         │
│  ✅ Verify → Mark owner as verified              │
│  ⛔ Suspend → Toggle suspension                  │
│  🗑 Delete → AlertDialog + cascading cleanup     │
│                                                 │
│  OWNER PROFILE MODAL:                           │
│  ┌────────────────────────────────────────────┐  │
│  │ [Avatar]  John Doe                         │  │
│  │ Email: john@example.com                   │  │
│  │ Phone: +961 XX XXX XXX                     │  │
│  │ Status: ✅ Active                           │  │
│  │                                            │  │
│  │ Properties Owned:                          │  │
│  │ - Sunset Dorm (Verified, 12 rooms)        │  │
│  │ - Cedar Dorm (Pending, 8 rooms)           │  │
│  │                                            │  │
│  │ Joined: Dec 1, 2025                       │  │
│  │ Last Login: Mar 3, 2026                   │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  [📥 Export CSV] (downloads owner list)          │
└─────────────────────────────────────────────────┘
```

---

### 2.7 Manage Properties (`/admin/dorms`)

**File:** `AdminDorms.tsx` (331 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]                          │
│  "Manage Properties"                            │
│                                                 │
│  ┌─── Search Bar ────────────────────────────┐  │
│  │ 🔍 [Search dorms by name, location...]    │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Properties Table ─────────────────────┐   │
│  │                                            │  │
│  │ Name      │ Location │ Owner │ Status│ Acts│  │
│  │ ──────────┼──────────┼───────┼───────┼─────│  │
│  │ Sunset    │ Blat     │ J.D.  │ ✅ Ver│ ... │  │
│  │ Cedar     │ Hamra    │ Jane  │ ⏳ Pen│ ... │  │
│  │ Palm      │ Manara   │ Mike  │ ❌ Rej│ ... │  │
│  │ ...                                       │  │
│  │                                            │  │
│  │ Verification status badges:               │  │
│  │ ✅ Verified (green)                        │  │
│  │ ⏳ Pending (yellow)                        │  │
│  │ ❌ Rejected (red)                          │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ROW ACTIONS:                                   │
│  👁️ Preview → AdminDormPreviewModal             │
│  ✏️ Edit → DormEditModal (inline)                │
│  ✅ Verify / ❌ Reject (status toggle)           │
│  🗑 Delete → Confirmation dialog                 │
│                                                 │
│  ADMIN DORM PREVIEW MODAL:                      │
│  ┌────────────────────────────────────────────┐  │
│  │ Full listing preview (as student would see)│  │
│  │ - Cover image + gallery carousel          │  │
│  │ - Description                             │  │
│  │ - Amenities grid                          │  │
│  │ - Room cards with pricing                 │  │
│  │ - Location info                           │  │
│  │ - Owner contact info                      │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  DORM EDIT MODAL:                               │
│  ┌────────────────────────────────────────────┐  │
│  │ Editable fields:                           │  │
│  │ - Name, Description, Address              │  │
│  │ - Location, Area                          │  │
│  │ - University associations                 │  │
│  │ - Amenities (checkbox grid)               │  │
│  │ - Gallery images (add/remove/reorder)     │  │
│  │ - Availability toggle                     │  │
│  │ - Gender preference                       │  │
│  │ [Save Changes] [Cancel]                   │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  Real-time subscription on dorms table          │
└─────────────────────────────────────────────────┘
```

**Sub-route:** `/admin/dorms/{dormId}/rooms` — AdminDormRooms page showing room-level management for a specific property.

---

### 2.8 Analytics (`/admin/analytics`)

**File:** `AdminAnalytics.tsx` (297 lines)

```
┌─────────────────────────────────────────────────┐
│  "Analytics Dashboard"                          │
│                                                 │
│  ┌─── User Growth Chart ─────────────────────┐  │
│  │ (UserGrowthChart component)                │  │
│  │ [Recharts Line/Area Chart]                 │  │
│  │ X: Date | Y: Cumulative users             │  │
│  │ Lines: Students, Owners                    │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Engagement Chart ──────────────────────┐  │
│  │ (EngagementChart component)                │  │
│  │ [Recharts BarChart]                        │  │
│  │ Metrics: Messages, Bookings, Logins        │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Price by University (Bar Chart) ───────┐  │
│  │ [Recharts BarChart]                        │  │
│  │ X: University | Y: Avg monthly price      │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Room Type Distribution (Pie Chart) ────┐  │
│  │ [Recharts PieChart]                        │  │
│  │ Segments: Single, Double, Triple, etc.     │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Payment & Reservation Stats ───────────┐  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │ │ Revenue  │ │ Commissn │ │ Conv Rate│    │  │
│  │ │ ${total} │ │ ${total} │ │ {%}      │    │  │
│  │ └──────────┘ └──────────┘ └──────────┘    │  │
│  │                                            │  │
│  │ Reservation Funnel:                        │  │
│  │ ┌──────────────────────────────────┐       │  │
│  │ │ Paid: {N} | Pending: {N}        │       │  │
│  │ │ Failed/Expired: {N}             │       │  │
│  │ └──────────────────────────────────┘       │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

### 2.9 Personality Insights (`/admin/personality-insights`)

**File:** `AdminPersonalityInsights.tsx` (54 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]                          │
│  🧠 "Personality Insights"                      │
│  "Aggregate statistics and completion data"     │
│                                                 │
│  ┌─── Stats Cards ───────────────────────────┐  │
│  │ ┌──────────────┐ ┌──────────────┐         │  │
│  │ │ 👥 Total     │ │ 📈 Advanced  │         │  │
│  │ │ Completions  │ │ Enabled      │         │  │
│  │ │ {count}      │ │ {count}      │         │  │
│  │ │ ({%} of all) │ │              │         │  │
│  │ └──────────────┘ └──────────────┘         │  │
│  │ ┌──────────────┐                          │  │
│  │ │ 📊 Completion│                          │  │
│  │ │ Rate         │                          │  │
│  │ │ {%}          │                          │  │
│  │ └──────────────┘                          │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Students Who Completed Test ───────────┐  │
│  │ 🔍 [Search students...]                   │  │
│  │                                            │  │
│  │ Name    │ Email    │ Advanced │ Completed  │  │
│  │ ────────┼──────────┼──────────┼────────────│  │
│  │ Ali K.  │ ali@...  │ ✓ Adv.  │ Feb 15     │  │
│  │ Sara M. │ sara@... │ Basic   │ Feb 20     │  │
│  │ ...                                       │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

---

### 2.10 AI Diagnostics (`/admin/ai-diagnostics`)

**File:** `AdminAiDiagnostics.tsx` (286 lines)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]          [🔄 Refresh]    │
│  🤖 "AI Diagnostics"                            │
│  "Monitor AI model performance and accuracy"    │
│                                                 │
│  ┌─── Health Metrics Cards ──────────────────┐  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │ │ 🏠 Dorm  │ │ 🤝 Roomm │ │ 💬 Chat  │    │  │
│  │ │ Match    │ │ Match    │ │ bot      │    │  │
│  │ │ Accuracy │ │ Accuracy │ │ Precision│    │  │
│  │ │ {%}      │ │ {%}      │ │ {%}      │    │  │
│  │ └──────────┘ └──────────┘ └──────────┘    │  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │ │ Total    │ │ Total    │ │ Avg      │    │  │
│  │ │ Matches  │ │ Chats    │ │ Feedback │    │  │
│  │ │ {count}  │ │ {count}  │ │ {score}  │    │  │
│  │ └──────────┘ └──────────┘ └──────────┘    │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Match Trends (Line Chart) ─────────────┐  │
│  │ [Recharts LineChart]                       │  │
│  │ X: Date | Y: Match count                  │  │
│  │ Lines: Roommate matches, Dorm matches      │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Feedback Distribution (Bar Chart) ─────┐  │
│  │ [Recharts BarChart]                        │  │
│  │ X: Score (1-5) | Y: Count                 │  │
│  │ Grouped by: Roommate / Dorm / Chatbot      │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  Data sources:                                  │
│  - ai_match_logs (match tracking)              │
│  - ai_feedback (user feedback scores)          │
│  - ai_events (event tracking)                  │
│  - chat_logs (chatbot usage)                   │
└─────────────────────────────────────────────────┘
```

---

### 2.11 System & Logs (`/admin/system`)

**File:** `AdminSystemHub.tsx` (831 lines — second largest admin page)

```
┌─────────────────────────────────────────────────┐
│  [← Back to Dashboard]          [🔄 Refresh]    │
│  "System & Logs"                                │
│                                                 │
│  ┌─── Tabs ──────────────────────────────────┐  │
│  │ [📊 Monitor] [📋 Audit Logs] [🔐 Security]│  │
│  │ [📢 Notifications]                         │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ═══════════════════════════════════════════════ │
│                                                 │
│  MONITOR TAB:                                   │
│  ┌─── System Health Cards ───────────────────┐  │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐    │  │
│  │ │ 🗄 Tables│ │ 📊 Total │ │ 👥 Active│    │  │
│  │ │ {count}  │ │ Records  │ │ Sessions │    │  │
│  │ │          │ │ {count}  │ │ {count}  │    │  │
│  │ └──────────┘ └──────────┘ └──────────┘    │  │
│  │ ┌──────────┐ ┌──────────────────────────┐  │  │
│  │ │ ⚠️ Errors│ │ Health: ✅ Healthy       │  │  │
│  │ │ (24h)    │ │         ⚠️ Warning       │  │  │
│  │ │ {count}  │ │                          │  │  │
│  │ └──────────┘ └──────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Recent Activity Log ───────────────────┐  │
│  │ Time     │ Action            │ User │ Stat │  │
│  │ ─────────┼───────────────────┼──────┼──────│  │
│  │ 2:30 PM  │ dorm_verified     │ Admin│ ✅   │  │
│  │ 2:15 PM  │ student_signup    │ —    │ ✅   │  │
│  │ 1:45 PM  │ payment_failed    │ Ali  │ ❌   │  │
│  │ ...                                       │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ═══════════════════════════════════════════════ │
│                                                 │
│  AUDIT LOGS TAB:                                │
│  ┌─── Filter Bar ────────────────────────────┐  │
│  │ 🔍 [Search logs...]                       │  │
│  │ Action: [All ▼]  Table: [All ▼]           │  │
│  └────────────────────────────────────────────┘  │
│  ┌─── Audit Log Table ──────────────────────┐   │
│  │ (from admin_audit_log table)              │  │
│  │                                            │  │
│  │ Time │ Admin │ Action │ Table │ Details    │  │
│  │ ─────┼───────┼────────┼───────┼────────────│  │
│  │ ...  │ Admin │ UPDATE │ dorms │ {old→new}  │  │
│  │                                            │  │
│  │ Expandable rows show:                     │  │
│  │ - old_values (JSON)                       │  │
│  │ - new_values (JSON)                       │  │
│  │ - affected_user_id                        │  │
│  │ - ip_region                               │  │
│  │                                            │  │
│  │ Pagination: [← Prev] Page X [Next →]      │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ═══════════════════════════════════════════════ │
│                                                 │
│  SECURITY TAB:                                  │
│  ┌─── RLS Overview Table ────────────────────┐  │
│  │ (Row Level Security status for all tables)│  │
│  │                                            │  │
│  │ Table         │ RLS │ Policies │ Status    │  │
│  │ ──────────────┼─────┼──────────┼───────────│  │
│  │ students      │ ✅  │ S:2 I:1  │ 🟢 Secure │  │
│  │ dorms         │ ✅  │ S:3 I:1  │ 🟢 Secure │  │
│  │ messages      │ ✅  │ S:2 I:2  │ 🟢 Secure │  │
│  │ some_table    │ ❌  │ 0        │ 🔴 At Risk│  │
│  │                                            │  │
│  │ S = SELECT, I = INSERT, U = UPDATE, D = DEL│  │
│  │ Sensitive tables flagged specially          │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ┌─── Device Security Logs ──────────────────┐  │
│  │ Recent security events from               │  │
│  │ device_security_logs table                │  │
│  │                                            │  │
│  │ Time │ Event │ User │ Device │ Region      │  │
│  │ ─────┼───────┼──────┼────────┼─────────────│  │
│  │ ...  │ login │ Ali  │ iOS    │ Beirut, LB  │  │
│  └────────────────────────────────────────────┘  │
│                                                 │
│  ═══════════════════════════════════════════════ │
│                                                 │
│  NOTIFICATIONS TAB:                             │
│  ┌─── Admin Notifications ───────────────────┐  │
│  │ (from admin_notifications table)           │  │
│  │                                            │  │
│  │ ┌── Notification Card ────────────────┐   │  │
│  │ │ 🔔 "New property submission"        │   │  │
│  │ │ "Cedar Student Housing submitted..." │   │  │
│  │ │ 2 hours ago | ● Unread              │   │  │
│  │ └────────────────────────────────────┘   │  │
│  │                                            │  │
│  │ [Mark All Read]                            │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key features:**
- 4-tab mega page for system administration
- RLS debugger with per-table policy breakdown
- Audit log with JSON diff view (old → new values)
- Device security tracking (fingerprint, IP region)
- Real-time notification management

---

## Additional Routes (Utility Pages)

| Route | File | Purpose |
|-------|------|---------|
| `/admin/chat` | `AdminChatView.tsx` | Full chat thread viewer (read-only) |
| `/admin/dorms/{id}/rooms` | `AdminDormRooms.tsx` | Room management for specific property |
| `/admin/earnings` | `AdminEarnings.tsx` | Detailed earnings breakdown |
| `/admin/billing` | `AdminBilling.tsx` | Billing & invoicing |
| `/admin/wallet` | `AdminWallet.tsx` | Admin wallet management |
| `/admin/notifications` | `AdminNotifications.tsx` | Full notifications page |
| `/admin/ai-debug` | `AdminAiDebug.tsx` | AI model debug console |
| `/admin/ai-match-logs` | `AdminAiMatchLogs.tsx` | Detailed match log explorer |
| `/admin/chat-analytics` | `AdminChatAnalytics.tsx` | Chat-specific analytics |
| `/admin/security-monitor` | `AdminSecurityMonitor.tsx` | Security monitoring dashboard |
| `/admin/rls-debugger` | `AdminRLSDebugger.tsx` | Interactive RLS policy tester |
| `/admin/payments` | `AdminPaymentsDashboard.tsx` | Payment processing dashboard |
