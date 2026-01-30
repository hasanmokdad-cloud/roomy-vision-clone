# Roomy Platform Complete Rebuild Plan

**Status:** ✅ APPROVED  
**Last Updated:** January 30, 2026  
**Total Timeline:** 36 weeks (9 months)

---

## Executive Summary
This document provides a comprehensive cost estimate and step-by-step implementation plan for rebuilding Roomy as a globally-scalable platform across three separate subdomains, with native mobile apps and enterprise-grade AWS infrastructure.

---

## Part 1: Monthly Cost Estimates

### AWS Infrastructure Costs

| Service | Purpose | Startup Phase (0-10K users) | Growth Phase (10K-100K users) | Scale Phase (100K+ users) |
|---------|---------|----------------------------|------------------------------|---------------------------|
| **Aurora PostgreSQL** | Primary Database | $60-150/mo (db.t3.medium) | $400-800/mo (db.r5.large) | $2,000-5,000/mo (Multi-AZ) |
| **ElastiCache Redis** | Real-time/Caching | $25-50/mo (cache.t3.micro) | $150-300/mo (cache.r5.large) | $600-1,500/mo (cluster) |
| **ECS Fargate / Lambda** | Backend Services | $50-100/mo | $300-600/mo | $1,500-4,000/mo |
| **S3 + CloudFront** | Storage/CDN | $20-50/mo | $100-300/mo | $500-2,000/mo |
| **Route 53** | DNS Management | $5/mo | $10/mo | $20-50/mo |
| **ACM** | SSL Certificates | Free | Free | Free |
| **CloudWatch** | Monitoring/Logs | $10-30/mo | $50-150/mo | $200-500/mo |
| **WAF** | Security/Firewall | $5-20/mo | $50-100/mo | $200-400/mo |
| **Secrets Manager** | API Keys/Secrets | $5/mo | $10/mo | $25/mo |

### Third-Party Services

| Service | Purpose | Startup | Growth | Scale |
|---------|---------|---------|--------|-------|
| **Supabase** (optional) | Auth/Realtime | $25/mo (Pro) | $599/mo (Team) | Custom pricing |
| **Mailchimp** | Waitlist/Email | Free (500 contacts) | $20-50/mo | $100-300/mo |
| **Twilio** | Voice/Video Calls | $50-100/mo | $500-1,500/mo | $3,000-10,000/mo |
| **SendGrid/Resend** | Transactional Email | $20/mo | $50-100/mo | $200-500/mo |
| **Stripe** | Payments | 2.9% + $0.30/txn | Same | Volume discounts |
| **Sentry** | Error Tracking | Free | $26/mo | $80-200/mo |
| **Algolia/Typesense** | Search | $0-50/mo | $100-300/mo | $500-1,500/mo |

### Apple & Google Developer Accounts

| Account | Cost | Frequency |
|---------|------|-----------|
| **Apple Developer Program** | $99 | Annual |
| **Google Play Developer** | $25 | One-time |

### Total Monthly Cost Estimates

| Phase | Monthly Range | Annual Range |
|-------|---------------|--------------|
| **Startup (0-10K users)** | $250-600/mo | $3,000-7,200/yr |
| **Growth (10K-100K users)** | $1,500-4,000/mo | $18,000-48,000/yr |
| **Scale (100K+ users)** | $8,000-25,000/mo | $96,000-300,000/yr |

---

## Part 2: Platform Architecture

### Three-Subdomain Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                        roomylb.com (Main Domain)                     │
├─────────────────────┬─────────────────────┬─────────────────────────┤
│  waitlist.roomylb   │    app.roomylb      │    admin.roomylb        │
│     .com            │       .com          │        .com             │
├─────────────────────┼─────────────────────┼─────────────────────────┤
│  • Landing page     │  • Student/Owner    │  • Admin dashboard      │
│  • Waitlist signup  │    marketplace      │  • Analytics            │
│  • Mailchimp int.   │  • Messaging        │  • User management      │
│  • Launch countdown │  • Reservations     │  • Dorm verification    │
│                     │  • AI Matching      │  • Financial reports    │
│                     │  • Tours            │  • Support tickets      │
└─────────────────────┴─────────────────────┴─────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │   Shared Supabase Backend     │
              │   (Connected to all 3 apps)   │
              │                               │
              │  • PostgreSQL Database        │
              │  • Authentication             │
              │  • Edge Functions             │
              │  • Realtime Subscriptions     │
              │  • Storage Buckets            │
              └───────────────────────────────┘
                              │
                              ▼ (Migration when ready)
              ┌───────────────────────────────┐
              │      AWS Infrastructure       │
              │                               │
              │  • Aurora PostgreSQL          │
              │  • ECS/Lambda (Go/Kotlin)     │
              │  • ElastiCache Redis          │
              │  • S3 + CloudFront            │
              └───────────────────────────────┘
```

---

## Part 3: Programming Languages by Component

### Frontend (Web Applications)

| Project | Language | Framework | Styling |
|---------|----------|-----------|---------|
| **waitlist.roomylb.com** | TypeScript | React + Vite | Tailwind CSS |
| **app.roomylb.com** | TypeScript | React + Vite | Tailwind CSS |
| **admin.roomylb.com** | TypeScript | React + Vite | Tailwind CSS |

### Backend Services (AWS Migration)

| Service | Language | Runtime | Purpose |
|---------|----------|---------|---------|
| **API Gateway** | Go | AWS Lambda/ECS | High-concurrency request handling |
| **Business Logic** | Kotlin | AWS ECS | Reservations, payments, matching |
| **Real-time Messaging** | Go or Rust | AWS ECS | WebSocket connections, presence |
| **AI/ML Services** | Python | AWS Lambda/SageMaker | Recommendations, matching |
| **Scheduled Jobs** | Go | AWS Lambda | Reminders, cleanups, reports |

### Database Layer

| Component | Technology | Language |
|-----------|------------|----------|
| **Primary Database** | PostgreSQL (Aurora) | SQL |
| **Migrations** | Flyway or golang-migrate | SQL |
| **Stored Procedures** | PL/pgSQL | SQL |
| **Caching** | Redis | - |

### Native Mobile Apps

| Platform | Language | UI Framework | Shared Logic |
|----------|----------|--------------|--------------|
| **iOS** | Swift | SwiftUI | Kotlin Multiplatform |
| **Android** | Kotlin | Jetpack Compose | Kotlin Multiplatform |

### Shared Business Logic (KMP)

| Component | Language | Shared Between |
|-----------|----------|----------------|
| **Data Models** | Kotlin | iOS, Android, Backend |
| **Networking** | Kotlin (Ktor) | iOS, Android |
| **Validation** | Kotlin | iOS, Android, Backend |
| **Business Rules** | Kotlin | All platforms |

### Infrastructure as Code

| Component | Tool/Language |
|-----------|---------------|
| **AWS Resources** | Terraform (HCL) |
| **Container Orchestration** | Docker + ECS Task Definitions (JSON/YAML) |
| **CI/CD Pipelines** | GitHub Actions (YAML) |
| **Kubernetes (optional)** | YAML manifests |

---

## Part 4: Step-by-Step Implementation Plan

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: Project Setup

**1.1 Create Lovable Workspaces**
- [ ] Create workspace: `roomy-waitlist`
- [ ] Create workspace: `roomy-app`
- [ ] Create workspace: `roomy-admin`

**1.2 Domain Configuration**
- [ ] Configure DNS for `roomylb.com`
- [ ] Set up subdomains: `waitlist.`, `app.`, `admin.`
- [ ] Obtain SSL certificates (ACM)

**1.3 Shared Supabase Setup**
- [ ] Create ONE Supabase project for all 3 apps
- [ ] Note the project URL and anon key
- [ ] Connect same Supabase project to all 3 Lovable workspaces

#### Week 2: Waitlist Project (waitlist.roomylb.com)

**Languages:** TypeScript, CSS, HTML

**Components to Build:**
```
src/
├── components/
│   ├── Hero.tsx                 # Main landing section
│   ├── Features.tsx             # Platform features preview
│   ├── WaitlistForm.tsx         # Email signup form
│   ├── CountdownTimer.tsx       # Launch countdown
│   ├── Testimonials.tsx         # Early user feedback
│   └── Footer.tsx               # Links and social
├── lib/
│   └── mailchimp.ts             # Mailchimp API integration
└── pages/
    └── index.tsx                # Landing page
```

**Mailchimp Integration:**
- [ ] Create Mailchimp account and audience list
- [ ] Create Edge Function to handle signups securely
- [ ] Implement double opt-in for GDPR compliance

#### Week 3-4: Database Schema Recreation

**Recreate all 76+ tables in Supabase:**

Core Tables:
- [ ] `roles`, `user_roles` - Role-based access control
- [ ] `students`, `owners`, `admins` - User profiles
- [ ] `dorms`, `rooms`, `beds`, `bedrooms` - Property hierarchy
- [ ] `apartments`, `apartment_spaces`, `apartment_photos` - Apartment system
- [ ] `reservations`, `payments`, `bookings` - Transactions
- [ ] `conversations`, `messages` - Messaging system
- [ ] `friendships`, `notifications` - Social features
- [ ] `ai_*` tables - AI matching and recommendations

Security:
- [ ] Recreate all RLS policies
- [ ] Recreate all database functions (`is_admin`, `has_role`, etc.)
- [ ] Recreate all triggers (timestamps, notifications, etc.)

### Phase 2: Main App (Weeks 5-12)

#### Weeks 5-6: Core Architecture

**Languages:** TypeScript

**Folder Structure for app.roomylb.com:**
```
src/
├── components/
│   ├── auth/           # Login, signup, password reset
│   ├── listings/       # Dorm cards, filters, search
│   ├── messaging/      # Chat UI, reactions, voice notes
│   ├── bookings/       # Reservation flow
│   ├── owner/          # Become owner wizard
│   ├── student/        # Student profiles, AI match
│   └── shared/         # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and helpers
├── pages/              # Route components
└── integrations/
    └── supabase/       # Auto-generated client
```

#### Weeks 7-8: Authentication & Roles

- [ ] Email/password authentication
- [ ] Email verification flow
- [ ] Device fingerprinting and security
- [ ] Role-based routing (student, owner, admin)
- [ ] GlobalAuthModal (Airbnb-style, no /auth route)

#### Weeks 9-10: Messaging System

**WhatsApp-style features to implement:**
- [ ] Real-time message delivery
- [ ] Read receipts (sent/delivered/seen)
- [ ] Typing indicators
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] Voice notes (record/playback)
- [ ] Reply threading
- [ ] Pinned messages
- [ ] Online presence indicators
- [ ] Hold-to-record gesture (mobile)
- [ ] Swipe-to-cancel/lock gesture (mobile)

#### Weeks 11-12: Reservation System

- [ ] Tour booking flow
- [ ] Payment integration (Whish/Stripe)
- [ ] Reservation status management
- [ ] Owner notifications
- [ ] Student receipts
- [ ] Cancellation policies

### Phase 3: Admin Dashboard (Weeks 13-16)

#### Weeks 13-14: Admin Core

**Languages:** TypeScript

**admin.roomylb.com Structure:**
```
src/
├── components/
│   ├── dashboard/      # Overview widgets
│   ├── users/          # User management
│   ├── dorms/          # Dorm verification
│   ├── analytics/      # Charts and reports
│   ├── finance/        # Payments and payouts
│   └── support/        # Ticket management
├── hooks/
│   └── useAdminAuth.ts # Admin-only auth
└── pages/
    ├── Dashboard.tsx
    ├── Users.tsx
    ├── Dorms.tsx
    ├── Analytics.tsx
    └── Settings.tsx
```

#### Weeks 15-16: Analytics & Reporting

- [ ] Real-time user activity monitoring
- [ ] Revenue tracking and forecasting
- [ ] Dorm performance metrics
- [ ] User growth charts
- [ ] AI match analytics

### Phase 4: Native Mobile Apps (Weeks 17-28)

#### Weeks 17-20: Kotlin Multiplatform Setup

**Languages:** Kotlin

**Shared Module Structure:**
```
shared/
├── src/
│   ├── commonMain/
│   │   ├── models/          # Data classes
│   │   ├── network/         # Ktor HTTP client
│   │   ├── repository/      # Data repositories
│   │   └── validation/      # Business rules
│   ├── androidMain/         # Android-specific
│   └── iosMain/             # iOS-specific
```

#### Weeks 21-24: iOS App

**Languages:** Swift, SwiftUI

**Structure:**
```
RoomyiOS/
├── App/
│   └── RoomyApp.swift
├── Features/
│   ├── Auth/
│   ├── Listings/
│   ├── Messaging/
│   ├── Bookings/
│   └── Profile/
├── Core/
│   ├── Network/
│   ├── Storage/
│   └── Push/
└── Resources/
```

#### Weeks 25-28: Android App

**Languages:** Kotlin, Jetpack Compose

**Structure:**
```
RoomyAndroid/
├── app/
│   ├── ui/
│   │   ├── auth/
│   │   ├── listings/
│   │   ├── messaging/
│   │   └── bookings/
│   ├── data/
│   │   ├── repository/
│   │   └── remote/
│   └── di/               # Dependency Injection
```

### Phase 5: AWS Migration (Weeks 29-36)

#### Weeks 29-30: Infrastructure Setup

**Languages:** Terraform (HCL), YAML

**Terraform Modules:**
```
infrastructure/
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── modules/
│   │   ├── vpc/
│   │   ├── aurora/
│   │   ├── elasticache/
│   │   ├── ecs/
│   │   ├── s3/
│   │   └── cloudfront/
│   └── environments/
│       ├── dev/
│       ├── staging/
│       └── production/
```

#### Weeks 31-32: Go API Gateway

**Language:** Go

**Structure:**
```
services/api-gateway/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── handlers/
│   ├── middleware/
│   ├── auth/
│   └── routes/
├── pkg/
│   └── response/
├── Dockerfile
└── go.mod
```

#### Weeks 33-34: Kotlin Business Services

**Language:** Kotlin

**Structure:**
```
services/business-logic/
├── src/main/kotlin/
│   ├── reservations/
│   ├── payments/
│   ├── matching/
│   └── notifications/
├── build.gradle.kts
└── Dockerfile
```

#### Weeks 35-36: Real-time Messaging Service

**Language:** Go or Rust

**Features:**
- [ ] WebSocket connection management
- [ ] Presence system (online/offline)
- [ ] Message routing
- [ ] Typing indicators
- [ ] Read receipt tracking

---

## Part 5: Supabase Connection Guide

### Connecting Same Supabase to All 3 Lovable Projects

**Step 1: Create Supabase Project**
- Go to your first Lovable project (app.roomylb.com)
- Enable Lovable Cloud (this creates the Supabase project)
- Note the Project URL and Anon Key from Cloud settings

**Step 2: Connect to Waitlist Project**
- In waitlist Lovable project, go to Settings → Supabase
- Choose "Connect existing project"
- Enter the same Project URL and Anon Key
- The waitlist will now share the same database

**Step 3: Connect to Admin Project**
- Repeat Step 2 for admin.roomylb.com
- All 3 projects now share:
  - Same database tables
  - Same authentication users
  - Same Edge Functions
  - Same Storage buckets

**Important RLS Considerations:**
```sql
-- Example: Admin-only access policy
CREATE POLICY "Admins can view all users"
ON public.students
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Example: App-only access (students/owners)
CREATE POLICY "Users can view own profile"
ON public.students
FOR SELECT
USING (auth.uid() = user_id);
```

---

## Part 6: Complete Technology Stack Summary

### By Layer

| Layer | Technologies |
|-------|--------------|
| **Frontend Web** | TypeScript, React, Vite, Tailwind CSS, Radix UI |
| **Frontend Mobile iOS** | Swift, SwiftUI, Combine |
| **Frontend Mobile Android** | Kotlin, Jetpack Compose, Coroutines |
| **Shared Mobile Logic** | Kotlin Multiplatform, Ktor |
| **Backend API** | Go, Gin/Echo framework |
| **Backend Business Logic** | Kotlin, Spring Boot or Ktor |
| **Backend Real-time** | Go or Rust, WebSockets |
| **Backend AI/ML** | Python, TensorFlow/PyTorch |
| **Database** | PostgreSQL, SQL, PL/pgSQL |
| **Caching** | Redis |
| **Search** | Elasticsearch or Typesense |
| **Infrastructure** | Terraform (HCL), Docker, YAML |
| **CI/CD** | GitHub Actions (YAML), Shell scripts |

### Full Language Count

| Language | Usage |
|----------|-------|
| **TypeScript** | All 3 web frontends |
| **Swift** | iOS native app |
| **Kotlin** | Android app + shared logic + backend services |
| **Go** | API Gateway + real-time messaging |
| **Rust** | (Optional) High-performance real-time |
| **Python** | AI/ML services |
| **SQL** | Database schema, migrations, procedures |
| **HCL** | Terraform infrastructure |
| **YAML** | Docker Compose, GitHub Actions, K8s |
| **Shell** | Deployment scripts |

---

## Part 7: Project Tracking Checklist

### Lovable Project: waitlist.roomylb.com
- [ ] Create Lovable workspace
- [ ] Build landing page with hero section
- [ ] Implement Mailchimp waitlist signup
- [ ] Add countdown timer to launch
- [ ] Configure custom domain
- [ ] Deploy to production

### Lovable Project: app.roomylb.com
- [ ] Create Lovable workspace
- [ ] Enable Lovable Cloud (Supabase)
- [ ] Recreate all 76+ database tables
- [ ] Implement all RLS policies
- [ ] Build authentication system
- [ ] Build listings/marketplace
- [ ] Build messaging system
- [ ] Build reservation system
- [ ] Build owner wizard
- [ ] Build AI matching
- [ ] Configure custom domain
- [ ] Deploy to production

### Lovable Project: admin.roomylb.com
- [ ] Create Lovable workspace
- [ ] Connect to shared Supabase
- [ ] Build admin dashboard
- [ ] Build user management
- [ ] Build dorm verification
- [ ] Build analytics
- [ ] Build financial reports
- [ ] Configure custom domain
- [ ] Deploy to production

### Native Mobile: iOS
- [ ] Set up Xcode project
- [ ] Configure Kotlin Multiplatform
- [ ] Build authentication flow
- [ ] Build listings UI
- [ ] Build messaging UI
- [ ] Build booking flow
- [ ] Implement push notifications
- [ ] Submit to App Store

### Native Mobile: Android
- [ ] Set up Android Studio project
- [ ] Configure Kotlin Multiplatform
- [ ] Build authentication flow
- [ ] Build listings UI
- [ ] Build messaging UI
- [ ] Build booking flow
- [ ] Implement push notifications
- [ ] Submit to Play Store

### AWS Migration
- [ ] Set up AWS account
- [ ] Create Terraform configurations
- [ ] Deploy Aurora PostgreSQL
- [ ] Deploy ElastiCache Redis
- [ ] Build Go API Gateway
- [ ] Build Kotlin business services
- [ ] Build real-time messaging service
- [ ] Configure CloudFront CDN
- [ ] Set up monitoring and alerts
- [ ] Migrate data from Supabase

---

## Part 8: Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Foundation** | Weeks 1-4 | Waitlist site + Database schema |
| **Phase 2: Main App** | Weeks 5-12 | Full app.roomylb.com |
| **Phase 3: Admin** | Weeks 13-16 | Full admin.roomylb.com |
| **Phase 4: Mobile** | Weeks 17-28 | iOS + Android native apps |
| **Phase 5: AWS** | Weeks 29-36 | Full AWS infrastructure |

**Total Timeline: 36 weeks (9 months)**

This assumes a single developer working full-time. With a team:
- 2 developers: ~5-6 months
- 3-4 developers: ~3-4 months

---

## Part 9: Key Architecture Decisions from Current Roomy

### Authentication Architecture
- GlobalAuthModal (Airbnb-style modal, not /auth route)
- AuthContext as single source of truth
- 100ms delay before getSession() for Supabase hydration
- Synchronous onAuthStateChange listener (no async keyword)
- sessionStorage flag to prevent rogue SIGNED_IN events during sign-out

### Mobile-First Design
- Bottom navbar Instagram/Airbnb style (24px icons, no text)
- Role-based tabs for different user types
- WhatsApp-style voice recording gestures
- Capacitor for web-to-native bridge (current), Swift/Kotlin native (new)

### Database Security
- RLS policies on all tables
- `is_admin()` and `has_role()` SECURITY DEFINER functions
- Role-based access control via `user_roles` table
- Device fingerprinting and security logs

### Real-time Features
- Supabase Realtime for messaging
- Presence indicators for online status
- Typing indicators
- Read receipts (sent/delivered/seen)

---

## Part 10: Current Database Tables Reference

### Core Tables (76+)
1. `roles` - Role definitions
2. `user_roles` - User-role assignments
3. `students` - Student profiles
4. `owners` - Owner profiles
5. `admins` - Admin profiles
6. `dorms` - Building/dorm listings
7. `rooms` - Traditional room hierarchy
8. `beds` - Individual bed units
9. `apartments` - Apartment units
10. `bedrooms` - Apartment bedrooms
11. `apartment_spaces` - Apartment space definitions
12. `apartment_photos` - Apartment images
13. `apartment_pricing_tiers` - Tiered pricing
14. `reservations` - Booking reservations
15. `payments` - Payment records
16. `bookings` - Tour bookings
17. `conversations` - Chat conversations
18. `messages` - Chat messages
19. `message_reactions` - Emoji reactions
20. `friendships` - Friend connections
21. `notifications` - User notifications
22. `wishlists` - Saved listings
23. `ai_chat_sessions` - AI chat history
24. `ai_events` - AI interaction logs
25. `ai_feedback` - AI quality feedback
26. `ai_match_logs` - Matching algorithm logs
27. `analytics_events` - Usage analytics
28. `contact_messages` - Contact form submissions
29. `admin_audit_log` - Admin action logs
30. `admin_notifications` - Admin alerts
31. `admin_wallet` - Admin financials
32. `billing_history` - Payment history
33. `booking_reminders` - Scheduled reminders
34. `chat_settings` - User chat preferences
35. `device_security_logs` - Security tracking
36. `dorm_claims` - Ownership claims
37. `email_verification_tokens` - Email verification
38. `group_members` - Group chat members
39. `calls` - Voice/video call records
40. `call_participants` - Call participant tracking
... and 36+ more tables

---

## Notes

- This plan is saved at `.lovable/plan.md` and can be referenced across all Lovable workspaces
- Copy this file to each new workspace to maintain context
- Update checkboxes as you complete each task
- The same Supabase backend should be connected to all 3 web projects
- When you ask Lovable to "continue working on the plan", it will read this file

---

*Last approved: January 30, 2026*
