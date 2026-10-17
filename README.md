# Incident Map — Verified Global Incidents Database

A Next.js application providing a searchable database and global map of verified incidents affecting Christians worldwide.

Built strictly under the core principle: **Nothing goes public without human review.** Public routes read only from verified records with `status = 'published'`.

---

## Tech Stack (Phase 1)

- **Framework**: Next.js (App Router, Turbopack, TypeScript)
- **Database**: Neon Postgres with PostGIS extension
- **ORM & Migrations**: Drizzle ORM (`drizzle-orm`) & Drizzle Kit (`drizzle-kit`)
- **Authentication**: Auth.js / NextAuth v5 with role sessions (`admin`, `reviewer`, `publisher`, `submitter`)
- **Validation**: Zod (strict server and schema validation)
- **Styling**: Tailwind CSS & Lucide React

---

## Hard Rules Enforced in Code

1. **Privacy & Anonymity**: No fields exist for victim names or exact street addresses. Only approximate coordinates (`lat`, `lng`), administrative region/district, and location precision are recorded.
2. **Publishing Gates**: An incident **cannot** be published unless:
   - It has at least **2 independent sources** attached.
   - Its verification level is **Level 2 or Level 3**.
   - The user holds the **`publisher`** role.
   *(All three rules are strictly enforced on the server).*
3. **Auditability**: Every change to an incident writes an immutable record to `incident_changes`.
4. **Retractions**: Retracted incidents are never deleted; they remain permanently visible with the editorial retraction reason.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Open `.env` and configure your credentials:
```env
# Neon Postgres Connection URL with SSL
DATABASE_URL="postgresql://user:password@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Auth.js Secret (generate with `npx auth secret` or `openssl rand -base64 32`)
AUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

> **PostGIS Requirement**: Ensure the PostGIS extension is enabled in your database. The migration script executes `CREATE EXTENSION IF NOT EXISTS postgis;` automatically.

### 3. Generate & Apply Database Migrations
Push schema tables and indexes to your database:
```bash
npm run db:push
```
Or run the generated migration file directly:
```bash
npm run db:migrate
```

### 4. Seed the Database
Populate the database with the pre-configured role accounts and 5 fake sample incidents:
```bash
npm run db:seed
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seed Accounts & Roles

All seeded accounts use password: **`Password123!`**

| Email | Role | Capabilities |
| :--- | :--- | :--- |
| `admin@example.com` | `admin` | Full administrative oversight, user management, and audit inspection |
| `reviewer@example.com` | `reviewer` | Review intake leads, edit draft incidents, assign verification levels |
| `publisher@incidentmap.local` | `publisher` | Authorized to transition verified draft/in-review incidents to `published` |
| `submitter@incidentmap.local` | `submitter` | Ingest initial incident leads into review queue |

---

## Sample Data (5 Seeded Incidents)

All sample records are explicitly labeled with `[SAMPLE DATA]` in all textual summaries:

1. **Nigeria (Church Attack)**
   - Status: `published` | Level: 2 | Sources: 2
   - Complies with all publication rules; displayed on public landing page.
2. **Pakistan (Blasphemy Prosecution)**
   - Status: `published` | Level: 3 | Sources: 2
   - Confirmed by legal/court docket; displayed on public landing page.
3. **Iran (Arrest / Detention)**
   - Status: `in_review` | Level: 2 | Sources: 2
   - Internal review in progress; hidden from public site until publisher approves.
4. **India (Property Destruction)**
   - Status: `draft` | Level: 1 | Sources: 1
   - **Publish Blocked**: Fails the dual-source and Level ≥ 2 threshold.
5. **DR Congo (Kidnapping)**
   - Status: `retracted` | Level: 2 | Sources: 2
   - Maintained in database with public retraction reason logged in `incident_changes`.

---

## What to Check in Phase 1

1. **Landing Page (`/`)**:
   - Verify that only the 2 `published` sample incidents appear.
   - Draft, In-Review, and Retracted items are excluded from public view.
2. **Authentication (`/login`)**:
   - Use the quick-fill buttons to sign in as **Reviewer** (`reviewer@example.com`).
   - Sign in as **Admin** (`admin@example.com`).
   - Sign in as **Publisher** (`publisher@incidentmap.local`).
3. **Admin Verification Dashboard (`/admin`)**:
   - Verify that the active user's role is correctly recognized and badge displayed.
   - Review the **Server-Side Role & Rule Enforcement** diagnostics card.
   - Inspect the 5 seeded incidents and observe how the **Server Publish Gate** distinguishes eligible records from blocked records (e.g. India draft showing insufficient sources/verification level).
