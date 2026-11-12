# ProducTVT

Weekly action plans, personal todos, and project management for the team — built with Next.js, Prisma, and Supabase Postgres.

## Stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS + shadcn-style components
- Prisma ORM → PostgreSQL (Supabase in production, any Postgres locally)
- Auth.js (NextAuth v5) — username/password, admin-provisioned accounts
- Deployed on Vercel; a `Dockerfile` is included for a future self-hosted (e.g. GCP) move

## Run with biztel

```bash
biztel run productvt      # next dev
biztel compile productvt  # next build
biztel start productvt    # next start
biztel stop productvt     # or Ctrl+C in its terminal
```

`biztel status` lists what is running, with its links. Inside the folder the name can be left out: `biztel run`.

biztel runs `npm install` first if `node_modules` is missing; the database setup below is still needed.

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

## Day Tracker (merged in)

**Day Tracker** in the sidebar (`/day`) is the old Day Tracker page: timers, goals, day view, last 7 days, streak, reminders, fullscreen timer, backup. It is `public/day-tracker.html` in an iframe, saves to the `DayState` table through `/api/day/*`, and follows the app's light/dark theme. Its todo card is the same `Todo` table as the Todos page. Run `npm run db:deploy` once for the new tables.

To feed it detected activity (browser, VS Code, desktop apps), make a token in **Settings → Day Tracker hub** and start the local hub (in the day-tracker repo) with `REMOTE_URL=https://<this app> REMOTE_TOKEN=<token>`.

## Top-bar todos (this Linux machine)

`tray/productvt-tray.py` puts your todos in the GNOME top bar, in the same glass panel style as the Day Tracker tray. **Super + Shift + T** (or middle-clicking the icon) opens a panel to add todos, tick them off, and add or remove each one from this week's plan with the small calendar button. The calendar next to the input box puts a new todo straight onto the plan.

It writes straight to the database using the connection string in `.env`, so it only works on a machine that has that file. The first time, it asks for your ProducTVT username; settings are in `~/.config/productvt-tray/config.json` (set `appUrl` to get an "Open ProducTVT" button).

```sh
cp tray/productvt-tray.desktop ~/.config/autostart/   # start at login
python3 tray/productvt-tray.py &                      # start now
```

For a one-click top-bar button (the logo plus how many todos are left), install the GNOME Shell extension in `tray/gnome-extension`. While it's on, the script hides its own AppIndicator icon, which can only open a menu:

```sh
ln -s ~/Projects/ProductVT/tray/gnome-extension ~/.local/share/gnome-shell/extensions/productvt-todos@chetakk
gnome-extensions enable productvt-todos@chetakk    # then Alt+F2, type r, Enter (X11) to reload the shell
```

Bind **Super + Shift + T** to `tray/toggle.sh` under Settings → Keyboard Shortcuts → Custom Shortcuts. Needs `python3-psycopg2` and `gir1.2-appindicator3-0.1`.
