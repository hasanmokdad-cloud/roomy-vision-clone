# Tenanters Platform Complete Educational Guide & Architecture Plan v4

> **Document Version:** 4.0  
> **Updated:** March 2026  
> **Purpose:** Comprehensive educational guide + implementation roadmap for the Tenanters student housing platform  
> **Development Approach:** Frontend UI/UX finalized in Lovable (prototype), then rebuilt from scratch by a professional development team using production-grade frameworks and AWS infrastructure.

---

## TABLE OF CONTENTS

### Foundation (Parts 1-6)
1. [Executive Summary](#executive-summary)
2. [Web Development Fundamentals](#part-1-web-development-fundamentals)
3. [Master Technology Classification](#part-2-master-technology-classification)
4. [Web Application Architecture Types](#part-3-web-application-architecture-types)
5. [Tenanters Architecture Decisions](#part-4-tenanters-architecture-decisions)
6. [Software Company Structure](#part-5-software-company-structure)
7. [Feature Production Line](#part-6-feature-production-line)

### Technical Implementation (Parts 7-12)
8. [Complete Technology Stack](#part-7-complete-technology-stack)
9. [Three-Subdomain Architecture](#part-8-three-subdomain-architecture)
10. [Deployment Strategy](#part-9-deployment-strategy)
11. [Migration Strategy](#part-10-migration-strategy)
12. [Implementation Timeline](#part-11-implementation-timeline)
13. [DevOps Engineer Hiring Guide](#part-12-devops-engineer-hiring-guide)

### Platform & Infrastructure (Parts 13-18)
14. [Lovable's Role (Prototype Only)](#part-13-lovable-role)
15. [AWS Education](#part-14-aws-education)
16. [Cost Estimates](#part-15-cost-estimates)
17. [Database Schema Reference](#part-16-database-schema-reference)
18. [Security Implementation](#part-17-security-implementation)
19. [CI/CD Workflows](#part-18-cicd-workflows)

### Advanced Architecture (Parts 19-23)
20. [Airbnb Architecture Case Study](#part-19-airbnb-architecture-case-study)
21. [Event-Driven Architecture](#part-20-event-driven-architecture)
22. [Migration Strategies (Monolith to Services)](#part-21-migration-strategies)
23. [Advanced Infrastructure Tools](#part-22-advanced-infrastructure-tools)
24. [Production-Ready Backend Design](#part-23-production-ready-backend-design)

### Infrastructure & Operations (Parts 24-28)
25. [Waitlist Project Technical Specification](#part-24-waitlist-project-technical-specification)
26. [Email Infrastructure Strategy](#part-25-email-infrastructure-strategy)
27. [Domain & DNS Infrastructure](#part-26-domain-dns-infrastructure)
28. [Email Setup (Google Workspace)](#part-27-email-setup-google-workspace)
29. [Development Approach & Team Handoff](#part-28-development-approach-team-handoff)

---

## EXECUTIVE SUMMARY

### What This Document Is

This is a **comprehensive educational guide** that explains every aspect of building a modern web and mobile platform from scratch. It's designed for founders, product managers, and aspiring developers who want to understand:

- **What each technology does** (not just what it's called)
- **How a software company is organized** (departments, roles, responsibilities)
- **How a feature moves from idea to user's screen** (the complete production pipeline)
- **What architecture decisions Tenanters should make** (and why)

### Development Approach

**IMPORTANT:** The Tenanters platform is being developed in two phases:

1. **Phase 1 (Current — Lovable):** Build the complete frontend UI/UX as a working prototype using Lovable (React + Vite + Tailwind CSS + Supabase). This serves as a **visual specification** — the dev team will see exactly what the product should look and behave like.

2. **Phase 2 (Production — Dev Team):** A professional development team rebuilds the platform from scratch using production-grade technologies (Next.js, AWS, Go, Kotlin, Python, etc.). The Lovable prototype is NOT deployed to production — it is reference material only.

**We are NOT restricted to Vite+React for frontend, nor Supabase/PostgreSQL for backend.** The production stack is chosen based on what's best for a large-scale, globally scalable platform.

### Key Architecture Decisions for Tenanters

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Frontend Framework** | Next.js (React + Tailwind CSS) | SSR/ISR for SEO on public pages, SPA-like for authenticated pages |
| **Architecture** | Modular Monolith → Microservices | Fast launch, scale later |
| **Hosting: Waitlist** | Vercel | Simple, fast, cheap |
| **Hosting: Main App + Admin** | AWS (S3 + CloudFront + ECS) | Enterprise-grade from day 1 |
| **Backend: API Layer** | Node.js (Express/Fastify) or Kotlin (Ktor) | REST APIs, business logic |
| **Backend: Real-time Messaging** | Go (Golang) | High-concurrency WebSocket server |
| **Backend: AI/ML** | Python (FastAPI) | AI matching algorithm |
| **Database** | AWS Aurora PostgreSQL | Managed, auto-scaling relational DB |
| **Caching** | AWS ElastiCache (Redis) | Sessions, real-time presence, caching |
| **Containerization** | Docker + ECS Fargate (→ Kubernetes/EKS at scale) | Managed containers, scale globally later |
| **Mobile: iOS** | Swift + SwiftUI | Native performance, best UX |
| **Mobile: Android** | Kotlin + Jetpack Compose | Native performance, best UX |
| **Mobile: Shared Logic** | Kotlin Multiplatform (KMP) | Share business logic across platforms |
| **Mobile: NOT using** | Flutter / React Native | Going fully native for quality |
| **Voice/Video Calls** | Mobile app only (WebRTC) | Not on web (too buggy/unreliable) |
| **Domain Registrar** | Cloudflare | Best AWS compatibility, CDN, DDoS protection |
| **DNS** | Cloudflare | Already configured |
| **Email Inbox** | Google Workspace | Business email, calendar, drive |
| **Email Sending (Transactional)** | Resend → AWS SES at scale | Programmatic email API |
| **DevOps** | Hire engineers/team | AWS setup, CI/CD, monitoring |

### Subdomain Architecture

| Subdomain | Purpose | Hosting | Status |
|-----------|---------|---------|--------|
| `waitlist.tenanters.com` | Pre-launch waitlist | Vercel | Ready to deploy |
| `www.tenanters.com` | Main user-facing website | AWS (S3 + CloudFront) | Post-launch |
| `admin.tenanters.com` | Admin control panel (internal) | AWS (S3 + CloudFront) | Post-launch |
| `tenanters.com` | Root domain redirect | Cloudflare redirect → www.tenanters.com | Configured |

---

## PART 1: Web Development Fundamentals

### 1.1 The Three Core Layers of Every Application

Every web application consists of three fundamental layers. Understanding these is essential before diving into any technology:

| Layer | Restaurant Analogy | What It Does | Tenanters Example |
|-------|-------------------|--------------|-------------------|
| **Frontend** | The dining room | What users see and interact with | Next.js app at www.tenanters.com |
| **Backend** | The kitchen | Processes requests, runs business logic | AWS Lambda / ECS services |
| **Database** | The pantry/storage | Stores all data permanently | Aurora PostgreSQL |

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER                                            │
│                     (Student, Owner, or Admin)                             │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ Opens browser/app
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND LAYER                                   │
│                                                                             │
│  • Displays the UI (buttons, forms, pages)                                │
│  • Handles user interactions (clicks, typing)                             │
│  • Sends requests to backend when user takes action                       │
│  • Receives data from backend and displays it                             │
│                                                                             │
│  Languages: HTML, CSS, TypeScript                                         │
│  Framework: Next.js (React), Tailwind CSS, shadcn/ui                      │
│  Rendering: SSR/ISR for public pages, CSR for authenticated pages         │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ HTTPS Request (API Call)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND LAYER                                    │
│                                                                             │
│  • Receives requests from frontend                                        │
│  • Validates and processes data                                           │
│  • Runs business logic (calculate prices, check permissions)              │
│  • Talks to database to get/save data                                     │
│  • Sends response back to frontend                                        │
│                                                                             │
│  Languages: Node.js/Kotlin (API), Go (messaging), Python (AI)             │
│  Platforms: AWS Lambda, ECS Fargate, API Gateway                          │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │ SQL Query
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE LAYER                                   │
│                                                                             │
│  • Stores all permanent data                                              │
│  • Handles relationships between data (student → reservation → dorm)      │
│  • Ensures data integrity (no duplicate emails, valid references)         │
│  • Controls access (IAM + application-level authorization)                │
│                                                                             │
│  Language: SQL                                                            │
│  System: AWS Aurora PostgreSQL                                            │
│  Cache: AWS ElastiCache (Redis)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 What "Backend" Actually Includes

Many beginners think "backend = database". This is wrong. The backend includes MANY components:

| Component | What It Does | Tenanters Implementation |
|-----------|--------------|--------------------------|
| **API Endpoints** | URLs that receive requests | AWS API Gateway + Lambda/ECS |
| **Business Logic** | Processes data (calculate price, validate) | Reservation calculations, AI matching |
| **Authentication** | Verify WHO the user is | AWS Cognito |
| **Authorization** | Check WHAT the user can do | IAM policies, application-level RBAC |
| **Database Queries** | Getting/saving data | Aurora PostgreSQL via ORM |
| **Serverless Functions** | Functions on demand | AWS Lambda (20+ functions) |
| **Middleware** | Code between request and response | CORS headers, auth checks |
| **Caching** | Store frequently-used data in memory | ElastiCache Redis |
| **File Processing** | Handle uploads, resize images | AWS S3 |
| **Notifications** | Send emails, SMS, push | AWS SES, SNS, push notifications |
| **Scheduled Jobs** | Run tasks at specific times | Lambda + EventBridge scheduled rules |
| **Webhooks** | Receive events from other services | Payment confirmations |

### 1.3 How Data Flows in a Web Application

Let's trace exactly what happens when a user clicks "Book Tour" on a dorm listing:

```text
STEP 1: User Action
┌─────────────────────────────────────────────────────────────────────────────┐
│  User clicks "Book Tour" button on dorm listing page                        │
│  Location: www.tenanters.com/listings/abc123                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
STEP 2: Frontend Prepares Request
┌─────────────────────────────────────────────────────────────────────────────┐
│  Next.js component handles the click:                                       │
│                                                                             │
│  const handleBookTour = async () => {                                       │
│    const response = await fetch('/api/bookings', {                          │
│      method: 'POST',                                                        │
│      headers: { Authorization: `Bearer ${token}` },                         │
│      body: JSON.stringify({                                                 │
│        dormId: 'abc123',                                                    │
│        requestedDate: '2026-03-15',                                        │
│        requestedTime: '14:00',                                             │
│        message: 'I would like to see the dorm'                             │
│      })                                                                     │
│    });                                                                     │
│  };                                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 HTTP Methods Explained

| Method | Purpose | Example | Tenanters Usage |
|--------|---------|---------|-----------------|
| **GET** | Read data (no changes) | `GET /api/dorms` | Fetch dorm listings |
| **POST** | Create new data | `POST /api/bookings` | Create a new booking |
| **PUT** | Replace data entirely | `PUT /api/users/123` | Full profile update |
| **PATCH** | Update part of data | `PATCH /api/users/123` | Change just email |
| **DELETE** | Remove data | `DELETE /api/messages/456` | Delete a message |
| **OPTIONS** | CORS preflight check | `OPTIONS /api/*` | Browser security |

### 1.5 Complete Technical Glossary

| Term | Definition |
|------|------------|
| **API** | Application Programming Interface, a set of endpoints for communication |
| **SSR** | Server-Side Rendering, rendering HTML on the server |
| **CSR** | Client-Side Rendering, rendering HTML in the browser |
| **ISR** | Incremental Static Regeneration, static pages updated on demand |
| **ORM** | Object-Relational Mapping, a tool to interact with databases |
| **JWT** | JSON Web Token, a token for authentication |
| **E2E Encryption** | End-to-End Encryption, secure communication only readable by sender/receiver |
| **CI/CD** | Continuous Integration/Continuous Deployment, automated build and release pipelines |
| **PWA** | Progressive Web App, web app with native-like capabilities |
| **WebSocket** | Protocol for real-time communication between client and server |

---

## PART 2: Master Technology Classification

### 2.1 The Correct Classification

#### Programming Languages

| Language | Purpose | Syntax Example | Used in Tenanters |
|----------|---------|----------------|-------------------|
| **JavaScript** | Web browsers, frontend | `const x = 5;` | Via TypeScript |
| **TypeScript** | JavaScript + types (safer) | `const x: number = 5;` | ✅ All frontend + Node.js backend |
| **Swift** | iOS/macOS apps | `let x: Int = 5` | ✅ iOS app |
| **Kotlin** | Android apps, backends | `val x: Int = 5` | ✅ Android app + KMP shared logic |
| **Python** | AI, data science, backends | `x = 5` | ✅ AI matching service (FastAPI) |
| **Go** | High-performance servers | `var x int = 5` | ✅ Real-time messaging server |
| **Rust** | Ultra-fast, safe systems | `let x: i32 = 5;` | OPTIONAL - Future optimization |
| **Java** | Enterprise backends | `int x = 5;` | NO - Using Kotlin instead |
| **SQL** | Database queries | `SELECT * FROM users` | ✅ All database operations |

#### UI Frameworks (Frontend)

| Technology | Category | Purpose | Used in Tenanters |
|------------|----------|---------|-------------------|
| **React** | UI Library | Component-based UI building | ✅ Via Next.js |
| **Next.js** | Full-Stack Framework | React + SSR/ISR + routing | ✅ Production frontend |
| **Vue** | UI Framework | Alternative to React | NO |
| **Angular** | UI Framework | Enterprise React alternative | NO |
| **Svelte** | UI Framework | Compile-time framework | NO |

**IMPORTANT CLARIFICATIONS:**
- **React is a UI LIBRARY**, not a framework. It only handles the view layer.
- **Next.js is a FRAMEWORK** built on top of React. It adds routing, SSR/ISR, API routes, and image optimization.
- **Lovable prototype** uses React + Vite (SPA). **Production** will use Next.js for SEO benefits.
- The Lovable prototype serves as a visual specification; the dev team rebuilds with Next.js.

#### Mobile UI Frameworks

| Technology | Platform | Purpose | Used in Tenanters |
|------------|----------|---------|-------------------|
| **SwiftUI** | iOS only | Apple's declarative UI | ✅ iOS app |
| **Jetpack Compose** | Android only | Google's modern UI toolkit | ✅ Android app |
| **Flutter** | Cross-platform | Google's cross-platform UI | ❌ NO - Going native |
| **React Native** | Cross-platform | React for mobile | ❌ NO - Going native |

**Why native over cross-platform?** Native apps (Swift + Kotlin) provide the best performance and UX, especially for real-time features like messaging, voice calls, and video calls. Flutter/React Native introduce abstraction layers that add latency and limit access to platform-specific APIs.

#### Backend Frameworks

| Technology | Language | Purpose | Used in Tenanters |
|------------|----------|---------|-------------------|
| **Express/Fastify** | Node.js | Web framework for REST APIs | ✅ API layer option |
| **Ktor** | Kotlin | Lightweight Kotlin framework | MAYBE - API layer option |
| **FastAPI** | Python | Modern async Python API | ✅ AI matching service |
| **Gin/Fiber** | Go | Fast Go framework | ✅ Real-time messaging server |
| **Spring Boot** | Java/Kotlin | Enterprise Java framework | NO - Too heavy for needs |
| **Django/Flask** | Python | Python web frameworks | NO - Using FastAPI |
| **Nest.js** | Node.js | Enterprise Node framework | NO - Express is sufficient |

**Backend Language Decision:**
- **Node.js (Express)** is recommended for the main API layer due to the largest talent pool, fastest hiring, and TypeScript compatibility with the frontend.
- **Go** for the real-time messaging WebSocket server (high concurrency, low latency).
- **Python (FastAPI)** for the AI/ML service (matching algorithm, recommendations).
- All services containerized with Docker and deployed on AWS.

### 2.5 Styling Systems

| Technology | Category | Purpose | Used in Tenanters |
|------------|----------|---------|-------------------|
| **Tailwind CSS** | CSS Framework | Utility-first styling | ✅ All styling |
| **shadcn/ui** | Component Collection | Copy-paste components | ✅ All components |
| **Radix UI** | UI Primitives | Unstyled accessible components | ✅ (via shadcn) |

### 2.6 Databases

| Technology | Type | Purpose | Used in Tenanters |
|------------|------|---------|-------------------|
| **PostgreSQL** | Relational (SQL) | Primary data storage | ✅ Via Aurora PostgreSQL |
| **Aurora PostgreSQL** | Managed Relational | AWS-managed PostgreSQL | ✅ Production database |
| **Redis** | In-Memory | Caching, sessions, real-time | ✅ Via ElastiCache |

**CLARIFICATION:** PostgreSQL is a **database system**, not a programming language. You interact with it using **SQL** (Structured Query Language). AWS Aurora PostgreSQL is the managed, auto-scaling version that handles replication, backups, and failover automatically.

### 2.7 Cloud Providers & Hosting

| Technology | Category | Purpose | Used in Tenanters |
|------------|----------|---------|-------------------|
| **AWS** | Cloud Provider | Full cloud platform | ✅ All production infrastructure |
| **Vercel** | Hosting Platform | Frontend deployment | ✅ Waitlist site only |
| **Cloudflare** | DNS/CDN/Domain | Domain registrar + DNS + DDoS | ✅ tenanters.com domain |

### 2.8 DevOps & Infrastructure Tools

| Technology | Category | Purpose | Used in Tenanters |
|------------|----------|---------|-------------------|
| **Docker** | Containerization | Package applications | ✅ All backend services |
| **ECS Fargate** | Container Orchestration | Managed containers (no servers) | ✅ Launch phase |
| **Kubernetes (EKS)** | Container Orchestration | Full container orchestration | ✅ At scale (100K+ users) |
| **ECR** | Container Registry | Store Docker images | ✅ All Docker images |
| **Terraform** | Infrastructure as Code | Define cloud resources | ✅ All AWS infrastructure |
| **GitHub** | Code Hosting | Repository management | ✅ All code |
| **GitHub Actions** | CI/CD | Automated pipelines | ✅ All deployments |

### 2.9 External Services

| Service | Category | Purpose | Used in Tenanters |
|---------|----------|---------|-------------------|
| **Whish (Codnloc Pay)** | Payments | Payment processing (Lebanon) | ✅ Primary payments |
| **Google Workspace** | Email/Productivity | Business email inbox | ✅ team@tenanters.com |
| **Resend → AWS SES** | Email API | Transactional email sending | ✅ App notifications |
| **Mailchimp** | Marketing | Email campaigns + waitlist signups | ✅ Waitlist |
| **Sentry** | Monitoring | Error tracking | ✅ Production monitoring |

---

## PART 3: Web Application Architecture Types

### 3.1 Client-Side Architectures

#### Single-Page Application (SPA)

SPA loads a single HTML page and dynamically updates content without full page reloads.

**Tenanters Decision:** ✅ **Partially — authenticated pages (dashboard, messaging, booking) use client-side rendering within Next.js**

#### Server-Side Rendering (SSR)

SSR renders HTML on the server for each request, improving SEO and initial load.

**Tenanters Decision:** ✅ **YES — Next.js SSR/ISR for public pages (listings, dorm details) for SEO**

#### Progressive Web App (PWA)

PWA adds offline support, installability, and native-like features to web apps.

**Tenanters Decision:** ✅ **YES — Add PWA capabilities for mobile users until native apps are ready**

### 3.2 Server-Side Architectures

Monolith, Microservices, Serverless explanations remain the same, with "Roomy" replaced by "Tenanters" in decisions.

---

## PART 4: Tenanters Architecture Decisions

### 4.1 Architecture Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TENANTERS ARCHITECTURE (Production)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND (Next.js + React + Tailwind CSS)                                  │
│  ─────────────────────────────────────────                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  www.tenanters.com     │  admin.tenanters.com                      │   │
│  │  (Student & Owner UI)  │  (Admin Control Panel)                   │   │
│  │                        │                                          │   │
│  │  Next.js               │  Next.js (or React SPA)                  │   │
│  │  • SSR for listings    │  • SPA (no SEO needed)                   │   │
│  │  • ISR for dorm pages  │  • Dashboard, analytics                  │   │
│  │  • CSR for dashboard   │  • User management                       │   │
│  │  • Tailwind CSS        │  • Dorm verification                     │   │
│  │  • shadcn/ui           │                                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                          │                                                  │
│                          ▼                                                  │
│  BACKEND (AWS)                                                              │
│  ────────────                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     API Gateway (AWS)                               │   │
│  │              Rate limiting, auth, routing                          │   │
│  └──────────────────────┬─────────────────────────────────────────────┘   │
│                         │                                                 │
│    ┌────────────────────┼────────────────────┬──────────────────┐         │
│    │                    │                    │                  │         │
│    ▼                    ▼                    ▼                  ▼         │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │  Node.js │   │  Go Server   │   │  Python      │   │  Lambda      │    │
│  │  (API)   │   │  (Messaging) │   │  (AI/ML)     │   │  (Async)     │    │
│  │          │   │              │   │              │   │              │    │
│  │ Business │   │ WebSocket    │   │ AI matching  │   │ Emails,      │    │
│  │ logic,   │   │ connections, │   │ Personality  │   │ webhooks,    │    │
│  │ CRUD,    │   │ E2E encrypt, │   │ scoring,     │   │ scheduled    │    │
│  │ payments │   │ presence     │   │ recommendations│  │ jobs         │    │
│  └──────────┘   └──────────────┘   └──────────────┘   └──────────────┘    │
│       │              │                    │                  │              │
│       └──────────────┴────────────────────┴──────────────────┘              │
│                          │                                                  │
│                          ▼                                                  │
│  DATA LAYER                                                                 │
│  ──────────                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  ┌──────────────────┐   ┌──────────────────┐                      │   │
│  │  │ Aurora PostgreSQL│   │ ElastiCache      │                      │   │
│  │  │                  │   │ (Redis)          │                      │   │
│  │  │ • All app data   │   │ • Sessions       │                      │   │
│  │  │ • Relationships  │   │ • Caching        │                      │   │
│  │  │ • Transactions   │   │ • Real-time      │                      │   │
│  │  │                  │   │   presence       │                      │   │
│  │  │                  │   │ • Rate limiting  │                      │   │
│  │  └──────────────────┘   └──────────────────┘                      │   │
│  │                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Why This Architecture?

| Requirement | Architecture Choice | Rationale |
|-------------|---------------------|-----------|
| **SEO for listings** | Next.js (SSR/ISR) | Public listing pages must be crawlable by Google |
| **Interactive UI** | React (CSR within Next.js) | App-like experience for booking/messaging |
| **Real-time Messaging** | Go WebSocket server | Instant message delivery, E2E encryption |
| **Voice/Video Calls** | Mobile only (WebRTC) | Not on web — too buggy. Swift/Kotlin handle natively |
| **AI Features** | Python (FastAPI) on Lambda/ECS | Scale AI processing on demand |
| **Payments** | Whish (Codnloc Pay) | Lebanon-focused payment provider |
| **Scale to 1M Users** | AWS (Aurora + ECS + Lambda) | Auto-scaling, global CDN |
| **Security** | Cognito + IAM + WAF | Enterprise-grade authentication and protection |

### 4.3 Technology Choices Explained

#### Why Next.js (not React+Vite SPA)?

| Factor | Next.js | React + Vite (SPA) |
|--------|---------|-------------------|
| **SEO** | ✅ SSR/ISR — full HTML for crawlers | ❌ Empty HTML, bad for SEO |
| **Performance** | ✅ Faster initial load (server-rendered) | ❌ Large JS bundle downloads first |
| **Image Optimization** | ✅ Built-in next/image | ❌ Manual setup |
| **Routing** | ✅ File-based routing | React Router (manual) |
| **API Routes** | ✅ Built-in (/api/*) | ❌ Separate backend |
| **Static Generation** | ✅ ISR for listing pages | ❌ Not possible |
| **Lovable Support** | ❌ Not supported in Lovable | ✅ Lovable uses Vite |

**Decision:** The Lovable prototype uses React+Vite (Lovable's constraint). Production will use **Next.js** for SEO, performance, and built-in features. The dev team will reference the Lovable UI and rebuild it in Next.js.

#### Why Go for Real-time Messaging?

| Factor | Go | Node.js | Rust |
|--------|----|---------|------|
| **Concurrency** | ✅ Goroutines (millions) | ❌ Single-threaded event loop | ✅ Excellent |
| **Memory Usage** | ✅ Low | ❌ Higher (V8 overhead) | ✅ Lowest |
| **WebSocket Handling** | ✅ Excellent | ✅ Good | ✅ Excellent |
| **Learning Curve** | Medium | Low | High |
| **Hiring** | Good | Best | Harder |
| **Compilation** | ✅ Single binary | N/A | ✅ Single binary |

**Decision:** Go for the WebSocket messaging server. It handles hundreds of thousands of concurrent connections with minimal memory. WhatsApp (Erlang) and Discord (Rust/Go) use similar approaches.

#### Why Native Mobile (Not Flutter)?

| Factor | Native (Swift + Kotlin) | Flutter | React Native |
|--------|------------------------|---------|--------------|
| **Performance** | ✅ Best possible | Good (Dart VM) | Okay (JS bridge) |
| **Platform APIs** | ✅ Full access | Limited | Limited |
| **Voice/Video Calls** | ✅ Native WebRTC | ❌ Plugin issues | ❌ Plugin issues |
| **Push Notifications** | ✅ Native (APNs/FCM) | Plugin | Plugin |
| **Camera/Microphone** | ✅ Native | Plugin | Plugin |
| **App Store Review** | ✅ Preferred by Apple | ✅ Fine | ✅ Fine |
| **Dev Cost** | Higher (2 codebases) | Lower (1 codebase) | Lower |
| **UX Quality** | ✅ Best | Good | Adequate |

**Decision:** Native. Voice/video calls, real-time messaging with E2E encryption, and camera access all require deep platform integration. Flutter/RN plugins for these features are unreliable. KMP (Kotlin Multiplatform) shares business logic between iOS and Android to reduce duplication.

---

## PART 5: Software Company Structure

5.1 through 5.3 — Department Overview, Engineering Team Breakdown, Role descriptions — replace "Roomy" with "Tenanters" throughout, same educational diagrams.

---

## PART 6: Feature Production Line

6.1 through 6.2 — The 12 stages, timeline — replace "Roomy" with "Tenanters", "roomylb.com" with "tenanters.com", "staging.roomylb.com" with "staging.tenanters.com" throughout.

---

## PART 7: Complete Technology Stack

### 7.1 Current Stack (Lovable Prototype — Reference Only)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CURRENT STACK (LOVABLE PROTOTYPE)                        │
│              ⚠️  This is NOT the production stack.                          │
│              It serves as a visual specification for the dev team.          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND (Lovable)                                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Framework:     React 18                                             │   │
│  │  Language:      TypeScript 5.x                                       │   │
│  │  Build Tool:    Vite 5.x                                             │   │
│  │  Styling:       Tailwind CSS 3.x                                     │   │
│  │  Components:    shadcn/ui (Radix primitives)                         │   │
│  │  Routing:       React Router 6.x                                     │   │
│  │  Data Fetching: TanStack React Query 5.x                             │   │
│  │  Forms:         React Hook Form + Zod                                │   │
│  │  Animation:     Framer Motion 11.x                                   │   │
│  │  i18n:          i18next (English + Arabic)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BACKEND (Lovable Cloud / Supabase — prototype only)                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Platform:      Supabase (via Lovable Cloud)                         │   │
│  │  Database:      PostgreSQL 15                                        │   │
│  │  Auth:          Supabase Auth                                        │   │
│  │  Functions:     Deno Edge Functions (30+)                            │   │
│  │  Storage:       Supabase Storage                                     │   │
│  │  Realtime:      Supabase Realtime (WebSocket)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Production Stack (What the Dev Team Will Build)

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK (AWS)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND                                                                   │
│  ────────                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Framework:     Next.js 14+ (React 18)                               │   │
│  │  Language:      TypeScript 5.x                                       │   │
│  │  Styling:       Tailwind CSS 3.x                                     │   │
│  │  Components:    shadcn/ui (same as prototype)                        │   │
│  │  Rendering:     SSR/ISR for public pages, CSR for auth'd pages       │   │
│  │  Data Fetching: TanStack React Query + Next.js Server Components    │   │
│  │  Forms:         React Hook Form + Zod                                │   │
│  │  Animation:     Framer Motion                                        │   │
│  │  i18n:          next-intl (English + Arabic + RTL)                   │   │
│  │  Image:         next/image (automatic optimization)                  │   │
│  │  Hosting:       AWS S3 + CloudFront (static export)                  │   │
│  │                 OR Vercel (if Next.js SSR needed)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  BACKEND SERVICES                                                           │
│  ────────────────                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  🔵 API Service (Node.js + Express/Fastify)                         │   │
│  │     • REST API for all CRUD operations                              │   │
│  │     • Business logic (reservations, payments, bookings)             │   │
│  │     • Authentication middleware (Cognito JWT verification)          │   │
│  │     • Runs on: ECS Fargate (Docker container)                       │   │
│  │                                                                     │   │
│  │  🟢 Messaging Service (Go + Gorilla WebSocket)                      │   │
│  │     • Real-time WebSocket connections                               │   │
│  │     • End-to-end encryption (Signal Protocol)                       │   │
│  │     • Message delivery & read receipts                              │   │
│  │     • Online presence & typing indicators                           │   │
│  │     • Runs on: ECS Fargate (Docker container)                       │   │
│  │                                                                     │   │
│  │  🟡 AI Service (Python + FastAPI)                                   │   │
│  │     • Roommate matching algorithm                                   │   │
│  │     • Personality compatibility scoring                             │   │
│  │     • Dorm recommendations                                          │   │
│  │     • Runs on: Lambda (on-demand) or ECS Fargate                    │   │
│  │                                                                     │   │
│  │  ⚡ Serverless Functions (AWS Lambda)                               │   │
│  │     • Email sending (SES)                                           │   │
│  │     • Push notifications (SNS → APNs/FCM)                           │   │
│  │     • Payment webhooks                                              │   │
│  │     • Scheduled jobs (reminders, cleanup)                           │   │
│  │     • Image processing                                              │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  DATA LAYER                                                                 │
│  ──────────                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Database:      AWS Aurora PostgreSQL (managed, auto-scaling)       │   │
│  │  Cache:         AWS ElastiCache Redis                               │   │
│  │  File Storage:  AWS S3                                              │   │
│  │  CDN:           AWS CloudFront                                      │   │
│  │  Search:        OpenSearch (future, for full-text dorm search)      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  INFRASTRUCTURE                                                             │
│  ──────────────                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Containers:    Docker (all services)                               │   │
│  │  Registry:      AWS ECR (Docker image storage)                      │   │
│  │  Orchestration: ECS Fargate → Kubernetes (EKS) at scale             │   │
│  │  API Gateway:   AWS API Gateway (routing, rate limiting, auth)      │   │
│  │  Auth:          AWS Cognito (user management, JWT)                  │   │
│  │  DNS:           Cloudflare                                          │   │
│  │  Domain:        tenanters.com (Cloudflare)                          │   │
│  │  IaC:           Terraform                                           │   │
│  │  CI/CD:         GitHub Actions                                      │   │
│  │  Monitoring:    CloudWatch + Sentry                                 │   │
│  │  Security:      WAF, VPC, IAM, Security Groups                     │   │
│  │  Email Sending: Resend → AWS SES (at scale)                         │   │
│  │  Email Inbox:   Google Workspace                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  MOBILE APPS (Post-Web Launch)                                              │
│  ──────────────────────────────                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  iOS:           Swift + SwiftUI                                     │   │
│  │  Android:       Kotlin + Jetpack Compose                            │   │
│  │  Shared Logic:  Kotlin Multiplatform (KMP)                          │   │
│  │  Voice/Video:   WebRTC (mobile only, NOT on web)                    │   │
│  │  Push:          APNs (iOS) + FCM (Android)                          │   │
│  │  NOT using:     Flutter, React Native                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 AWS Services Required (Complete List)

| AWS Service | Purpose | Category |
|-------------|---------|----------|
| **S3** | File storage (images, uploads, static sites) | Storage |
| **CloudFront** | CDN (global content delivery, DDoS protection) | Networking |
| **ECR** | Docker image registry | Containers |
| **ECS Fargate** | Managed container hosting (no servers to manage) | Compute |
| **Lambda** | Serverless functions (emails, webhooks, cron jobs) | Compute |
| **API Gateway** | REST API routing, rate limiting, auth | Networking |
| **Aurora PostgreSQL** | Managed relational database (auto-scaling) | Database |
| **ElastiCache (Redis)** | In-memory caching, sessions, real-time presence | Database |
| **Cognito** | User authentication (signup, login, OAuth, MFA) | Security |
| **SES** | Transactional email sending | Messaging |
| **SNS** | Push notifications (APNs/FCM), SMS | Messaging |
| **SQS** | Message queues (async job processing) | Messaging |
| **VPC** | Virtual private network (isolate resources) | Networking |
| **IAM** | Access management (service permissions) | Security |
| **WAF** | Web Application Firewall (SQL injection, DDoS) | Security |
| **CloudWatch** | Logging, metrics, alarms | Monitoring |
| **EventBridge** | Event bus (event-driven architecture) | Integration |

**NOT needed:**
- **EC2**: Using ECS Fargate instead (managed containers, no server management)
- **Route 53**: Using Cloudflare for DNS instead
- **DynamoDB**: Using PostgreSQL for all relational data
- **EKS (Kubernetes)**: Not at launch. Migrate from ECS Fargate to EKS when scaling globally (100K+ users)

### 7.4 Docker + Kubernetes Strategy

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CONTAINERIZATION STRATEGY                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: DOCKER + ECS FARGATE (Launch)                                    │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│  Each service is a Docker container:                                        │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │  api-service      │  │  messaging-svc   │  │  ai-service      │          │
│  │  (Node.js)        │  │  (Go)            │  │  (Python)        │          │
│  │                   │  │                  │  │                  │          │
│  │  Dockerfile       │  │  Dockerfile      │  │  Dockerfile      │          │
│  │  → ECR            │  │  → ECR           │  │  → ECR           │          │
│  │  → ECS Fargate    │  │  → ECS Fargate   │  │  → ECS Fargate   │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                             │
│  Benefits:                                                                  │
│  • No server management (Fargate is serverless containers)                 │
│  • Auto-scaling per service                                                │
│  • Pay per vCPU/memory used                                                │
│  • Simple deployment via GitHub Actions                                    │
│                                                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│                                                                             │
│  PHASE 2: DOCKER + KUBERNETES/EKS (At Scale — 100K+ users)                 │
│  ═════════════════════════════════════════════════════════                  │
│                                                                             │
│  Migrate to EKS when:                                                       │
│  • Need fine-grained auto-scaling policies                                 │
│  • Multiple regions worldwide                                              │
│  • Complex service mesh requirements                                       │
│  • Need Kubernetes ecosystem (Helm charts, operators)                      │
│                                                                             │
│  The Docker images are THE SAME — only orchestration changes.               │
│  ECS Fargate → EKS migration is straightforward.                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 8: Three-Subdomain Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TENANTERS SUBDOMAIN ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        CLOUDFLARE DNS                                  │  │
│  │                     (tenanters.com — owned)                           │  │
│  └───────────────────────────┬───────────────────────────────────────────┘  │
│                              │                                               │
│         ┌────────────────────┼────────────────────┐                          │
│         │                    │                    │                          │
│         ▼                    ▼                    ▼                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │  waitlist.    │    │  www.        │    │  admin.      │                   │
│  │  tenanters.com│    │  tenanters.com│   │  tenanters.com│                  │
│  │              │    │              │    │              │                   │
│  │  VERCEL      │    │  AWS         │    │  AWS         │                   │
│  │              │    │  S3 +        │    │  S3 +        │                   │
│  │  Pre-launch  │    │  CloudFront  │    │  CloudFront  │                   │
│  │  waitlist     │    │              │    │              │                   │
│  │  collection   │    │  Main app   │    │  Admin-only  │                   │
│  │              │    │  (students,  │    │  dashboard   │                   │
│  │  APIs:        │    │  owners,    │    │              │                   │
│  │  • Mailchimp  │    │  public)    │    │  Protected   │                   │
│  │  • Google     │    │              │    │  by admin    │                   │
│  │    Workspace  │    │              │    │  auth        │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                              │                                               │
│                              ▼                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                    SHARED BACKEND (AWS)                              │  │
│  │                                                                       │  │
│  │  All three frontends connect to the SAME backend:                    │  │
│  │  • API Gateway → Node.js API Service (ECS Fargate)                   │  │
│  │  • API Gateway → Go Messaging Service (ECS Fargate)                  │  │
│  │  • API Gateway → Python AI Service (Lambda/ECS)                      │  │
│  │  • Aurora PostgreSQL (shared database)                               │  │
│  │  • ElastiCache Redis (shared cache)                                  │  │
│  │  • S3 (shared file storage)                                          │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Root Domain Redirect Logic

```text
PRE-LAUNCH (Current State):
┌─────────────────────────────────────────────────────────────────────────────┐
│  tenanters.com → REDIRECT (301) → waitlist.tenanters.com                    │
│  www.tenanters.com → REDIRECT (301) → waitlist.tenanters.com                │
└─────────────────────────────────────────────────────────────────────────────┘

POST-LAUNCH (After www.tenanters.com is live):
┌─────────────────────────────────────────────────────────────────────────────┐
│  tenanters.com → REDIRECT (301) → www.tenanters.com                         │
│  waitlist.tenanters.com → "We're live!" page OR redirect to www             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 9: Deployment Strategy

### 9.1 Waitlist (Vercel — No AWS Needed)

The waitlist is simple enough that Vercel handles it perfectly. No need for AWS.

| Component | Technology |
|-----------|------------|
| **Frontend** | React + Vite (or Next.js) — already built in Lovable |
| **Hosting** | Vercel |
| **APIs** | 2 only: Mailchimp (signups) + Google Workspace (contact form) |
| **Domain** | waitlist.tenanters.com (CNAME to Vercel) |
| **Timeline** | Ready to deploy within 1 week |

The waitlist website sample is already complete in a separate Lovable project. The dev team can:
1. See the published link
2. Rebuild it from scratch (simple — 1 week)
3. Connect 2 RESTful APIs (Mailchimp + Google Workspace)
4. Set up rate limiting on the APIs
5. Deploy on Vercel

### 9.2 Main App + Admin (AWS)

Both www.tenanters.com and admin.tenanters.com will be deployed on AWS from day 1:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT ARCHITECTURE (AWS)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND DEPLOYMENT                                                        │
│  ────────────────────                                                       │
│  Next.js → Build → Static export (or Vercel for SSR)                       │
│         → Upload to S3                                                      │
│         → Serve via CloudFront CDN                                          │
│         → Custom domain (www.tenanters.com)                                │
│                                                                             │
│  BACKEND DEPLOYMENT                                                         │
│  ───────────────────                                                        │
│  Docker images → Push to ECR                                                │
│               → Deploy to ECS Fargate                                       │
│               → Route via API Gateway                                       │
│               → Custom domain (api.tenanters.com)                           │
│                                                                             │
│  CI/CD PIPELINE (GitHub Actions)                                            │
│  ────────────────────────────────                                           │
│  Push to main → Build → Test → Docker build → Push to ECR                  │
│              → Deploy to ECS → Invalidate CloudFront cache                 │
│              → Run database migrations                                     │
│              → Notify team (Slack)                                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 10: Migration Strategy (Educational Reference)

> **Note:** Since the dev team is building directly on AWS from scratch (not migrating from the Lovable/Supabase prototype), this section serves as educational reference for understanding migration patterns in general.

Migration diagrams and educational content, replace "Roomy" with "Tenanters".

---

## PART 11: Implementation Timeline

### 11.1 Revised Timeline

```text
╔═════════════════════════════════════════════════════════════════════════════╗
║              TENANTERS IMPLEMENTATION TIMELINE (REVISED)                    ║
╚═════════════════════════════════════════════════════════════════════════════╝

PHASE 0: LOVABLE PROTOTYPE (Current — Ongoing)
═══════════════════════════════════════════════
• Complete frontend UI/UX for all features
• Admin control panel at /admin
• All 50+ routes working with prototype backend
• Serves as visual specification for dev team
• OUTPUT: Published link + codebase for reference

PHASE 1: WAITLIST LAUNCH (Week 1)
═════════════════════════════════
• Deploy waitlist.tenanters.com on Vercel
• Connect Mailchimp API (email/phone collection)
• Connect Google Workspace API (contact form)
• Set up rate limiting
• Start marketing

PHASE 2: HIRE DEV TEAM + AWS SETUP (Weeks 2-6)
══════════════════════════════════════════════
• Hire development team / agency
• Share Lovable prototype links for reference
• Set up AWS account and infrastructure (Terraform)
• Configure VPC, subnets, security groups
• Set up Aurora PostgreSQL
• Configure S3, CloudFront, ECR
• Set up API Gateway + Cognito
• CI/CD pipelines (GitHub Actions)

PHASE 3: REBUILD CORE (Weeks 7-16)
══════════════════════════════════
• Rebuild frontend in Next.js (reference Lovable prototype)
• Build Node.js API service (ECS Fargate)
• Implement authentication (Cognito)
• Student/Owner profile management
• Dorm listing CRUD + search + filters
• Booking system
• Payment integration (Whish)

PHASE 4: ADVANCED FEATURES (Weeks 17-24)
═══════════════════════════════════════
• Build Go messaging server (WebSocket, E2E encryption)
• Build Python AI service (matching algorithm)
• Admin dashboard
• Email notifications (SES)
• Push notifications
• i18n (Arabic + RTL)

PHASE 5: TESTING + LAUNCH (Weeks 25-28)
═══════════════════════════════════════
• Comprehensive QA
• Security audit
• Load testing
• Beta users
• Production launch of www.tenanters.com

PHASE 6: MOBILE APPS (Weeks 29-44)
══════════════════════════════════
• KMP shared module setup
• iOS app (Swift/SwiftUI)
• Android app (Kotlin/Jetpack Compose)
• Voice/Video calls (WebRTC — mobile only)
• App Store + Play Store submission

PHASE 7: SCALE (Weeks 45+)
═══════════════════════════
• ECS Fargate → Kubernetes (EKS) migration
• Multi-region deployment
• Advanced AI features
• Analytics + monitoring refinement
```

---

## PART 12: DevOps Engineer Hiring Guide

5.1 through 5.3 — Department Overview, Engineering Team Breakdown, Role descriptions — replace "Roomy" with "Tenanters" throughout, same educational diagrams.

---

## PART 13: Lovable's Role (Prototype Only)

### 13.1 What Lovable Provides

Lovable is being used as a **rapid prototyping tool** to build the complete frontend UI/UX. The output serves as a **visual specification** — a working reference that shows the dev team exactly what to build.

| What Lovable Does | Output | How Dev Team Uses It |
|-------------------|--------|---------------------|
| Build all React components | Working UI | Reference for component design |
| Create responsive layouts | Mobile + desktop views | Reference for responsive breakpoints |
| Wire up prototype backend | Working data flow | Reference for API contract design |
| Implement all user flows | Clickable prototype | Reference for user experience |
| Admin control panel | Complete dashboard | Reference for admin features |

### 13.2 What Lovable is NOT Used For

| NOT Used For | Why | Who Does It |
|-------------|-----|-------------|
| Production deployment | Lovable uses Vite+React, not Next.js | Dev team rebuilds with Next.js |
| Production backend | Lovable uses Supabase | Dev team builds on AWS |
| AWS infrastructure | Lovable can't provision cloud | DevOps engineer |
| Mobile apps | Lovable is web-only | Mobile dev team (Swift/Kotlin) |
| CI/CD pipelines | Lovable has its own deploy | DevOps configures GitHub Actions |
| Production database | Schema will be redesigned | Backend team designs clean schema |

### 13.3 The Handoff Process

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    LOVABLE → DEV TEAM HANDOFF                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WHAT THE DEV TEAM RECEIVES:                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Published website URL (tenanters.lovable.app)                   │   │
│  │     → Click through every page, see every flow                      │   │
│  │                                                                     │   │
│  │  2. This architecture document (plan2.md)                           │   │
│  │     → Complete technical specification + decisions                  │   │
│  │                                                                     │   │
│  │  3. Source code (GitHub)                                             │   │
│  │     → React components, styling, data structures                    │   │
│  │     → NOT to be deployed — reference only                           │   │
│  │                                                                     │   │
│  │  4. Database schema (current Supabase tables)                       │   │
│  │     → Starting point for production schema design                  │   │
│  │     → Will be redesigned/normalized for production                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  WHAT THE DEV TEAM BUILDS FROM SCRATCH:                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  1. Next.js frontend (SSR/ISR for SEO)                              │   │
│  │  2. Node.js API service (Express/Fastify)                           │   │
│  │  3. Go messaging server (WebSocket)                                 │   │
│  │  4. Python AI service (FastAPI)                                     │   │
│  │  5. AWS infrastructure (Terraform)                                  │   │
│  │  6. CI/CD pipelines (GitHub Actions)                               │   │
│  │  7. Clean database schema (Aurora PostgreSQL)                       │   │
│  │  8. Mobile apps (Swift + Kotlin)                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## PART 14: AWS Education

14.1 through 14.3 — AWS Services Overview, diagrams — replace "Roomy" with "Tenanters" throughout, same educational content.

---

## PART 15: Cost Estimates — Complete Breakdown

> **Methodology:** All estimates are in USD. Costs are organized by growth phase. "Launch" = first 3-6 months (0-1,000 users). "Growth" = 1K-50K users. "Scale" = 50K+ users. Prices reflect March 2026 public pricing.

---

### 15.1 Domain & DNS — Cloudflare

| Item | Cost | Billing | Notes |
|------|------|---------|-------|
| Domain registration (tenanters.com) | $10-12/yr | Annual | .com via Cloudflare Registrar (at-cost, no markup) |
| Cloudflare Free plan | $0 | — | DNS, basic DDoS protection, SSL, CDN |
| Cloudflare Pro plan (recommended) | $20/mo | Monthly | WAF, image optimization, analytics, better DDoS |
| Cloudflare Business plan (scale) | $200/mo | Monthly | Custom WAF rules, 100% SLA, priority support |

**Recommendation:**
- **Launch:** Free plan ($0/mo) — DNS + basic CDN is sufficient
- **Growth:** Pro plan ($20/mo) — WAF and analytics
- **Scale:** Business plan ($200/mo) — SLA guarantees

| Phase | Monthly | Annual |
|-------|---------|--------|
| Launch | **$1/mo** (domain amortized) | **$12/yr** |
| Growth | **$21/mo** | **$252/yr** |
| Scale | **$201/mo** | **$2,412/yr** |

---

### 15.2 Email Inbox — Google Workspace

| Item | Cost | Billing | Notes |
|------|------|---------|-------|
| Business Starter (per user) | $7.20/user/mo | Monthly (or $6/user/mo annual) | 30 GB storage, custom email, Google Meet |
| Business Standard (per user) | $14.40/user/mo | Monthly (or $12/user/mo annual) | 2 TB storage, recording, app management |

**Current setup:** 1 admin user + 8 group aliases (free — aliases don't count as users).

| Phase | Users | Plan | Monthly | Annual |
|-------|-------|------|---------|--------|
| Launch | 1 user | Starter | **$7.20/mo** | **$72/yr** (annual billing: $6/mo = $72) |
| Growth | 3-5 users | Starter | **$21.60-$36/mo** | **$216-$360/yr** |
| Scale | 10-20 users | Standard | **$144-$288/mo** | **$1,440-$2,880/yr** |

**What you get:** info@, support@, contact@, hr@, partnerships@, press@, security@, no-reply@ — all as free group aliases under 1 paid user account.

---

### 15.3 Transactional Email — Resend → AWS SES

#### Resend (Launch & Growth phases)

| Plan | Price | Emails/month | Emails/day | Custom domain | Notes |
|------|-------|-------------|------------|---------------|-------|
| Free | $0 | 3,000 | 100 | 1 | Single sender domain |
| Pro | $20/mo | 50,000 | — | Unlimited | Team members, webhooks, analytics |
| Business | $90/mo | 200,000 | — | Unlimited | Dedicated IP, priority support |
| Enterprise | Custom | 500K+ | — | Unlimited | SLA, dedicated account manager |

#### AWS SES (Scale phase — 100K+ emails/month)

| Item | Cost | Notes |
|------|------|-------|
| First 62,000 emails/mo (from EC2) | $0 | Free if sent from EC2/Lambda |
| Additional emails | $0.10 per 1,000 | Extremely cheap at volume |
| Dedicated IP | $24.95/mo per IP | Better deliverability at high volume |
| 100K emails/month | ~$3.80/mo | vs $90/mo on Resend |
| 500K emails/month | ~$43.80/mo | vs custom pricing on Resend |
| 1M emails/month | ~$93.80/mo | Massive savings |

**Recommendation & Cost by Phase:**

| Phase | Service | Emails/mo | Monthly Cost |
|-------|---------|-----------|-------------|
| Launch (0-1K users) | Resend Free | < 3,000 | **$0/mo** |
| Growth (1K-10K users) | Resend Pro | 10K-50K | **$20/mo** |
| Growth (10K-50K users) | Resend Business | 50K-200K | **$90/mo** |
| Scale (50K+ users) | AWS SES | 200K-1M+ | **$4-$94/mo** |

---

### 15.4 Marketing Email — Mailchimp

| Plan | Price | Contacts | Emails/mo | Notes |
|------|-------|----------|-----------|-------|
| Free | $0 | 500 | 1,000 | Basic templates, 1 audience |
| Essentials | $13/mo | 500 | 5,000 | A/B testing, email scheduling |
| Essentials (5K contacts) | $67/mo | 5,000 | 50,000 | Scales with contacts |
| Essentials (10K contacts) | $100/mo | 10,000 | 100,000 | |
| Standard | $20/mo | 500 | 6,000 | Automations, predictive insights |
| Standard (5K contacts) | $100/mo | 5,000 | 60,000 | |
| Standard (10K contacts) | $135/mo | 10,000 | 120,000 | |

**Recommendation:**

| Phase | Plan | Contacts | Monthly Cost |
|-------|------|----------|-------------|
| Pre-launch (waitlist) | Free | < 500 | **$0/mo** |
| Launch | Essentials | 500-2K | **$13-$35/mo** |
| Growth | Standard | 5K-10K | **$100-$135/mo** |
| Scale | Standard | 25K-50K | **$260-$400/mo** |

---

### 15.5 Hosting — Vercel (Waitlist Only)

| Plan | Price | Notes |
|------|-------|-------|
| Hobby (free) | $0 | 100 GB bandwidth, 1 project, no commercial use |
| Pro | $20/mo per member | 1 TB bandwidth, commercial use, analytics |

**Recommendation:**

| Phase | Plan | Monthly Cost |
|-------|------|-------------|
| Pre-launch & Launch | Pro (1 member) | **$20/mo** |
| Growth & Scale | Pro (1 member) | **$20/mo** (waitlist stays simple) |

---

### 15.6 AWS Infrastructure — Complete Breakdown

This is the largest cost center. AWS hosts the main app (www.tenanters.com), admin panel (admin.tenanters.com), API (api.tenanters.com), and all backend services.

#### 15.6.1 Compute — ECS Fargate (Containerized Services)

| Service | vCPU | Memory | Tasks | Cost/hr | Monthly |
|---------|------|--------|-------|---------|---------|
| Node.js API | 0.5 vCPU | 1 GB | 2 (HA) | $0.025/task | ~$36/mo |
| Go WebSocket Server | 0.25 vCPU | 0.5 GB | 2 (HA) | $0.013/task | ~$19/mo |
| Python AI Service | 0.5 vCPU | 1 GB | 1 | $0.025/task | ~$18/mo |
| **ECS Total (Launch)** | | | | | **~$73/mo** |

At scale (auto-scaling):
| Phase | Tasks | Monthly |
|-------|-------|---------|
| Launch | 5 tasks | **$73/mo** |
| Growth | 10-20 tasks | **$150-$300/mo** |
| Scale | 30-60 tasks | **$450-$900/mo** |

#### 15.6.2 Database — Aurora PostgreSQL Serverless v2

| Config | ACU Range | Storage | Monthly |
|--------|-----------|---------|---------|
| Launch | 0.5-2 ACU | 20 GB | **$55-$80/mo** |
| Growth | 2-8 ACU | 100 GB | **$150-$350/mo** |
| Scale | 8-32 ACU | 500 GB+ | **$500-$1,500/mo** |

Breakdown:
- ACU pricing: $0.12/ACU-hour
- Storage: $0.10/GB/month
- I/O: $0.20 per 1M requests
- Backups: $0.021/GB/month (free up to DB size)

#### 15.6.3 Caching — ElastiCache (Redis)

| Config | Node Type | Monthly |
|--------|-----------|---------|
| Launch | cache.t4g.micro (single) | **$12/mo** |
| Growth | cache.t4g.small (2 nodes, HA) | **$48/mo** |
| Scale | cache.r7g.large (cluster) | **$200-$500/mo** |

#### 15.6.4 CDN & Frontend Hosting — CloudFront + S3

| Item | Free Tier | After Free Tier | Notes |
|------|-----------|-----------------|-------|
| CloudFront | 1 TB/mo free (first year) | $0.085/GB (US/EU) | Serves frontend + static assets |
| S3 storage | 5 GB free | $0.023/GB/mo | Next.js build output, images |
| S3 requests | 20K GET free | $0.0004/1K GET | |

| Phase | Bandwidth | Monthly |
|-------|-----------|---------|
| Launch | < 100 GB | **$5-$10/mo** (mostly free tier) |
| Growth | 500 GB-1 TB | **$40-$85/mo** |
| Scale | 2-5 TB | **$170-$425/mo** |

#### 15.6.5 API Gateway

| Item | Cost | Notes |
|------|------|-------|
| HTTP API | $1.00 per 1M requests | Cheaper, good for REST |
| WebSocket API | $1.00 per 1M messages | For real-time features |
| Data transfer | $0.09/GB | |

| Phase | Requests/mo | Monthly |
|-------|------------|---------|
| Launch | < 10M | **$10/mo** |
| Growth | 10-50M | **$10-$50/mo** |
| Scale | 50-200M | **$50-$200/mo** |

#### 15.6.6 Authentication — Cognito

| Item | Cost | Notes |
|------|------|-------|
| First 50,000 MAUs | $0 | Free tier (monthly active users) |
| 50,001-100,000 MAUs | $0.0055/MAU | |
| 100,001+ MAUs | $0.0046/MAU | |

| Phase | MAUs | Monthly |
|-------|------|---------|
| Launch | < 1,000 | **$0/mo** |
| Growth | 5K-50K | **$0/mo** (still free tier) |
| Scale | 50K-200K | **$275-$825/mo** |

#### 15.6.7 File Storage — S3 (User Uploads: Photos, Documents)

| Item | Cost | Notes |
|------|------|-------|
| Storage | $0.023/GB/mo | Standard tier |
| PUT/POST requests | $0.005/1K | Uploads |
| GET requests | $0.0004/1K | Downloads/views |
| Data transfer out | $0.09/GB | Via CloudFront is cheaper |

| Phase | Storage | Monthly |
|-------|---------|---------|
| Launch | 10 GB | **$1/mo** |
| Growth | 100 GB | **$5-$10/mo** |
| Scale | 1 TB | **$30-$50/mo** |

#### 15.6.8 Monitoring & Logging — CloudWatch

| Item | Cost | Notes |
|------|------|-------|
| Basic monitoring | $0 | 5-min intervals, 10 metrics |
| Detailed monitoring | $3/instance/mo | 1-min intervals |
| Log ingestion | $0.50/GB | Application logs |
| Log storage | $0.03/GB/mo | Retention |
| Dashboards | $3/dashboard/mo | Custom dashboards |

| Phase | Monthly |
|-------|---------|
| Launch | **$10-$20/mo** |
| Growth | **$30-$60/mo** |
| Scale | **$80-$200/mo** |

#### 15.6.9 Other AWS Services

| Service | Purpose | Launch | Growth | Scale |
|---------|---------|--------|--------|-------|
| **ACM** (SSL Certificates) | HTTPS for all subdomains | $0 | $0 | $0 |
| **Route 53** (if used) | DNS hosting (alternative to Cloudflare) | N/A | N/A | N/A |
| **WAF** | Web Application Firewall | $5/mo + $1/rule | $10-$20/mo | $20-$50/mo |
| **Secrets Manager** | API keys, DB credentials | $0.40/secret/mo | $2-$5/mo | $5-$10/mo |
| **ECR** (Container Registry) | Docker image storage | $1/mo | $2-$5/mo | $5-$10/mo |
| **Lambda** (serverless functions) | Cron jobs, webhooks, image processing | $0 (free tier) | $1-$5/mo | $5-$20/mo |
| **SQS** (Message Queue) | Async job processing | $0 (free tier) | $1-$2/mo | $5-$10/mo |
| **SNS** (Push Notifications) | Mobile push via APNs/FCM | $0 (free tier) | $1-$5/mo | $5-$20/mo |

#### 15.6.10 AWS Total by Phase

| Component | Launch | Growth | Scale |
|-----------|--------|--------|-------|
| ECS Fargate (compute) | $73 | $150-$300 | $450-$900 |
| Aurora PostgreSQL (database) | $55-$80 | $150-$350 | $500-$1,500 |
| ElastiCache Redis (caching) | $12 | $48 | $200-$500 |
| CloudFront + S3 (CDN/hosting) | $5-$10 | $40-$85 | $170-$425 |
| API Gateway | $10 | $10-$50 | $50-$200 |
| Cognito (auth) | $0 | $0 | $275-$825 |
| S3 (user uploads) | $1 | $5-$10 | $30-$50 |
| CloudWatch (monitoring) | $10-$20 | $30-$60 | $80-$200 |
| WAF + Secrets + ECR + misc | $7 | $15-$35 | $40-$120 |
| **AWS TOTAL** | **$173-$213/mo** | **$448-$940/mo** | **$1,795-$4,720/mo** |

---

### 15.7 Mobile App — Apple & Google Developer Accounts

| Item | Cost | Billing | Notes |
|------|------|---------|-------|
| Apple Developer Program | $99/yr | Annual | Required to publish to App Store |
| Google Play Developer | $25 (one-time) | One-time | Lifetime access to publish |

| Phase | Annual Cost |
|-------|------------|
| All phases | **$99/yr + $25 one-time** |

---

### 15.8 Development Tools & Software

| Tool | Cost | Purpose | Notes |
|------|------|---------|-------|
| GitHub (Team) | $4/user/mo | Code repository, CI/CD | Free for public repos |
| GitHub Actions | $0 (2,000 min/mo free) | CI/CD pipelines | Paid: $0.008/min Linux |
| Figma (Professional) | $15/editor/mo | UI/UX design | Free for 3 files |
| Sentry (error tracking) | $0 (free tier) | Error monitoring | 5K errors/mo free |
| Postman (free) | $0 | API testing | Free for individuals |
| Docker Desktop | $0 | Local development | Free for small business |

| Phase | Team Size | Monthly Cost |
|-------|-----------|-------------|
| Launch | 2-3 devs | **$8-$12/mo** (GitHub) + **$15/mo** (Figma) = **$23-$27/mo** |
| Growth | 5-8 devs | **$20-$32/mo** + **$30-$45/mo** = **$50-$77/mo** |
| Scale | 10-15 devs | **$40-$60/mo** + **$60-$90/mo** = **$100-$150/mo** |

---

### 15.9 Third-Party APIs & Services (Future)

| Service | Purpose | Free Tier | Paid | When Needed |
|---------|---------|-----------|------|-------------|
| Google Maps API | Map views, geocoding | $200/mo credit | $7/1K loads | Growth phase |
| Stripe | Payment processing | No monthly fee | 2.9% + $0.30/txn | When payments launch |
| Twilio (SMS) | Phone verification | Free trial credits | $0.0079/SMS | Growth phase |
| OpenAI API | AI matching enhancement | — | $0.002-$0.06/1K tokens | If using GPT for matching |

---

### 15.10 GRAND TOTAL — All Services Combined

#### Launch Phase (0-1,000 users, months 1-6)

| Service | Monthly | Annual |
|---------|---------|--------|
| Cloudflare (Free) | $1 | $12 |
| Google Workspace (1 user) | $7 | $72 |
| Resend (Free) | $0 | $0 |
| Mailchimp (Free/Essentials) | $0-$13 | $0-$156 |
| Vercel (Pro, 1 member) | $20 | $240 |
| AWS Infrastructure | $173-$213 | $2,076-$2,556 |
| Apple Developer | $8 | $99 |
| Google Play Developer | $2 (amortized) | $25 (one-time) |
| Dev Tools (GitHub + Figma) | $23-$27 | $276-$324 |
| **LAUNCH TOTAL** | **$234-$291/mo** | **$2,800-$3,484/yr** |

#### Growth Phase (1K-50K users, months 6-18)

| Service | Monthly | Annual |
|---------|---------|--------|
| Cloudflare (Pro) | $20 | $240 |
| Google Workspace (3-5 users) | $22-$36 | $264-$432 |
| Resend (Pro/Business) | $20-$90 | $240-$1,080 |
| Mailchimp (Standard) | $100-$135 | $1,200-$1,620 |
| Vercel (Pro) | $20 | $240 |
| AWS Infrastructure | $448-$940 | $5,376-$11,280 |
| Apple Developer | $8 | $99 |
| Dev Tools | $50-$77 | $600-$924 |
| Google Maps API | $0-$50 | $0-$600 |
| **GROWTH TOTAL** | **$688-$1,376/mo** | **$8,259-$16,515/yr** |

#### Scale Phase (50K+ users, months 18+)

| Service | Monthly | Annual |
|---------|---------|--------|
| Cloudflare (Business) | $200 | $2,400 |
| Google Workspace (10-20 users) | $144-$288 | $1,728-$3,456 |
| AWS SES (replaces Resend) | $4-$94 | $48-$1,128 |
| Mailchimp (Standard, large list) | $260-$400 | $3,120-$4,800 |
| Vercel (Pro) | $20 | $240 |
| AWS Infrastructure | $1,795-$4,720 | $21,540-$56,640 |
| Apple Developer | $8 | $99 |
| Dev Tools | $100-$150 | $1,200-$1,800 |
| Google Maps API | $50-$200 | $600-$2,400 |
| Stripe fees | Variable (2.9% + $0.30/txn) | Depends on revenue |
| **SCALE TOTAL** | **$2,581-$6,080/mo** | **$30,975-$72,963/yr** |

---

### 15.11 Cost Comparison: What We Avoided

| Alternative | Their Cost | Our Choice | Our Cost | Savings |
|-------------|-----------|------------|----------|---------|
| Namecheap + separate CDN | $15/yr + $20/mo CDN | Cloudflare (registrar + CDN + DNS) | $12/yr + $0-$20/mo | Simpler, cheaper, integrated |
| Zoho Mail | $1-$3/user/mo | Google Workspace | $6-$7/user/mo | More expensive but 10x better: Drive, Meet, Calendar, ecosystem |
| SendGrid (transactional) | $20-$90/mo | Resend → AWS SES | $0-$94/mo | Better DX with Resend, cheapest at scale with SES |
| Heroku (hosting) | $25-$250/mo | AWS ECS Fargate | $73-$900/mo | More complex but infinitely more scalable |
| Firebase (backend) | $25-$250/mo | AWS (Aurora + Cognito + S3) | $70-$2,000/mo | Full control, no vendor lock-in, enterprise-grade |
| Supabase (production) | $25-$599/mo | AWS Aurora + custom API | $55-$1,500/mo | Full control, custom schema, no RLS limitations |

---

### 15.12 Key Cost Insights

1. **AWS is ~70% of total cost** — this is normal for a production SaaS platform
2. **Biggest cost drivers at scale:** Database (Aurora) and Compute (ECS) — optimize queries and use caching (Redis) to keep these low
3. **Free tiers save ~$100/mo at launch** — Cognito, SES from EC2, Lambda, SQS, SNS, CloudFront (1st year) all have generous free tiers
4. **Resend → SES migration saves $800+/yr** at 200K emails/month
5. **Google Workspace is a fixed cost** — doesn't scale with users, only with team size
6. **Mailchimp is the fastest-growing cost** — consider alternatives (Loops, Brevo) if contact list exceeds 25K
7. **Stripe fees are pass-through** — 2.9% + $0.30 per transaction, not a fixed cost; factor into pricing model

---

## PARTS 16-23

Database Schema, Security, CI/CD, Airbnb Case Study, Event-Driven Architecture, Migration Strategies, Advanced Infrastructure, Production-Ready Backend — replace all "Roomy" with "Tenanters", "roomylb.com" with "tenanters.com", "app.roomylb.com" with "www.tenanters.com", "admin.roomylb.com" with "admin.tenanters.com" throughout.

---

## PART 24: Waitlist Project Technical Specification

### 24.1 Project Identity & Context

| Property | Value |
|----------|-------|
| **Project Name** | Tenanters Waitlist |
| **Lovable Preview** | tenanterswaitlist3.lovable.app |
| **Future Domain** | waitlist.tenanters.com |
| **Hosting** | Vercel (no need for AWS) |
| **Status** | Frontend Complete, Backend APIs Pending |
| **Tech Stack** | React + Vite + TypeScript + Tailwind CSS |

### 24.2 Required Backend Integrations (2 APIs only)

| Integration | Purpose | Flow | Notes |
|-------------|---------|------|-------|
| **Mailchimp API** | Waitlist signups | Hero input → API → Mailchimp audience | Collect email and/or phone number |
| **Google Workspace API** | Contact form emails | Contact form → API → contact@tenanters.com | Via Google Workspace group inbox |

**Rate limiting required on both APIs.**

**Email setup:** Google Workspace is configured with the following group email aliases:
- contact@tenanters.com (Contact group)
- hr@tenanters.com (HR group)
- info@tenanters.com (Info group)
- no-reply@tenanters.com (No Reply group)
- partnerships@tenanters.com (Partnerships group)
- press@tenanters.com (Press group)
- security@tenanters.com (Security group)
- support@tenanters.com (Support group)

### 24.3 Deployment Plan

1. Dev team receives published Lovable link
2. Rebuild from scratch (React or Next.js — simple site, either works)
3. Connect Mailchimp API for waitlist signups
4. Connect Google Workspace API for contact form (or use Resend to send to contact@tenanters.com)
5. Set up rate limiting on APIs
6. Deploy to Vercel
7. Point waitlist.tenanters.com CNAME to Vercel
8. **Timeline: ~1 week**

24.4 through 24.5 — Key Components, Routes — replace "Roomy" with "Tenanters".

---

## PART 25: Email Infrastructure Strategy

### 25.1 Email Types and Services

| Email Type | Service | Purpose | Example |
|------------|---------|---------|---------|
| **Business Inbox** | Google Workspace | Send/receive manual emails | info@tenanters.com, support@tenanters.com |
| **Transactional API** | Resend → AWS SES | Automated app notifications | "Your booking is confirmed" |
| **Marketing** | Mailchimp | Campaigns, newsletters, waitlist | "Tenanters is launching!" |

### 25.2 Google Workspace Setup (✅ Complete)

Google Workspace is already configured with:
- **Plan:** Business Starter ($6/user/month)
- **Domain:** tenanters.com
- **Group email aliases configured:**
  - contact@tenanters.com
  - hr@tenanters.com
  - info@tenanters.com
  - no-reply@tenanters.com
  - partnerships@tenanters.com
  - press@tenanters.com
  - security@tenanters.com
  - support@tenanters.com

### 25.3 Transactional Email Decision

**Option A: Resend (Recommended for Launch)**
- Free tier: 3,000 emails/month
- API-based sending
- Great developer experience
- Easy setup

**Option B: Google Workspace SMTP**
- Already have no-reply@tenanters.com alias
- ❌ **Limit: 500 emails/day** — NOT suitable for app notifications at scale
- ✅ Fine for very low volume (contact form responses)

**Option C: AWS SES (Recommended at Scale)**
- $0.10 per 1,000 emails
- Cheapest at high volume
- Full AWS integration

**Recommendation:**
- **Launch:** Use Resend (free tier covers initial needs)
- **Scale (100K+ emails/month):** Migrate to AWS SES
- **Contact form on waitlist:** Can use Google Workspace SMTP directly (low volume, < 500/day)

### 25.4 Email Flow Architecture

```text
CONTACT FORM FLOW (waitlist.tenanters.com/contact)
───────────────────────────────────────────────
User fills form → Frontend validates (Zod)
                       │
                       ▼
              API endpoint (Vercel serverless or Resend API)
                       │
                       ▼
              contact@tenanters.com (Google Workspace inbox)


WAITLIST SIGNUP FLOW (waitlist.tenanters.com)
─────────────────────────────────────────────
User enters email/phone → Frontend validates
                       │
                       ▼
              API endpoint
                       │
                       ▼
              Mailchimp API (add to audience list)


APP TRANSACTIONAL EMAILS (www.tenanters.com)
─────────────────────────────────────────────
App event (booking, payment) → Backend Lambda
                       │
                       ▼
              Resend API (or AWS SES)
                       │
                       ▼
              User's email inbox
              From: no-reply@tenanters.com
```

---

## PART 26: Domain & DNS Infrastructure

### 26.1 Domain Strategy

| Domain | Purpose | Status | Registrar |
|--------|---------|--------|-----------|
| `tenanters.com` | Root domain | ✅ Owned | Cloudflare |
| `waitlist.tenanters.com` | Pre-launch waitlist | Pending CNAME to Vercel |
| `www.tenanters.com` | Main user application | Pending (AWS CloudFront) |
| `admin.tenanters.com` | Internal admin panel | Pending (AWS CloudFront) |
| `api.tenanters.com` | Backend API | Pending (AWS API Gateway) |

### 26.2 DNS Records (Cloudflare)

```text
DNS RECORDS TO CONFIGURE
════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  TYPE    NAME        VALUE                                   TTL    PROXY   │
├─────────────────────────────────────────────────────────────────────────────┤
│  A       @           Redirect Rule → www.tenanters.com       Auto   -       │
│  CNAME   www         d1234.cloudfront.net (AWS)              Auto   ✗ (DNS) │
│  CNAME   waitlist    cname.vercel-dns.com                    Auto   ✗ (DNS) │
│  CNAME   admin       d5678.cloudfront.net (AWS)              Auto   ✗ (DNS) │
│  CNAME   api         abc123.execute-api.us-east-1.aws.com    Auto   ✗ (DNS) │
├─────────────────────────────────────────────────────────────────────────────┤
│  MX RECORDS (Google Workspace — already configured)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  MX      @           ASPMX.L.GOOGLE.COM                      Auto   1       │
│  MX      @           ALT1.ASPMX.L.GOOGLE.COM                 Auto   5       │
│  MX      @           ALT2.ASPMX.L.GOOGLE.COM                 Auto   5       │
│  MX      @           ALT3.ASPMX.L.GOOGLE.COM                 Auto   10      │
│  MX      @           ALT4.ASPMX.L.GOOGLE.COM                 Auto   10      │
├─────────────────────────────────────────────────────────────────────────────┤
│  EMAIL AUTHENTICATION                                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  TXT     @           v=spf1 include:_spf.google.com ~all     Auto   -       │
│  TXT     _dmarc      v=DMARC1; p=quarantine; rua=...         Auto   -       │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Note:** When Resend or AWS SES is configured for transactional emails, add their SPF include to the SPF record:
`v=spf1 include:_spf.google.com include:_spf.resend.com ~all`

---

## PART 27: Email Setup (Google Workspace — ✅ Complete)

Google Workspace has been fully set up. Zoho has been decommissioned.

| Item | Status |
|------|--------|
| Google Workspace account | ✅ Active |
| Domain verified (tenanters.com) | ✅ Complete |
| MX records configured | ✅ Complete |
| Group aliases created | ✅ 8 aliases active |
| SPF/DKIM/DMARC | ✅ Configured |
| Zoho decommissioned | ✅ Complete |

---

## PART 28: Development Approach & Team Handoff

### 28.1 The "Reverse Engineering" Strategy

The Tenanters platform follows a **two-phase development approach**:

1. **Phase 1 (Lovable — Current):** Build the complete frontend UI/UX as a working prototype. This includes all 50+ routes, the admin control panel, all user flows, responsive design, and prototype backend logic. The Lovable project uses React + Vite + Supabase because those are Lovable's tools — but **this is NOT the production stack**.

2. **Phase 2 (Dev Team — Production):** A professional development team receives the published prototype URL and this architecture document. They rebuild everything from scratch using production-grade technologies chosen for scalability, SEO, and performance.

### 28.2 Why Rebuild Instead of Migrate?

| Factor | Migrate Lovable Code | Rebuild from Scratch |
|--------|---------------------|---------------------|
| **Frontend framework** | ❌ Stuck with Vite+React (no SSR) | ✅ Next.js with SSR/ISR for SEO |
| **Backend** | ❌ Stuck with Supabase Edge Functions | ✅ AWS (Lambda, ECS, API Gateway) |
| **Database schema** | ❌ Organically grown (60+ tables, tech debt) | ✅ Clean, normalized schema (~25-30 tables) |
| **Code quality** | ❌ AI-generated, inconsistent patterns | ✅ Human-reviewed, consistent architecture |
| **Testing** | ❌ No test coverage | ✅ Full test suite from day 1 |
| **Performance** | ❌ Large bundle size | ✅ Optimized, code-split, lazy-loaded |
| **Security** | ❌ Supabase RLS policies | ✅ Proper IAM, WAF, Cognito |

### 28.3 What the Dev Team Gets

1. **Published prototype URL** — click through every page, see every interaction
2. **This document (plan2.md)** — complete architecture decisions and specifications
3. **Source code on GitHub** — reference for component structure, styling, data models
4. **Database schema reference** — current Supabase tables as starting point for schema design
5. **Brand guidelines** — colors, typography, design tokens from the prototype
6. **Waitlist prototype** — separate Lovable project, ready to deploy on Vercel

### 28.4 Backend Architecture Decision: Node.js vs Others

The user asked whether Node.js/Express is needed or if AWS handles everything. **Clarification:**

**AWS provides infrastructure (servers, networking, storage, security). You still need to write application code.** Here's what runs where:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHAT AWS PROVIDES vs WHAT YOU BUILD                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  AWS PROVIDES (Infrastructure):                                             │
│  • Servers (EC2/ECS/Lambda) — YOU choose what code runs on them             │
│  • Networking (VPC, API Gateway) — routes requests to your code             │
│  • Database (Aurora) — stores data, YOU define the schema                   │
│  • File storage (S3) — stores files                                         │
│  • CDN (CloudFront) — serves your frontend fast                             │
│  • Auth (Cognito) — manages user accounts/sessions                          │
│  • Email (SES) — sends emails on your API call                             │
│                                                                             │
│  YOU BUILD (Application Code):                                              │
│  • API endpoints (Node.js/Express) — "POST /api/bookings" does what?        │
│  • Business logic — how to calculate prices, validate reservations          │
│  • Data models — what tables exist, what columns, what relationships        │
│  • Authorization — who can see/edit what data                               │
│  • Real-time messaging — WebSocket server (Go)                             │
│  • AI algorithm — matching logic (Python)                                  │
│  • Frontend — the actual UI (Next.js)                                      │
│                                                                             │
│  ANALOGY:                                                                   │
│  AWS = renting a fully equipped commercial kitchen                          │
│  Your code = the recipes and the cooking                                    │
│  You can't serve food by just renting a kitchen — you need chefs!          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CONCLUSION

This document provides the complete educational foundation and production roadmap for building the Tenanters platform. Key takeaways:

### Architecture Summary

1. **Development Approach**: Lovable prototype (visual spec) → Professional dev team rebuilds on production stack
2. **Frontend**: Next.js (React + Tailwind CSS) — SSR/ISR for SEO
3. **Backend**: Node.js (API) + Go (messaging) + Python (AI) — all on AWS
4. **Database**: AWS Aurora PostgreSQL + ElastiCache Redis
5. **Containers**: Docker + ECS Fargate (→ Kubernetes at scale)
6. **Mobile**: Native Swift (iOS) + Kotlin (Android) with KMP shared logic
7. **Voice/Video Calls**: Mobile app only (WebRTC) — not on web
8. **Domain**: tenanters.com (Cloudflare) — www, admin, waitlist, api subdomains
9. **Email**: Google Workspace (inbox) + Resend/SES (transactional sending) + Mailchimp (marketing)
10. **Hosting**: Vercel (waitlist only) + AWS (everything else)

### Subdomains

| Subdomain | Purpose | Hosting |
|-----------|---------|---------|
| waitlist.tenanters.com | Pre-launch signups | Vercel |
| www.tenanters.com | Main user-facing app | AWS |
| admin.tenanters.com | Admin control panel | AWS |
| api.tenanters.com | Backend API | AWS |

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Frontend Framework** | Next.js | SSR/ISR for SEO, React ecosystem |
| **API Language** | Node.js (TypeScript) | Largest talent pool, shared frontend/backend language |
| **Messaging Language** | Go | High concurrency, low memory for WebSockets |
| **AI Language** | Python | Best ML ecosystem |
| **Container Strategy** | Docker + ECS Fargate → EKS | Managed containers now, Kubernetes at scale |
| **Mobile** | Native (Swift + Kotlin + KMP) | Best UX, full platform access for calls |
| **Email Provider** | Google Workspace + Resend → SES | Inbox + transactional sending |

This plan will be continuously updated as the project evolves.

---

*Document maintained by Lovable AI. Last updated: March 2026.*
