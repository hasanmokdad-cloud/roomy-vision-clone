
# Plan: Integrate Waitlist Project + Email/DNS Infrastructure into plan2.md

## Overview

This update will add approximately **400-500 new lines** to plan2.md, integrating:
1. Complete waitlist project technical documentation
2. Email infrastructure strategy (Resend → AWS SES)
3. Domain/DNS migration strategy (Namecheap → Cloudflare)
4. Email migration (Zoho → Google Workspace)

---

## New Sections to Add

### 1. NEW SECTION: "PART 24: Waitlist Project Technical Specification"

This will be a detailed section documenting the waitlist project that was built in the separate Lovable workspace:

#### 24.1 Project Identity & Context

| Property | Value |
|----------|-------|
| **Project Name** | Roomy Waitlist |
| **Lovable Preview** | roomy-waitlist-2.lovable.app |
| **Vercel Production** | roomy-waitlist-2.vercel.app |
| **Future Domain** | waitlist.roomylb.com |
| **Status** | Frontend Complete, Backend Pending |
| **Tech Stack** | React + Vite + TypeScript + Tailwind CSS |

#### 24.2 Project Structure

```text
roomy-waitlist/
├── .lovable/
│   └── waitlist-project-overview.md
├── public/
│   ├── favicon.ico, robots.txt
│   └── images/ (university WebP images)
├── src/
│   ├── assets/ (logos, university photos)
│   ├── components/
│   │   ├── ui/ (50+ shadcn/ui components)
│   │   ├── layout/ (Navbar, Footer, Layout)
│   │   ├── landing/ (HeroSection, CTAs, etc.)
│   │   ├── about/, contact/, faq/, legal/
│   ├── pages/ (11 routes)
│   ├── hooks/ (use-mobile, useScrollAnimation)
│   ├── lib/ (utils, contactSchema)
│   └── data/ (faqData, legalContent)
├── tailwind.config.ts
└── vite.config.ts
```

#### 24.3 All Routes

| Route | Component | Status | Description |
|-------|-----------|--------|-------------|
| `/` | Home | ✅ | Landing with hero, features, waitlist input |
| `/about` | About | ✅ | Company story, problems/solutions, vision |
| `/contact` | Contact | ✅ | Contact form (pending backend) |
| `/faq` | FAQ | ✅ | Searchable accordion |
| `/legal` | LegalHub | ✅ | Legal documents index |
| `/legal/terms` | Terms | ✅ | Terms of Service |
| `/legal/privacy` | Privacy | ✅ | Privacy Policy |
| `/legal/payments-disclaimer` | PaymentsDisclaimer | ✅ | Payments disclaimer |
| `/legal/owner-agreement` | OwnerAgreement | ✅ | Property owner agreement |
| `/legal/community-guidelines` | CommunityGuidelines | ✅ | Community standards |
| `/legal/data-rights` | DataRights | ✅ | User data rights (GDPR-style) |
| `*` | NotFound | ✅ | 404 error page |

#### 24.4 Key Components Inventory

**Landing Page Components:**
- HeroSection (parallax university images)
- AnimatedWaitlistInput (typing animation)
- InfiniteLogoSlider (24 tech logos, 2 rows on mobile)
- VelocityScroll feature grid
- VisionSection with nested card styling
- FinalCTASection

**Design System (CSS Variables):**
- Primary: #4285F4 (Roomy Blue)
- Background: warm off-white
- Gradients: pill-active, button-primary, cta-block
- Typography: System sans + Playfair Display (serif)
- Animations: blur-in, slide-up, ken-burns, float

**Key Dependencies:**
- @radix-ui/* (20+ packages)
- motion (Framer Motion)
- react-hook-form + zod
- embla-carousel-react
- sonner (toasts)
- lucide-react + react-icons

#### 24.5 Pending Backend Integrations

| Integration | Purpose | Flow | Env Var |
|-------------|---------|------|---------|
| **Mailchimp** | Waitlist signups | Form → Edge Function → Mailchimp API | `MAILCHIMP_API_KEY`, `MAILCHIMP_AUDIENCE_ID` |
| **Resend** | Contact form emails | Form → Edge Function → Resend API → team@roomylb.com | `RESEND_API_KEY` |

---

### 2. NEW SECTION: "PART 25: Email Infrastructure Strategy"

#### 25.1 Email Types and Services

| Email Type | Service | Purpose | Example |
|------------|---------|---------|---------|
| **Business Inbox** | Google Workspace | Send/receive manual emails | team@roomylb.com |
| **Transactional API** | Resend → AWS SES | Automated app notifications | "Your booking is confirmed" |
| **Marketing** | Mailchimp | Campaigns, newsletters | "Roomy is launching!" |

#### 25.2 Why Google Workspace Cannot Replace Resend

```text
Google Workspace vs Transactional Email API
─────────────────────────────────────────────

Google Workspace ($6-18/user/month):
├── ✅ Manual inbox (read/write emails)
├── ✅ Calendar, Drive, Meet
├── ❌ NO programmatic API for sending
├── ❌ SMTP limits (500/day, 100/hour)
├── ❌ Will get flagged as spam if used for bulk

Resend ($0-20/month):
├── ✅ API for automated sending
├── ✅ 3,000 free emails/month
├── ✅ 100/second sending rate
├── ✅ Delivery analytics, webhooks
├── ❌ NOT an inbox (cannot receive emails)

CONCLUSION: You need BOTH
├── Google Workspace: Your team's inbox
└── Resend: Your app's email API
```

#### 25.3 Cost Comparison (Transactional Email)

| Volume | Resend | SendGrid | AWS SES |
|--------|--------|----------|---------|
| 3,000/month | **$0** | $0 | $0 |
| 10,000/month | **$0** | $0 | $1 |
| 50,000/month | $20 | $15 | $5 |
| 100,000/month | $40 | $35 | $10 |
| 1,000,000/month | $400 | $350 | **$100** |

**Recommendation:**
- **Phase 1 (Launch):** Resend - best DX, free tier covers needs
- **Phase 2 (Scale):** AWS SES - cheapest at high volume

#### 25.4 Email Flow Architecture

```text
CONTACT FORM FLOW (waitlist.roomylb.com/contact)
───────────────────────────────────────────────

User fills form → Frontend validates (Zod)
                       │
                       ▼
              Supabase Edge Function
              (contact-form-email)
                       │
                       ▼
              Resend API (send email)
                       │
                       ▼
              team@roomylb.com (Google Workspace inbox)


WAITLIST SIGNUP FLOW (waitlist.roomylb.com)
─────────────────────────────────────────────

User enters email → Frontend validates
                       │
                       ▼
              Supabase Edge Function
              (waitlist-signup)
                       │
                       ├───────────────────────────┐
                       │                           │
                       ▼                           ▼
              Mailchimp API               Resend API
              (add to audience)           (send welcome email)
```

---

### 3. NEW SECTION: "PART 26: Domain & DNS Infrastructure"

#### 26.1 Domain Strategy

| Domain | Purpose | Status |
|--------|---------|--------|
| `roomylb.com` | Root domain | Owned (Namecheap) |
| `waitlist.roomylb.com` | Pre-launch waitlist | Pending config |
| `app.roomylb.com` | Main user application | Pending config |
| `admin.roomylb.com` | Internal admin panel | Pending config |

#### 26.2 Root Domain Redirect Logic

```text
PRE-LAUNCH (Current State):
┌─────────────────────────────────────────────────────────────────────────────┐
│  roomylb.com → REDIRECT (301) → waitlist.roomylb.com                        │
│  www.roomylb.com → REDIRECT (301) → waitlist.roomylb.com                    │
└─────────────────────────────────────────────────────────────────────────────┘

POST-LAUNCH (After app.roomylb.com is live):
┌─────────────────────────────────────────────────────────────────────────────┐
│  roomylb.com → REDIRECT (301) → app.roomylb.com                             │
│  www.roomylb.com → REDIRECT (301) → app.roomylb.com                         │
│  waitlist.roomylb.com → "We're live!" page OR redirect to app              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 26.3 DNS Migration: Namecheap → Cloudflare

**Why Cloudflare?**
- Free CDN + DDoS protection
- Faster DNS propagation (seconds vs hours)
- Better analytics
- Page Rules for redirects
- Easy subdomain management

**Migration Steps:**

```text
STEP 1: Create Cloudflare Account (10 min)
────────────────────────────────────────────
1. Go to cloudflare.com, sign up
2. Add site: roomylb.com
3. Select Free plan
4. Cloudflare scans existing DNS records

STEP 2: Update Nameservers in Namecheap (5 min)
────────────────────────────────────────────
1. Log into Namecheap
2. Go to Domain List → roomylb.com → Manage
3. Under "Nameservers", select "Custom DNS"
4. Enter Cloudflare nameservers:
   • ava.ns.cloudflare.com
   • dan.ns.cloudflare.com
5. Save changes

STEP 3: Wait for Propagation (1-24 hours)
────────────────────────────────────────────
• Usually completes in 1-4 hours
• Cloudflare shows "Active" when done
```

#### 26.4 Complete DNS Records (Cloudflare)

```text
DNS RECORDS TO CONFIGURE
════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│  TYPE    NAME        VALUE                                   TTL    PROXY   │
├─────────────────────────────────────────────────────────────────────────────┤
│  A       @           Redirect Rule (see below)              Auto   -       │
│  CNAME   www         roomylb.com                            Auto   ✓       │
│  CNAME   waitlist    cname.vercel-dns.com                   Auto   ✗ (DNS) │
│  CNAME   app         d1234.cloudfront.net (AWS)             Auto   ✗ (DNS) │
│  CNAME   admin       d5678.cloudfront.net (AWS)             Auto   ✗ (DNS) │
│  CNAME   api         abc123.execute-api.us-east-1.aws.com   Auto   ✗ (DNS) │
├─────────────────────────────────────────────────────────────────────────────┤
│  MX RECORDS (Google Workspace)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  MX      @           ASPMX.L.GOOGLE.COM                     Auto   1       │
│  MX      @           ALT1.ASPMX.L.GOOGLE.COM                Auto   5       │
│  MX      @           ALT2.ASPMX.L.GOOGLE.COM                Auto   5       │
│  MX      @           ALT3.ASPMX.L.GOOGLE.COM                Auto   10      │
│  MX      @           ALT4.ASPMX.L.GOOGLE.COM                Auto   10      │
├─────────────────────────────────────────────────────────────────────────────┤
│  EMAIL AUTHENTICATION (Resend)                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  TXT     @           v=spf1 include:_spf.google.com         Auto   -       │
│                      include:_spf.resend.com ~all                          │
│  TXT     resend._d   [DKIM record from Resend dashboard]    Auto   -       │
│  TXT     _dmarc      v=DMARC1; p=quarantine; rua=...        Auto   -       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. NEW SECTION: "PART 27: Email Migration (Zoho → Google Workspace)"

#### 27.1 Pre-Migration Checklist

```text
BEFORE MIGRATION
────────────────
☐ Export all emails from Zoho (Settings → Import/Export)
☐ Export contacts from Zoho
☐ Note all aliases and forwarding rules
☐ Inform team of migration date
☐ Cancel Zoho billing AFTER migration complete
```

#### 27.2 Migration Sequence

```text
CORRECT ORDER OF OPERATIONS
═══════════════════════════

1. MIGRATE DOMAIN TO CLOUDFLARE (Day 1)
   └── Do NOT change MX records yet
   └── Let existing Zoho emails continue working

2. SIGN UP FOR GOOGLE WORKSPACE (Day 2)
   └── Start at: workspace.google.com
   └── Verify domain ownership (TXT record in Cloudflare)
   └── Do NOT change MX records yet
   └── Import emails from Zoho to Gmail

3. VERIFY RESEND DOMAIN (Day 2)
   └── Add domain: resend.com/domains
   └── Add SPF, DKIM records to Cloudflare
   └── Verify in Resend dashboard

4. SWITCH MX RECORDS TO GOOGLE (Day 3)
   └── Remove old Zoho MX records
   └── Add Google MX records
   └── Wait 1-4 hours for propagation
   └── Test by sending email to team@roomylb.com

5. TEST RESEND SENDING (Day 3)
   └── Send test email via Resend API
   └── Verify delivery to Gmail inbox
   └── Check SPF/DKIM pass in email headers

6. CANCEL ZOHO SUBSCRIPTION (Day 7)
   └── After confirming everything works
   └── Keep backup of exported emails
```

#### 27.3 Google Workspace Setup

```text
GOOGLE WORKSPACE CONFIGURATION
═══════════════════════════════

PLAN: Business Starter ($6/user/month)
├── 30GB storage per user
├── Custom email (team@roomylb.com)
├── Google Meet (100 participants)
├── Security and management controls

ACCOUNTS TO CREATE:
├── team@roomylb.com (primary inbox)
├── support@roomylb.com (alias → team)
├── security@roomylb.com (alias → team)
├── noreply@roomylb.com (for Resend sending)

MX RECORDS (add in Cloudflare):
Priority  Server
1         ASPMX.L.GOOGLE.COM
5         ALT1.ASPMX.L.GOOGLE.COM
5         ALT2.ASPMX.L.GOOGLE.COM
10        ALT3.ASPMX.L.GOOGLE.COM
10        ALT4.ASPMX.L.GOOGLE.COM

SPF RECORD (TXT):
v=spf1 include:_spf.google.com include:_spf.resend.com ~all
```

---

## Updates to Existing Sections

### Update: PART 8 (Three-Subdomain Architecture)

Add reference to the detailed waitlist documentation:

```text
### 8.4 Waitlist Subdomain Details

For complete technical specification of the waitlist project, see PART 24.

Summary:
- 11 routes (/, /about, /contact, /faq, /legal/*)
- 50+ components
- Frontend: Complete ✅
- Backend: Mailchimp + Resend pending
```

### Update: TABLE OF CONTENTS

Add new parts:

```text
### Infrastructure & Operations (Parts 24-27) - NEW
25. [Waitlist Project Specification](#part-24-waitlist-project-specification)
26. [Email Infrastructure Strategy](#part-25-email-infrastructure-strategy)
27. [Domain & DNS Infrastructure](#part-26-domain-dns-infrastructure)
28. [Email Migration (Zoho → Google)](#part-27-email-migration)
```

---

## Files to Modify

| File | Action | Lines Added |
|------|--------|-------------|
| `.lovable/plan2.md` | Add Parts 24-27, update TOC and Part 8 | ~450 |

## Execution Summary

1. **Add** PART 24: Complete waitlist project technical spec
2. **Add** PART 25: Email infrastructure strategy (Resend → SES)
3. **Add** PART 26: Domain & DNS infrastructure (Cloudflare migration)
4. **Add** PART 27: Email migration guide (Zoho → Google Workspace)
5. **Update** Table of Contents
6. **Update** PART 8 with reference to Part 24

This update ensures the master plan document captures all operational infrastructure decisions alongside the application architecture.
