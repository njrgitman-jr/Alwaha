# الواحة لأنظمة المياه — Alwaha Water System

موقع إلكتروني عربي RTL لبيع فلاتر المياه مع لوحة تحكم كاملة.
Full-stack Arabic RTL e-commerce site for water filters with a complete admin dashboard.

## Stack

- **Frontend:** Vite + React 19 + TypeScript + Tailwind CSS 3 + React Router
- **Backend:** Node.js + Express 5 + Knex + SQL Server (`mssql`) + JWT auth + Zod
- **Mode toggle:** `USE_JSON_FALLBACK=true` makes the server read/write a JSON file
  instead of SQL Server — useful for demos and dev before the DB is ready.

## Project layout

```
AHMAD/
├── client/           Frontend (Vite + React + TS)
│   ├── src/
│   │   ├── pages/    Home, Product, Category, Contact
│   │   ├── admin/    AdminLogin, AdminDashboard, PackagesAdmin, AccessoriesAdmin, SettingsAdmin
│   │   ├── components/  Header, Footer, FloatingActions
│   │   ├── data/site.ts     Static fallback catalog (mirrors what brief contained)
│   │   ├── lib/api.ts       Typed HTTP client for the backend
│   │   └── lib/useCatalog.ts  Hook that prefers API, falls back to static
│   └── ...
└── server/           Backend (Express + Knex + mssql)
    ├── src/
    │   ├── index.ts         App entry, routes mounted at /api
    │   ├── routes/public.ts Public catalog endpoints
    │   ├── routes/auth.ts   POST /api/auth/login
    │   ├── routes/admin.ts  Authed CRUD on packages, accessories, settings
    │   ├── auth.ts          JWT sign/verify, requireAuth middleware
    │   ├── store.ts         Unified data layer (DB OR JSON fallback)
    │   └── db.ts            Knex instance
    ├── db/
    │   ├── migrations/      Knex schema migrations
    │   ├── seeds/01_seed.ts Populates DB from seed-data.json
    │   ├── seed-data.json   Source-of-truth seed (also used in JSON-fallback mode)
    │   └── runtime-data.json  (auto-created) writes go here in fallback mode
    ├── knexfile.ts
    ├── .env.example
    └── .env                 (created — fill DB_PASSWORD before db:setup)
```

## Run it locally

### 1. Install (once)

```powershell
# from C:\Users\JR_PC\Desktop\AHMAD
cd client; npm install; cd ..
cd server; npm install; cd ..
```

### 2. Start backend (port 4000)

```powershell
cd server
npm run dev
```

It starts in **JSON-fallback mode** by default, so you don't need SQL Server running
to see a working site.

### 3. Start frontend (port 5173)

```powershell
cd client
npm run dev
```

Open http://localhost:5173 in your browser.

### 4. Admin dashboard

- URL: http://localhost:5173/admin/login
- Default credentials (JSON-fallback mode): **`admin` / `admin123`**
- Change `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `server/.env` before deploying.

## Switching from JSON fallback to SQL Server

1. Make sure SQL Server (or SQL Server Express) is running and the
   `DAC_Website` database exists (or change `DB_NAME`).
2. In `server/.env`:
   - Set `DB_PASSWORD` to the real password (the one from the brief is **NOT** safe — rotate it).
   - Set `USE_JSON_FALLBACK=false`.
3. Run migrations + seed:
   ```powershell
   cd server
   npm run db:setup
   ```
4. Restart the backend. It now reads/writes from SQL Server.

To reset:
```powershell
npm run db:rollback ; npm run db:setup
```

## Important: secrets hygiene

The brief originally contained `DB_PASSWORD=swo@123456` in plain text. **That
password must be rotated** — assume it is compromised. After rotating, set the
new value only in `server/.env` (which is gitignored). Never put real passwords
into Word/PDF documents that get shared by email or messaging apps.

## API quick reference

Public (no auth):
- `GET /api/health` — `{ ok, mode }`
- `GET /api/settings` — site-wide settings (name, phones, social, etc.)
- `GET /api/categories` — list of categories
- `GET /api/packages?category=<slug>` — filter packages
- `GET /api/packages/:slug` — single package
- `GET /api/accessories?category=<slug>` — filter accessories

Auth:
- `POST /api/auth/login` — `{ username, password }` → `{ token }`

Admin (Bearer JWT required):
- `GET/PUT/DELETE /api/admin/packages[/:slug]`
- `GET/PUT/DELETE /api/admin/accessories[/:slug]`
- `GET/PUT       /api/admin/settings`

## Production checklist (before going live)

- [ ] Rotate SQL Server password and update `.env`
- [ ] Set strong `JWT_SECRET` (32+ random chars)
- [ ] Set strong `ADMIN_PASSWORD`
- [ ] `DB_ENCRYPT=true`, `DB_TRUST_SERVER_CERTIFICATE=false` (use a real cert)
- [ ] `USE_JSON_FALLBACK=false`
- [ ] Add HTTPS in front of the backend (nginx / IIS / Caddy)
- [ ] Set `CLIENT_ORIGIN` to the real domain
- [ ] Build the frontend: `cd client; npm run build` → serve `dist/` from your web server
- [ ] Confirm Arabic font (Cairo) loads from Google Fonts or self-host it
- [ ] Set up nightly backup of SQL Server `DAC_Website` database
- [ ] Test the WhatsApp click-to-chat link from a real phone

## Catalog content (seeded from the brief)

| Category | Item | Price |
|---|---|---|
| Home | 7-stage Taiwan filter package | 135 JD (was 150) |
| Home | 6-stage Taiwan premium package | 150 JD (was 175) |
| Home | 7-stage Vietnamese economy | 90 JD (was 120) |
| Central | Triple jumbo filter | السعر عند الطلب |
| Central | Tanks (Taiwan 5gal / Chinese 4gal / 3.2gal) | عند الطلب |
| Central | Faucets (Chinese light / chrome / steel 304) | عند الطلب |
| Central | TDS meter | 9 JD (free delivery) |
| Central | PH meter + magic 8L bottle | 12 JD (free delivery) |
| Central | Vietnamese cartridge set | 3 JD |
| Industrial | — | (admin adds later) |

Everything is editable from `/admin` — no code changes needed to update prices, add
packages, or change phone numbers.

## Contact

- WhatsApp: 0788585989
- Phone: 0789033544
- Email: Alwaha.water.sys@gmail.com
- Facebook: https://www.facebook.com/texas.water.system/
