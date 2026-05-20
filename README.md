# Kim's Kitchen

A full-stack meal prep ordering and nutrition tracking web application.

## Tech Stack

- **Next.js 16** (App Router) — TypeScript
- **Tailwind CSS v4** — CSS-based theme tokens
- **Prisma 7** with `@prisma/adapter-pg` — PostgreSQL via driver adapter
- **NextAuth.js** — Credentials provider + JWT sessions
- **Zustand** — Client cart & eaten log state
- **Recharts** — Macro dashboards and charts
- **React Hook Form + Zod** — Form validation

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Update `.env.local` with your PostgreSQL connection string:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/kims_kitchen"
NEXTAUTH_SECRET="change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Generate Prisma client

```bash
npx prisma generate
```

### 4. Push schema to database

```bash
npx prisma db push
```

### 5. Seed the database

```bash
npx prisma db seed
```

Creates:
- **Admin** — `admin@kimskitchen.com` / `admin123`
- **Customer** — `jane@example.com` / `user123`
- **Week 21** (May 19–25, 2026) with 12 meals

### 6. Start dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Pages

| Route | Description | Auth |
|-------|-------------|------|
| `/menu` | Weekly menu + cart sidebar | Public |
| `/orders` | Order history | Required |
| `/eaten` | Daily food log + weekly summary | Required |
| `/dashboard` | Macro charts (today / week) | Required |
| `/admin` | Order management, meal CRUD | Admin only |
| `/login` | Sign in | — |
| `/register` | Create account | — |

## Key Features

- **Minimum 10 meals** enforced client + server side
- **Live hero stats** — cart count, calories, protein update in real-time
- **Category filters** — High Protein, Low Calorie, High Fibre, Vegetarian, Balanced
- **Macro tracking** — Calories, Protein, Carbs, Fat, Fibre, Sodium per meal/day/week
- **Goal progress rings** (SVG) and animated progress bars
- **Admin panel** — status dropdowns, meal CRUD form, week activation
- **JWT authentication** with role-based access (ADMIN / CUSTOMER)
- **Skeleton loaders** on every route segment

## Notes for Production

- Replace `NEXTAUTH_SECRET` with a strong random value
- Set `NEXTAUTH_URL` to your domain
- Use connection pooling (e.g. Prisma Accelerate or PgBouncer)
