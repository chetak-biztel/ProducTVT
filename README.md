# ProductVT

Weekly action plans, personal todos, and project management for the team — built with Next.js, Prisma, and Supabase Postgres.

## Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS + shadcn-style components
- Prisma ORM → PostgreSQL (Supabase in production, any Postgres locally)
- Auth.js (NextAuth v5) — username/password, admin-provisioned accounts
- Deployed on Vercel; a `Dockerfile` is included for a future self-hosted (e.g. GCP) move

## Local setup

1. Copy `.env.example` to `.env` and fill in a database connection (see below).
2. Install dependencies and generate the Prisma client:
   ```bash
   npm install
   ```
3. Run migrations and seed the database (creates the first Founder account, default plan statuses, and example categories):
   ```bash
   npm run db:migrate
   npm run db:seed
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in with the `SEED_FOUNDER_USERNAME` / `SEED_FOUNDER_PASSWORD` from your `.env`.

### Database options

- **Supabase (recommended, matches production):** create a project, then copy the pooled connection string into `DATABASE_URL` and the direct connection string into `DIRECT_URL` from Project → Settings → Database.
- **Local Postgres via Docker:** `docker run -d --name productvt-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=productvt -p 5432:5432 postgres:16-alpine`, then point both `DATABASE_URL` and `DIRECT_URL` at `postgresql://postgres:postgres@localhost:5432/productvt`.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Create/apply a Prisma migration (dev) |
| `npm run db:deploy` | Apply migrations in production |
| `npm run db:seed` | Re-run the seed script |
| `npm run db:studio` | Open Prisma Studio to browse the database |

## Deploying

- **Vercel:** connect the repo, set the env vars from `.env.example`, and run `npm run db:deploy` once against the production database (or add it as a build step).
- **Self-hosted / GCP:** build the included `Dockerfile`, which produces a standalone Next.js server image.

## Admin basics

- The first Founder account comes from the seed script — sign in and create real accounts under **Admin → Users** (accounts are admin-provisioned; there's no public sign-up).
- **Admin → Board config** manages the plan statuses, category tags, and the app's accent color.
