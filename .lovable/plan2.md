# Roomy Platform Complete Technical Guide & Implementation Plan v2

> **Document Version:** 2.0  
> **Created:** February 2026  
> **Purpose:** Comprehensive educational guide + implementation roadmap for the Roomy student housing platform

---

## TABLE OF CONTENTS

1. [Web Development Fundamentals](#part-1-web-development-fundamentals)
2. [Complete Technology Stack](#part-2-complete-technology-stack)
3. [Migration Strategy](#part-3-migration-strategy)
4. [Three-Subdomain Architecture](#part-4-three-subdomain-architecture)
5. [Implementation Timeline](#part-5-implementation-timeline)
6. [Cost Estimates](#part-6-cost-estimates)
7. [Database Schema Reference](#part-7-database-schema-reference)
8. [Security Implementation](#part-8-security-implementation)
9. [Deployment Workflows](#part-9-deployment-workflows)

---

## PART 1: Web Development Fundamentals

### 1.1 The Three Core Layers

Every web application has three main parts:

| Layer | Restaurant Analogy | What It Does | Roomy Example |
|-------|-------------------|--------------|---------------|
| **Frontend** | The dining room | What users see and interact with | React app at app.roomylb.com |
| **Backend** | The kitchen | Processes requests, runs business logic | Supabase Edge Functions |
| **Database** | The pantry/storage | Stores all data permanently | PostgreSQL (76+ tables) |

### 1.2 What "Backend" Actually Includes

The backend is NOT just the database. It includes:

| Component | What It Does | Roomy Implementation |
|-----------|--------------|---------------------|
| **API Endpoints** | URLs that receive requests | `/functions/v1/send-auth-email` |
| **Business Logic** | Processes data (calculate price, validate) | Reservation calculations, AI matching |
| **Authentication** | Verify WHO the user is | Supabase Auth + custom email verification |
| **Authorization** | Check WHAT the user can do | RLS policies, role-based access |
| **Database Queries** | Getting/saving data | Supabase client queries |
| **Edge Functions** | Serverless functions on demand | 20+ functions (check-email-verified, etc.) |
| **Middleware** | Code between request and response | CORS headers, auth checks |
| **Caching** | Store frequently-used data in memory | Redis (future: real-time presence) |
| **File Processing** | Handle uploads, resize images | Supabase Storage buckets |
| **Notifications** | Send emails, SMS, push | SendGrid, push notifications |

### 1.3 Programming Languages Explained

| Language | What It's For | Syntax Example | Used In Roomy |
|----------|---------------|----------------|---------------|
| **JavaScript** | Web browsers, frontend | `const x = 5;` | Legacy code |
| **TypeScript** | JavaScript + types (safer) | `const x: number = 5;` | ✅ All frontend |
| **SQL** | Database queries | `SELECT * FROM users` | ✅ Migrations |
| **Python** | AI, data science, backends | `x = 5` | Future AI services |
| **Go** | High-performance servers | `var x int = 5` | Future AWS backend |
| **Kotlin** | Android apps, backends | `val x: Int = 5` | Future mobile + backend |
| **Swift** | iOS/Mac apps | `let x: Int = 5` | Future iOS app |
| **Rust** | Ultra-fast, safe systems | `let x: i32 = 5;` | Optional real-time |
| **HCL** | Infrastructure as Code | `resource "aws_instance"` | Future Terraform |
| **YAML** | Configuration files | `key: value` | CI/CD pipelines |

### 1.4 Framework vs Build Tool vs Runtime

| Term | Definition | Examples |
|------|------------|----------|
| **Language** | The actual syntax you write | TypeScript, Go, Swift |
| **Framework** | Pre-written code giving structure | React, SwiftUI, Spring Boot |
| **Build Tool** | Compiles source to runnable output | Vite, Webpack, Gradle |
| **Runtime** | Environment where code executes | Node.js, Deno, JVM |
| **Library** | Reusable code you import | Tailwind CSS, date-fns |

### 1.5 Complete Technical Glossary

| Term | What It Means |
|------|---------------|
| **API** | Application Programming Interface - how frontend talks to backend |
| **REST** | Representational State Transfer - API style using HTTP methods (GET, POST, PUT, DELETE) |
| **GraphQL** | Alternative to REST - query exactly what you need |
| **CRUD** | Create, Read, Update, Delete - basic database operations |
| **SQL** | Structured Query Language - language for relational databases |
| **RDBMS** | Relational Database Management System (PostgreSQL, MySQL, Aurora) |
| **NoSQL** | Non-relational databases (MongoDB, DynamoDB) |
| **ORM** | Object-Relational Mapping - code that generates SQL for you |
| **CDN** | Content Delivery Network - servers worldwide for fast loading |
| **SSL/TLS** | Encryption for HTTPS (the lock icon 🔒) |
| **DNS** | Domain Name System - translates domain.com to IP address |
| **CI/CD** | Continuous Integration/Deployment - automated testing and deployment |
| **Docker** | Containerization - package code with all dependencies |
| **Kubernetes** | Container orchestration - managing many Docker containers |
| **Terraform** | Infrastructure as Code - define cloud resources in code |
| **WebSocket** | Real-time two-way communication (for messaging) |
| **OAuth** | Authentication using third-party (Google, Facebook login) |
| **JWT** | JSON Web Token - secure authentication tokens |
| **RLS** | Row Level Security - database access control per user |
| **CORS** | Cross-Origin Resource Sharing - browser security for API calls |
| **Serverless** | Functions that run on demand, no server management |
| **Edge Function** | Serverless function running close to users globally |
| **Microservices** | Architecture where each feature is a separate service |
| **Monolith** | Architecture where everything is in one codebase |
| **SSR** | Server-Side Rendering - server generates HTML |
| **CSR** | Client-Side Rendering - browser generates HTML (what Roomy uses) |
| **SSG** | Static Site Generation - pre-build all pages at deploy time |
| **SPA** | Single Page Application - one HTML file, JS handles routing |
| **PWA** | Progressive Web App - website that works like a native app |
| **Native App** | App built specifically for iOS or Android |
| **Hybrid App** | Web app wrapped in native shell (Capacitor) |
| **Cross-Platform** | One codebase for multiple platforms (Flutter, React Native) |

### 1.6 HTTP Methods Explained

| Method | Purpose | Example | Roomy Usage |
|--------|---------|---------|-------------|
| **GET** | Read data | `GET /api/dorms` | Fetch listings |
| **POST** | Create data | `POST /api/bookings` | Create reservation |
| **PUT** | Replace data entirely | `PUT /api/users/123` | Full profile update |
| **PATCH** | Update part of data | `PATCH /api/users/123` | Change email only |
| **DELETE** | Remove data | `DELETE /api/messages/456` | Delete message |
| **OPTIONS** | CORS preflight check | `OPTIONS /api/*` | Browser security |

### 1.7 Database Concepts

#### Relational vs Non-Relational

| Type | Structure | Best For | Example |
|------|-----------|----------|---------|
| **Relational (SQL)** | Tables with rows/columns | Structured data with relationships | PostgreSQL (Roomy) |
| **Document (NoSQL)** | JSON-like documents | Flexible, schema-less data | MongoDB |
| **Key-Value** | Simple key→value pairs | Caching, sessions | Redis |
| **Graph** | Nodes and relationships | Social networks, recommendations | Neo4j |

#### SQL Example for Roomy

```sql
-- Get all dorms for an owner
SELECT * FROM dorms WHERE owner_id = '123';

-- Create a reservation
INSERT INTO reservations (student_id, dorm_id, status)
VALUES ('456', '789', 'pending');

-- Update reservation status
UPDATE reservations SET status = 'confirmed' WHERE id = '101';

-- Delete a message
DELETE FROM messages WHERE id = '202';

-- Join students with their reservations
SELECT s.full_name, r.status, d.name as dorm_name
FROM students s
JOIN reservations r ON s.id = r.student_id
JOIN dorms d ON r.dorm_id = d.id
WHERE s.user_id = auth.uid();
```

---

## PART 2: Complete Technology Stack

### 2.1 All Technologies by Category

#### Frontend Technologies

| Technology | Category | Purpose | Version |
|------------|----------|---------|---------|
| TypeScript | Language | Type-safe JavaScript | 5.x |
| React | Framework | Component-based UI | 18.x |
| Vite | Build Tool | Fast bundling & dev server | 5.x |
| Tailwind CSS | Styling | Utility-first CSS | 3.x |
| shadcn/ui | Component Library | Pre-built UI components | Latest |
| Radix UI | Primitives | Accessible component primitives | 1.x |
| React Router | Routing | Client-side navigation | 6.x |
| TanStack Query | Data Fetching | Server state management | 5.x |
| React Hook Form | Forms | Form handling & validation | 7.x |
| Zod | Validation | Schema validation | 3.x |
| Framer Motion | Animation | Motion library | 11.x |
| Recharts | Charts | Data visualization | 3.x |
| date-fns | Utilities | Date manipulation | 3.x |
| i18next | i18n | Internationalization | 25.x |

#### Backend Technologies (Current - Supabase)

| Technology | Category | Purpose |
|------------|----------|---------|
| Supabase | BaaS | Complete backend platform |
| PostgreSQL | Database | Relational database |
| Deno | Runtime | Edge function execution |
| PostgREST | API | Auto-generated REST API |
| GoTrue | Auth | Authentication service |
| Realtime | WebSocket | Real-time subscriptions |
| Storage | Files | Object storage |

#### Backend Technologies (Future - AWS)

| Technology | Category | Purpose |
|------------|----------|---------|
| Aurora PostgreSQL | Database | Managed PostgreSQL |
| Lambda | Compute | Serverless functions |
| ECS Fargate | Compute | Container orchestration |
| API Gateway | Routing | API management |
| ElastiCache | Caching | Redis caching |
| S3 | Storage | Object storage |
| CloudFront | CDN | Content delivery |
| Cognito | Auth | User management |
| SES | Email | Email service |
| SNS | Notifications | Push notifications |

#### Mobile Technologies (Future)

| Technology | Platform | Purpose |
|------------|----------|---------|
| Swift | iOS | Native iOS language |
| SwiftUI | iOS | Declarative UI framework |
| Kotlin | Android | Native Android language |
| Jetpack Compose | Android | Modern UI toolkit |
| Kotlin Multiplatform | Shared | Cross-platform business logic |

#### DevOps & Infrastructure

| Technology | Category | Purpose |
|------------|----------|---------|
| GitHub | Version Control | Code repository |
| GitHub Actions | CI/CD | Automated pipelines |
| Vercel | Hosting | Frontend deployment |
| Cloudflare | DNS/CDN | Domain & security |
| Docker | Containerization | Package applications |
| Terraform | IaC | Infrastructure as Code |

### 2.2 Stack by Phase

#### Phase 1: Launch (Vercel + Supabase)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + Vite + TypeScript + Tailwind CSS + shadcn/ui           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    HOSTING (Vercel)                              │
│  • Automatic deployments from GitHub                            │
│  • Global CDN                                                    │
│  • SSL certificates                                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                            │
├─────────────────────────────────────────────────────────────────┤
│  Edge Functions (Deno)     │  Auth (GoTrue)                     │
│  • send-auth-email         │  • Email/password                  │
│  • check-email-verified    │  • Email verification              │
│  • ai-match                │  • Session management              │
│  • send-notification       │  • Role-based access               │
├────────────────────────────┼────────────────────────────────────┤
│  Database (PostgreSQL)     │  Storage                           │
│  • 76+ tables              │  • profile-photos                  │
│  • RLS policies            │  • dorm-images                     │
│  • Functions & triggers    │  • chat-attachments                │
├────────────────────────────┼────────────────────────────────────┤
│  Realtime                  │  PostgREST                         │
│  • Message subscriptions   │  • Auto-generated API              │
│  • Presence (typing)       │  • Row-level filtering             │
└─────────────────────────────────────────────────────────────────┘
```

**Monthly Cost: $50-150**

#### Phase 2: Scale (AWS)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  Same React codebase (no changes needed)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              HOSTING (S3 + CloudFront)                           │
│  • Static file hosting                                          │
│  • Global CDN with 200+ edge locations                          │
│  • WAF for security                                             │
└──────────────────────────┬──────────────────────────────────────┘
                           │ API calls
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API GATEWAY                                   │
│  • Request routing                                              │
│  • Rate limiting                                                │
│  • API key management                                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Lambda     │  │  ECS Fargate │  │   Cognito    │
│  (Go/Node)   │  │   (Kotlin)   │  │   (Auth)     │
│              │  │              │  │              │
│ • Simple API │  │ • Complex    │  │ • User mgmt  │
│   endpoints  │  │   services   │  │ • OAuth      │
│ • Webhooks   │  │ • AI/ML      │  │ • MFA        │
└──────┬───────┘  └──────┬───────┘  └──────────────┘
       │                 │
       └────────┬────────┘
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────┤
│  Aurora PostgreSQL       │  ElastiCache (Redis)                 │
│  • Same schema           │  • Session caching                   │
│  • Auto-scaling          │  • Real-time presence                │
│  • Read replicas         │  • Rate limiting                     │
├────────────────────────────────────────────────────────────────┤
│  S3 Storage              │  Elasticsearch                       │
│  • File uploads          │  • Full-text search                  │
│  • CDN integration       │  • Dorm search                       │
└─────────────────────────────────────────────────────────────────┘
```

**Monthly Cost: $500-2000**

### 2.3 Vercel vs AWS Detailed Comparison

| Feature | Vercel | AWS |
|---------|--------|-----|
| **Setup Time** | 5 minutes | 2-5 days |
| **Cost (0-1K users)** | $0-20/month | $200-400/month |
| **Cost (10K users)** | $50-100/month | $600-1200/month |
| **Cost (100K users)** | $200-500/month | $2000-5000/month |
| **Learning Curve** | Easy (1 day) | Steep (1-3 months) |
| **Control** | Limited | Full |
| **Regions** | 30+ | 30+ |
| **Scaling** | Automatic | Manual + Automatic |
| **Custom Domains** | ✅ Easy | ✅ Via Route 53 |
| **SSL Certificates** | ✅ Free, automatic | ✅ Free via ACM |
| **Serverless Functions** | ✅ Built-in | ✅ Lambda |
| **Database** | ❌ Use external | ✅ Aurora, RDS, DynamoDB |
| **CDN** | ✅ Built-in | ✅ CloudFront |
| **DDoS Protection** | ✅ Basic | ✅ Shield + WAF |
| **Best For** | Launch fast | Enterprise scale |

---

## PART 3: Migration Strategy

### 3.1 Migration Feasibility Matrix

| Component | Source | Target | Difficulty | Time | Data Loss |
|-----------|--------|--------|------------|------|-----------|
| Frontend Code | Vercel | S3/CloudFront | 🟢 Easy | 1 hour | None |
| Database | Supabase PostgreSQL | Aurora PostgreSQL | 🟡 Medium | 2-4 hours | None |
| Backend Functions | Edge Functions (Deno) | Lambda (Go/Node) | 🔴 Hard | 1-2 weeks | None |
| Auth Users | Supabase Auth | Cognito | 🟡 Medium | 1 day | None* |
| File Storage | Supabase Storage | S3 | 🟢 Easy | 2-4 hours | None |
| Real-time | Supabase Realtime | Custom WebSocket | 🔴 Hard | 1-2 weeks | None |

*Users may need to reset passwords depending on migration approach

### 3.2 Database Migration Process

```bash
# Step 1: Export from Supabase PostgreSQL
pg_dump \
  --host=db.vtdtmhgzisigtqryojwl.supabase.co \
  --port=5432 \
  --username=postgres \
  --dbname=postgres \
  --file=roomy_backup.sql \
  --format=plain \
  --no-owner

# Step 2: Create Aurora cluster on AWS
aws rds create-db-cluster \
  --db-cluster-identifier roomy-production \
  --engine aurora-postgresql \
  --engine-version 15.4 \
  --master-username roomy_admin \
  --master-user-password <secure-password>

# Step 3: Import to Aurora
psql \
  --host=roomy-production.cluster-xxxxx.us-east-1.rds.amazonaws.com \
  --port=5432 \
  --username=roomy_admin \
  --dbname=postgres \
  --file=roomy_backup.sql

# Step 4: Verify data integrity
psql -c "SELECT COUNT(*) FROM students;"
psql -c "SELECT COUNT(*) FROM dorms;"
psql -c "SELECT COUNT(*) FROM messages;"
```

### 3.3 Auth Migration Process

```javascript
// Export users from Supabase (via Edge Function)
const { data: users } = await supabaseAdmin.auth.admin.listUsers();

// Format for Cognito import
const cognitoUsers = users.map(user => ({
  Username: user.email,
  Attributes: [
    { Name: 'email', Value: user.email },
    { Name: 'email_verified', Value: 'true' },
    { Name: 'custom:role', Value: user.app_metadata?.role || 'student' },
    { Name: 'custom:supabase_id', Value: user.id }
  ],
  // Note: Passwords cannot be migrated directly
  // Users will need to reset passwords
}));

// Import to Cognito via AWS SDK
await cognito.adminCreateUser({
  UserPoolId: 'us-east-1_xxxxx',
  Username: user.email,
  UserAttributes: cognitoUsers[0].Attributes,
  MessageAction: 'SUPPRESS' // Don't send welcome email
});
```

### 3.4 Zero-Downtime Migration Checklist

```markdown
## Pre-Migration (1 week before)
- [ ] Create Aurora cluster and test connectivity
- [ ] Set up Cognito user pool with matching attributes
- [ ] Deploy Lambda functions (parallel to Edge Functions)
- [ ] Configure S3 buckets with same folder structure
- [ ] Set up CloudFront distribution
- [ ] Test all endpoints on staging

## Migration Day
- [ ] Put app in maintenance mode (show banner)
- [ ] Export final database snapshot
- [ ] Export all Storage files to S3
- [ ] Export auth users to Cognito
- [ ] Import data to Aurora
- [ ] Update environment variables
- [ ] Switch DNS from Vercel to CloudFront
- [ ] Monitor for 2 hours

## Post-Migration
- [ ] Send email to users about password reset (if needed)
- [ ] Monitor error rates for 48 hours
- [ ] Keep Supabase running for 1 week (fallback)
- [ ] Decommission Supabase after successful migration
```

### 3.5 When to Migrate

| Trigger | Current State | Action |
|---------|---------------|--------|
| **< 1,000 users** | Stay on Supabase | No migration needed |
| **1,000 - 10,000 users** | Evaluate | Migrate if hitting limits |
| **> 10,000 users** | Migrate to AWS | Full infrastructure move |
| **Voice/Video calls** | Migrate | Need custom WebSocket servers |
| **GDPR compliance** | Migrate | Need EU data residency |
| **$500+/mo budget** | Migrate | Can afford AWS |
| **Technical team available** | Migrate | Can manage complexity |

---

## PART 4: Three-Subdomain Architecture

### 4.1 Domain Structure

```
roomylb.com (root domain)
├── waitlist.roomylb.com  → Lovable Project 1
├── app.roomylb.com       → Lovable Project 2 (this project)
└── admin.roomylb.com     → Lovable Project 3
```

### 4.2 Detailed Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLOUDFLARE (DNS + CDN)                             │
│                                                                              │
│  roomylb.com                                                                 │
│  ├── A     → Vercel IP (waitlist)                                           │
│  ├── CNAME → app.roomylb.com → Vercel (main app)                            │
│  └── CNAME → admin.roomylb.com → Vercel (admin dashboard)                   │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    WAITLIST     │    │    MAIN APP     │    │     ADMIN       │
│                 │    │                 │    │                 │
│ • Landing page  │    │ • Student UI    │    │ • Dashboard     │
│ • Email signup  │    │ • Owner UI      │    │ • User mgmt     │
│ • Countdown     │    │ • Messaging     │    │ • Analytics     │
│ • Features      │    │ • Reservations  │    │ • Verification  │
│                 │    │ • AI Matching   │    │ • Financials    │
│                 │    │ • Tour Booking  │    │ • Audit logs    │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ Tech:           │    │ Tech:           │    │ Tech:           │
│ • React + Vite  │    │ • React + Vite  │    │ • React + Vite  │
│ • Mailchimp     │    │ • Full features │    │ • Admin-only    │
│ • Minimal DB    │    │ • All 76 tables │    │ • Read all data │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SHARED SUPABASE BACKEND                                 │
│                                                                              │
│  Project ID: vtdtmhgzisigtqryojwl                                           │
│  URL: https://vtdtmhgzisigtqryojwl.supabase.co                              │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        DATABASE                                      │    │
│  │  • 76+ tables (students, owners, dorms, messages, etc.)             │    │
│  │  • Full RLS policies                                                │    │
│  │  • 20+ database functions                                           │    │
│  │  • Triggers for updated_at, notifications                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        EDGE FUNCTIONS                                │    │
│  │  • send-auth-email (custom email verification)                      │    │
│  │  • check-email-verified (token validation)                          │    │
│  │  • ai-match (roommate/dorm matching)                                │    │
│  │  • send-notification (push notifications)                           │    │
│  │  • process-payment (Whish/Stripe integration)                       │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        STORAGE BUCKETS                               │    │
│  │  • profile-photos (avatars)                                         │    │
│  │  • dorm-images (listings)                                           │    │
│  │  • chat-attachments (messages)                                      │    │
│  │  • documents (verification docs)                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        AUTH                                          │    │
│  │  • Email/password authentication                                    │    │
│  │  • Custom email verification flow                                   │    │
│  │  • Role-based access (student, owner, admin)                        │    │
│  │  • Session management (PKCE flow)                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        REALTIME                                      │    │
│  │  • Message subscriptions (instant delivery)                         │    │
│  │  • Presence (typing indicators, online status)                      │    │
│  │  • Broadcast (notifications)                                        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Why Separate Projects?

| Reason | Benefit |
|--------|---------|
| **Security** | Admin dashboard isolated from public app |
| **Performance** | Each site loads only what it needs |
| **Team Separation** | Different developers can work independently |
| **Deployment** | Update admin without affecting main app |
| **Scaling** | Scale each independently based on traffic |
| **Code Organization** | Smaller, focused codebases |

### 4.4 Connecting Multiple Projects to Same Backend

```typescript
// All three projects use the same Supabase credentials
// In each project's .env file:

VITE_SUPABASE_URL=https://vtdtmhgzisigtqryojwl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// The Supabase client is identical in all projects:
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

---

## PART 5: Implementation Timeline

### 5.1 Overview Gantt Chart

```
Week:    1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17-28  29-36
         ├──┴──┴──┴──┼──┴──┴──┴──┴──┴──┴──┴──┼──┴──┴──┴──┼──────┼──────┤
Phase 1: ████████████                                                    Foundation
Phase 2:             ████████████████████████                            Main App
Phase 3:                                     ████████████                Admin
Phase 4:                                                 ████████████    Mobile
Phase 5:                                                          ██████ AWS
```

### 5.2 Phase 1: Foundation (Weeks 1-4)

#### Week 1: Project Setup

```markdown
## Day 1-2: Lovable Workspaces
- [ ] Create waitlist.roomylb.com workspace
- [ ] Create app.roomylb.com workspace (current project)
- [ ] Create admin.roomylb.com workspace
- [ ] Set up GitHub repository for each

## Day 3-4: DNS & Hosting
- [ ] Configure Cloudflare DNS for roomylb.com
- [ ] Add CNAME records for subdomains
- [ ] Connect Vercel to each workspace
- [ ] Set up SSL certificates

## Day 5-7: Shared Backend
- [ ] Document current Supabase configuration
- [ ] Export Supabase credentials
- [ ] Connect all three projects to same Supabase
- [ ] Verify auth works across projects
```

#### Week 2: Waitlist Website

```markdown
## Components to Build
- [ ] Hero section with value proposition
- [ ] Features grid (6-8 key features)
- [ ] Countdown timer to launch
- [ ] Email signup form
- [ ] University selector
- [ ] Social proof section
- [ ] Footer with links

## Integrations
- [ ] Mailchimp API for email collection
- [ ] Analytics (Google Analytics/Plausible)
- [ ] Meta pixel for marketing

## Deployment
- [ ] Deploy to Vercel
- [ ] Connect custom domain
- [ ] Set up redirects (roomylb.com → waitlist.roomylb.com)
```

#### Weeks 3-4: Database Schema (Already Complete)

Current database has 76+ tables. Key tables:

| Table | Purpose | Rows (Est.) |
|-------|---------|-------------|
| students | Student profiles | 10,000+ |
| owners | Property owner profiles | 500+ |
| admins | Admin users | 10 |
| dorms | Property listings | 1,000+ |
| rooms | Individual rooms | 5,000+ |
| beds | Individual beds | 15,000+ |
| apartments | Apartment listings | 2,000+ |
| bedrooms | Apartment bedrooms | 6,000+ |
| reservations | Booking records | 20,000+ |
| payments | Payment records | 20,000+ |
| conversations | Chat threads | 50,000+ |
| messages | Chat messages | 500,000+ |
| bookings | Tour bookings | 10,000+ |
| friendships | Student connections | 30,000+ |
| user_roles | Role assignments | 15,000+ |

### 5.3 Phase 2: Main App (Weeks 5-12)

#### Weeks 5-6: Core Architecture

```markdown
## Project Structure
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Authentication components
│   ├── listings/        # Dorm listing components
│   ├── messaging/       # Chat components
│   └── reservations/    # Booking components
├── contexts/            # React contexts
│   ├── AuthContext.tsx  # Authentication state
│   └── ThemeContext.tsx # Theme preferences
├── hooks/               # Custom React hooks
│   ├── useAuth.tsx      # Auth utilities
│   ├── useRealtime.tsx  # Supabase subscriptions
│   └── useDebounce.tsx  # Debounce utility
├── lib/                 # Utility functions
│   ├── supabase/        # Supabase client
│   ├── payments/        # Payment utilities
│   └── utils.ts         # General utilities
├── pages/               # Route pages
│   ├── Listings.tsx     # Dorm listings
│   ├── DormDetails.tsx  # Single listing
│   ├── Messages.tsx     # Chat interface
│   └── Profile.tsx      # User profile
└── integrations/        # External integrations
    └── supabase/        # Generated types
```

#### Weeks 7-8: Authentication

```markdown
## Features to Implement
- [ ] GlobalAuthModal (Airbnb-style overlay)
- [ ] Email/password signup
- [ ] Email verification flow (custom tokens)
- [ ] Password reset
- [ ] Session management
- [ ] Role detection (student/owner/admin)
- [ ] Protected route guards
- [ ] OAuth integration (Google, optional)

## Security Requirements
- [ ] PKCE flow for token exchange
- [ ] Secure session storage
- [ ] CSRF protection
- [ ] Rate limiting on auth endpoints
- [ ] Password strength validation
```

#### Weeks 9-10: Messaging System

```markdown
## Core Features
- [ ] Real-time message delivery
- [ ] Conversation list with last message preview
- [ ] Unread message counts
- [ ] Typing indicators
- [ ] Read receipts (double check marks)
- [ ] Message reactions
- [ ] Message editing
- [ ] Message deletion
- [ ] Voice notes
- [ ] Image/file attachments
- [ ] Message search

## WhatsApp-like Features
- [ ] Reply to specific messages
- [ ] Forward messages
- [ ] Star important messages
- [ ] Archive conversations
- [ ] Mute notifications
- [ ] Block users
- [ ] Group chats

## Technical Implementation
- [ ] Supabase Realtime subscriptions
- [ ] Optimistic UI updates
- [ ] Infinite scroll for history
- [ ] Attachment upload with progress
- [ ] Voice note recording (MediaRecorder API)
```

#### Weeks 11-12: Reservations

```markdown
## Booking Flow
1. Student browses listings
2. Student views dorm/room details
3. Student selects bed/room/apartment
4. Student initiates reservation
5. System calculates deposit (10% commission)
6. Student makes payment (Stripe/Whish)
7. Owner receives notification
8. Owner approves/declines
9. System updates availability
10. Student receives confirmation

## Payment Integration
- [ ] Stripe Connect for owner payouts
- [ ] Whish Money integration (Lebanon)
- [ ] Payment status tracking
- [ ] Refund processing
- [ ] Commission calculation
- [ ] Financial reporting

## Status Management
- pending_payment → paid → confirmed → active → completed
                        ↓
                   cancelled/refunded
```

### 5.4 Phase 3: Admin Dashboard (Weeks 13-16)

#### Weeks 13-14: Admin Core

```markdown
## Dashboard Components
- [ ] Key metrics cards (users, revenue, bookings)
- [ ] Recent activity feed
- [ ] Pending verifications count
- [ ] Support tickets queue
- [ ] System health status

## User Management
- [ ] User list with search/filter
- [ ] User profile viewer
- [ ] Role assignment (student ↔ owner)
- [ ] Account suspension
- [ ] Email verification override
- [ ] Password reset for users

## Dorm Verification
- [ ] Pending verification queue
- [ ] Document viewer
- [ ] Approve/reject actions
- [ ] Request additional documents
- [ ] Verification history
- [ ] Bulk operations
```

#### Weeks 15-16: Analytics & Reporting

```markdown
## Analytics Dashboard
- [ ] User growth chart (daily/weekly/monthly)
- [ ] Revenue chart with period comparison
- [ ] Booking funnel visualization
- [ ] Geographic distribution map
- [ ] Popular dorms ranking
- [ ] User engagement metrics

## Financial Reports
- [ ] Revenue summary
- [ ] Commission breakdown
- [ ] Payout history to owners
- [ ] Refund tracking
- [ ] Tax report export

## Audit Logging
- [ ] Admin action log
- [ ] User activity timeline
- [ ] Security events
- [ ] Error tracking
```

### 5.5 Phase 4: Native Mobile (Weeks 17-28)

#### Weeks 17-20: Kotlin Multiplatform Setup

```kotlin
// Shared module structure
shared/
├── src/
│   ├── commonMain/
│   │   ├── kotlin/
│   │   │   ├── models/        // Data classes
│   │   │   │   ├── User.kt
│   │   │   │   ├── Dorm.kt
│   │   │   │   └── Message.kt
│   │   │   ├── repository/    // Data access
│   │   │   │   ├── AuthRepository.kt
│   │   │   │   ├── DormRepository.kt
│   │   │   │   └── MessageRepository.kt
│   │   │   ├── network/       // API client
│   │   │   │   ├── ApiClient.kt
│   │   │   │   └── ApiConfig.kt
│   │   │   └── utils/         // Utilities
│   │   │       └── DateUtils.kt
│   ├── androidMain/           // Android-specific
│   │   └── kotlin/
│   │       └── Platform.kt
│   └── iosMain/               // iOS-specific
│       └── kotlin/
│           └── Platform.kt
```

```kotlin
// ApiConfig.kt - Easy to update when migrating to AWS
object ApiConfig {
    // Phase 1: Supabase
    val baseUrl = "https://vtdtmhgzisigtqryojwl.supabase.co"
    
    // Phase 2: After AWS migration, just change to:
    // val baseUrl = "https://api.roomylb.com"
}
```

#### Weeks 21-24: iOS App

```swift
// Project structure
RoomyiOS/
├── App/
│   ├── RoomyApp.swift
│   └── ContentView.swift
├── Features/
│   ├── Auth/
│   │   ├── LoginView.swift
│   │   └── SignupView.swift
│   ├── Listings/
│   │   ├── ListingsView.swift
│   │   └── DormDetailView.swift
│   ├── Messaging/
│   │   ├── ConversationsView.swift
│   │   └── ChatView.swift
│   └── Profile/
│       └── ProfileView.swift
├── Core/
│   ├── Network/
│   ├── Storage/
│   └── Utilities/
└── Shared/              // KMP module
```

#### Weeks 25-28: Android App

```kotlin
// Project structure
RoomyAndroid/
├── app/
│   ├── src/main/
│   │   ├── kotlin/com/roomy/
│   │   │   ├── MainActivity.kt
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   ├── listings/
│   │   │   │   ├── messaging/
│   │   │   │   └── profile/
│   │   │   └── core/
│   │   │       ├── navigation/
│   │   │       └── ui/
│   │   └── res/
│   └── build.gradle.kts
└── shared/              // KMP module
```

### 5.6 Phase 5: AWS Migration (Weeks 29-36)

#### Weeks 29-30: Infrastructure Setup

```hcl
# terraform/main.tf

# VPC for network isolation
resource "aws_vpc" "roomy" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  tags = { Name = "roomy-vpc" }
}

# Aurora PostgreSQL cluster
resource "aws_rds_cluster" "roomy_db" {
  cluster_identifier  = "roomy-production"
  engine              = "aurora-postgresql"
  engine_version      = "15.4"
  database_name       = "roomy"
  master_username     = "roomy_admin"
  master_password     = var.db_password
  skip_final_snapshot = false
  
  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 16
  }
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "roomy_cache" {
  cluster_id           = "roomy-cache"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
}

# S3 bucket for file storage
resource "aws_s3_bucket" "roomy_storage" {
  bucket = "roomy-storage-production"
}

# CloudFront distribution
resource "aws_cloudfront_distribution" "roomy_cdn" {
  origin {
    domain_name = aws_s3_bucket.roomy_frontend.bucket_regional_domain_name
    origin_id   = "S3-roomy-frontend"
  }
  
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-roomy-frontend"
    
    viewer_protocol_policy = "redirect-to-https"
  }
  
  price_class = "PriceClass_100"
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.roomy.arn
    ssl_support_method  = "sni-only"
  }
}
```

#### Weeks 31-34: Backend Services

```go
// lambda/handlers/auth.go
package handlers

import (
    "github.com/aws/aws-lambda-go/events"
    "github.com/roomy/shared/auth"
)

func HandleLogin(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    // Parse request body
    var loginReq auth.LoginRequest
    json.Unmarshal([]byte(request.Body), &loginReq)
    
    // Validate credentials against Cognito
    result, err := auth.ValidateCredentials(loginReq)
    if err != nil {
        return events.APIGatewayProxyResponse{
            StatusCode: 401,
            Body:       `{"error": "Invalid credentials"}`,
        }, nil
    }
    
    return events.APIGatewayProxyResponse{
        StatusCode: 200,
        Body:       result.ToJSON(),
    }, nil
}
```

#### Weeks 35-36: Cutover

```markdown
## Migration Day Checklist

### T-24 hours
- [ ] Final database backup from Supabase
- [ ] Verify all Lambda functions deployed
- [ ] Test all API endpoints on staging
- [ ] Prepare maintenance page

### T-0 (Migration Start)
- [ ] Enable maintenance mode
- [ ] Stop accepting new signups
- [ ] Export final data snapshot
- [ ] Begin database migration

### T+2 hours
- [ ] Database migration complete
- [ ] File migration complete
- [ ] Update DNS to point to CloudFront
- [ ] Wait for DNS propagation (15-60 min)

### T+4 hours
- [ ] Disable maintenance mode
- [ ] Monitor error rates
- [ ] Test critical flows manually
- [ ] Send "We're back" email to users

### T+48 hours
- [ ] Review all monitoring dashboards
- [ ] Address any issues found
- [ ] Keep Supabase as fallback

### T+7 days
- [ ] Final verification
- [ ] Decommission Supabase project
- [ ] Update documentation
```

---

## PART 6: Cost Estimates

### 6.1 Development Phase

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Lovable | $0-100 | Depending on plan |
| Supabase Pro | $25 | Database + Auth + Functions |
| Vercel | $0-20 | Free tier usually sufficient |
| Cloudflare | $0 | Free tier for DNS |
| GitHub | $0 | Free for public repos |
| **Total** | **$25-145/month** | |

### 6.2 Production Phase (Vercel + Supabase)

| Users | Supabase | Vercel | Cloudflare | Email | Total |
|-------|----------|--------|------------|-------|-------|
| 0-1K | $25 | $0 | $0 | $0 | $25 |
| 1K-5K | $25 | $20 | $0 | $20 | $65 |
| 5K-10K | $75 | $20 | $20 | $50 | $165 |
| 10K-25K | $150 | $50 | $20 | $100 | $320 |
| 25K-50K | $300 | $100 | $50 | $200 | $650 |
| 50K-100K | $600 | $200 | $100 | $400 | $1,300 |

### 6.3 Enterprise Phase (AWS)

| Component | 0-10K Users | 10K-50K Users | 50K-100K Users | 100K+ Users |
|-----------|-------------|---------------|----------------|-------------|
| Aurora | $100 | $400 | $1,000 | $3,000 |
| Lambda | $50 | $200 | $500 | $1,500 |
| ECS | $0 | $200 | $600 | $2,000 |
| ElastiCache | $50 | $100 | $300 | $800 |
| S3 | $20 | $50 | $150 | $500 |
| CloudFront | $50 | $150 | $400 | $1,200 |
| Cognito | $20 | $100 | $400 | $1,500 |
| SES | $10 | $50 | $150 | $500 |
| CloudWatch | $30 | $100 | $300 | $800 |
| WAF | $50 | $50 | $100 | $200 |
| **Total** | **$380** | **$1,400** | **$3,900** | **$12,000** |

### 6.4 Cost Optimization Tips

```markdown
## Supabase Optimizations
1. Use row-level limits on queries
2. Implement caching for frequent reads
3. Compress images before upload
4. Clean up unused data periodically

## AWS Optimizations
1. Use Reserved Instances for Aurora (up to 60% savings)
2. Enable Aurora Serverless v2 for variable workloads
3. Use S3 Intelligent-Tiering for storage
4. Set up Lambda Provisioned Concurrency only where needed
5. Use CloudFront caching aggressively
6. Enable Compute Savings Plans
```

---

## PART 7: Database Schema Reference

### 7.1 Core Tables Overview

```sql
-- User-related tables
students          -- Student profiles
owners            -- Property owner profiles  
admins            -- Admin users
user_roles        -- Role assignments (CRITICAL for security)

-- Property tables
dorms             -- Building/property listings
rooms             -- Individual rooms
beds              -- Individual beds
apartments        -- Apartment listings
bedrooms          -- Apartment bedrooms
apartment_spaces  -- Apartment room configurations
apartment_photos  -- Apartment images

-- Booking tables
reservations      -- Booking records
payments          -- Payment transactions
bookings          -- Tour bookings
booking_reminders -- Scheduled reminders

-- Messaging tables
conversations     -- Chat threads
messages          -- Chat messages
group_members     -- Group chat participants
calls             -- Voice/video calls
call_participants -- Call attendees

-- Social tables
friendships       -- Student connections
ai_match_logs     -- AI matching history

-- Analytics tables
analytics_events  -- User activity tracking
ai_events         -- AI system events
admin_audit_log   -- Admin action history
```

### 7.2 Key Relationships

```
students ──────┬──> user_roles
               ├──> reservations
               ├──> messages (as sender)
               ├──> friendships (as requester/receiver)
               └──> conversations (as participant)

owners ────────┬──> dorms
               ├──> conversations (as owner)
               └──> bookings (as owner)

dorms ─────────┬──> rooms ──────> beds
               ├──> apartments ──> bedrooms ──> beds
               ├──> reservations
               └──> bookings

conversations ─┬──> messages
               └──> group_members
```

### 7.3 RLS Policy Pattern

```sql
-- Example: Students can only see their own data
CREATE POLICY "Students can view own profile"
ON public.students
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Example: Messages visible to conversation participants
CREATE POLICY "Messages visible to participants"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.user_a_id = auth.uid() OR c.user_b_id = auth.uid())
  )
);

-- Example: Admins can view everything
CREATE POLICY "Admins can view all dorms"
ON public.dorms
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
```

---

## PART 8: Security Implementation

### 8.1 Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 1: NETWORK                                  │
│  • Cloudflare DDoS protection                                       │
│  • SSL/TLS encryption                                               │
│  • Rate limiting at edge                                            │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 2: APPLICATION                              │
│  • CORS configuration                                               │
│  • Input validation (Zod schemas)                                   │
│  • XSS prevention (DOMPurify)                                       │
│  • CSRF tokens                                                      │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 3: AUTHENTICATION                           │
│  • Supabase Auth (GoTrue)                                           │
│  • PKCE flow for tokens                                             │
│  • Custom email verification                                        │
│  • Session management                                               │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 4: AUTHORIZATION                            │
│  • Row Level Security (RLS) on all tables                           │
│  • Role-based access control                                        │
│  • SECURITY DEFINER functions                                       │
│  • Separate user_roles table                                        │
└───────────────────────────────────────────────────────────────────┬─┘
                                                                    │
┌─────────────────────────────────────────────────────────────────────┐
│                    LAYER 5: DATA                                     │
│  • Encrypted at rest (AES-256)                                      │
│  • Encrypted in transit (TLS 1.3)                                   │
│  • Password hashing (bcrypt)                                        │
│  • PII data isolation                                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Security Checklist

```markdown
## Authentication
- [x] Email verification required
- [x] Password strength validation
- [x] Rate limiting on login (5 attempts/hour)
- [x] Session timeout (7 days)
- [x] PKCE flow for token exchange
- [x] Secure cookie settings

## Authorization
- [x] RLS enabled on all 76+ tables
- [x] Separate user_roles table (not on profiles)
- [x] SECURITY DEFINER for role checks
- [x] Admin actions audit logged

## Data Protection
- [x] Encryption at rest
- [x] HTTPS enforced
- [x] Sensitive data masked in logs
- [x] PII export capability (GDPR)

## Infrastructure
- [x] DDoS protection (Cloudflare)
- [x] WAF rules configured
- [x] Secrets in environment variables
- [x] No hardcoded credentials
```

---

## PART 9: Deployment Workflows

### 9.1 Current Workflow (Lovable → Vercel)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Lovable   │────>│   GitHub    │────>│   Vercel    │────>│    Users    │
│   (Build)   │     │   (Store)   │     │   (Host)    │     │  (Access)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
      │                   │                   │
      ▼                   ▼                   ▼
 Edit code in       Auto-push on       Auto-deploy on
 Lovable UI         every save         every push
```

### 9.2 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 9.3 Database Migration Workflow

```yaml
# .github/workflows/migration.yml
name: Run Database Migration

on:
  push:
    paths:
      - 'supabase/migrations/**'
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        
      - name: Run Migrations
        run: |
          supabase db push \
            --db-url "${{ secrets.SUPABASE_DB_URL }}"
```

---

## APPENDIX A: Quick Reference Commands

```bash
# Development
npm run dev          # Start local dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests

# Supabase CLI
supabase start       # Start local Supabase
supabase db reset    # Reset local database
supabase functions serve  # Run functions locally
supabase gen types typescript  # Generate types

# Git
git pull origin main           # Get latest changes
git checkout -b feature/name   # Create feature branch
git push origin feature/name   # Push branch
git merge main                 # Merge main into branch

# Vercel CLI
vercel                # Deploy preview
vercel --prod         # Deploy production
vercel env pull       # Pull environment variables
```

---

## APPENDIX B: Contact & Resources

| Resource | Link |
|----------|------|
| Supabase Docs | https://supabase.com/docs |
| React Docs | https://react.dev |
| Tailwind CSS | https://tailwindcss.com |
| Vercel Docs | https://vercel.com/docs |
| AWS Docs | https://docs.aws.amazon.com |
| Kotlin Multiplatform | https://kotlinlang.org/docs/multiplatform.html |
| SwiftUI | https://developer.apple.com/xcode/swiftui |
| Jetpack Compose | https://developer.android.com/compose |

---

*Document last updated: February 2026*
*Version: 2.0*
*Status: Approved*
