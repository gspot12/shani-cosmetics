# שני קוסמטיקס — Shani Cosmetics Booking System

A full-featured appointment booking and business management system for a beauty salon, built with Next.js 16, Prisma, and SQLite.

---

## Overview / סקירה

**Hebrew:** מערכת ניהול תורים ועסק לסלון קוסמטיקה. כוללת הזמנה עצמית ללקוחות, ניהול צוות, שירותים, תבניות הודעות, ורשימת המתנה.

**English:** A modern booking management system featuring:
- Client-facing appointment booking (no login required, OTP via WhatsApp/SMS)
- Staff & schedule management
- Service categories and pricing
- WhatsApp message templates
- Waitlist management
- Admin dashboard with full CRUD
- Audit logs and notification system

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Database | SQLite (via Prisma 7) |
| ORM | Prisma Client |
| Auth | NextAuth v4 + Jose JWT |
| UI | Tailwind CSS v4 + Radix UI |
| Forms | React Hook Form + Zod |
| State | Zustand |
| Date handling | date-fns |

---

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- ts-node (`npm install -g ts-node` or install as devDependency)

---

## Setup Instructions

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in values:

```bash
cp .env.example .env.local
```

Required variables (see **Environment Variables** section below).

### 3. Generate Prisma client & run migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Seed the database

```bash
npm run seed
# or
npx prisma db seed
```

This creates:
- Business settings for "שני קוסמטיקס"
- Admin user (see credentials below)
- 3 staff members: שני, מאיה, לינוי
- 3 service categories + 17 services
- Working hours (Sun–Thu 09:00–19:00, Fri 09:00–14:00)
- 7 WhatsApp message templates

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The admin panel is at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@shani.local` |
| Password | `Admin123456!` |
| Role | SUPER_ADMIN |

**Change these credentials immediately in production.**

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="your-very-long-random-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT (for client-facing booking tokens)
JWT_SECRET="your-jwt-secret-here"

# WhatsApp / SMS (optional — for sending messages)
# WHATSAPP_API_URL="https://api.yourprovider.com"
# WHATSAPP_API_KEY="your-api-key"

# Email (optional)
# SMTP_HOST="smtp.example.com"
# SMTP_PORT="587"
# SMTP_USER="your@email.com"
# SMTP_PASS="your-smtp-password"
# SMTP_FROM="שני קוסמטיקס <no-reply@shani.com>"
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run seed` | Seed the database |

---

## Project Structure

```
shani/
├── app/                    # Next.js App Router
│   ├── (admin)/            # Admin panel routes
│   ├── (booking)/          # Client-facing booking flow
│   ├── api/                # API Route Handlers
│   └── layout.tsx
├── components/             # Shared React components
│   └── ui/                 # Radix-based UI primitives
├── lib/                    # Utilities & server helpers
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client singleton
│   └── validations/        # Zod schemas
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Seed script
│   └── migrations/         # Migration history
└── public/                 # Static assets
```

---

## Production Deployment

### Vercel (recommended)

1. Push to GitHub.
2. Import project on [vercel.com](https://vercel.com).
3. Set all environment variables in the Vercel dashboard.
4. For SQLite in production, consider switching to **Turso** (libSQL) or **PostgreSQL** (update `datasource` in `schema.prisma` and re-migrate).

### Self-hosted (Node.js server)

```bash
npm run build
npm run start
```

Make sure `DATABASE_URL` points to a persistent volume — SQLite's `.db` file must survive deployments.

### Switching to PostgreSQL for production

1. Update `schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set `DATABASE_URL` to your Postgres connection string.
3. Run `npx prisma migrate deploy`.
4. Run `npm run seed`.

---

## License

Private project — all rights reserved © שני קוסמטיקס
