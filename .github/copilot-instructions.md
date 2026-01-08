## Diamond Connect — Copilot Instructions

Use this file to quickly orient an AI coding agent to the repository layout, how services integrate, and the exact dev/run commands that work locally.

## 1. Architecture Overview (3 Services)

**diamond-connect-api/** — Node/Express backend
- Entry: `server.js` (port 5001)
- Routes: `routes/*Routes.js` map to `controllers/*.js` (thin routes, fat controllers pattern)
- Database: PostgreSQL via `db.js` pool; migrations managed with `node-pg-migrate`
- WebSockets: `websocket.js` initializes Socket.IO; `server.js` attaches `req.io` to all requests
- Auth: JWT-based with refresh tokens (`authMiddleware.js` verifies and fetches user from DB)
- File uploads: Cloudinary (via `fileUpload.js` and `faceUpload.js`), local `/uploads` for static files

**diamond-app-web/** — React + Vite + Capacitor (mobile + web)
- Entry: `src/main.jsx`
- API client: `src/api/axiosConfig.js` (auto-detects `VITE_API_URL` or defaults to Render production URL)
- Auth flow: Stores `token` + `refreshToken` in localStorage; auto-refreshes on 401 via `POST /api/auth/refresh`
- Socket.IO client connects for real-time events (listings, demands, notifications)

**diamond-ai-service/** — Flask ML service (port 5002)
- Entry: `app.py`
- Training: Auto-trains RandomForest from `diamonds.csv` on startup; saves to `diamond_model.pkl`
- Endpoints: `/predict`, `/analyze-pdf`, `/fetch-certificate`
- Mappings: `CUT_MAP`, `COLOR_MAP`, `CLARITY_MAP` convert text to numeric features

## 2. Critical Integration Points

**Database** (`db.js`)
- Expects `DATABASE_URL` env var (throws if missing)
- **Supabase SSL fix**: If URL contains `supabase.co`, SSL is enabled with `rejectUnauthorized: false` — DO NOT remove this
- Use `db.query(text, params)` for simple queries or `db.connect()` for transactions

**WebSockets** (`websocket.js` + `server.js`)
- `server.js` attaches `req.io` to all requests → controllers emit events via `req.io.emit('event-name', data)`
- Auth: Middleware strips "Bearer " prefix, verifies JWT, checks `is_suspended`, `email_verified`, `is_verified`
- Common events: `'listing-interest-received'`, `'new-demand'`, `'profile-updated'`, `'user-created'`

**Auth Flow**
- Frontend: `axiosConfig.js` attaches `Authorization: Bearer <token>` on all requests
- Backend: `authMiddleware.js` verifies token, fetches user from DB, attaches to `req.user`
- Refresh: On 401, frontend POSTs refresh token to `/api/auth/refresh`, updates localStorage + axios headers

**File Uploads**
- Cloudinary: `fileUpload.js` for general uploads (profile photos, listing images, PDFs), `faceUpload.js` for profile photos with face detection
- Local: `uploads/` directory created on server startup, served at `/uploads` via `express.static`
- Face validation: `faceUpload.js` uses face-api.js (optional dependency) to validate exactly 1 face in profile photos

**Rate Limiting** (`server.js`)
- Prefers Redis-backed limiter if `REDIS_URL` is set and `express-rate-limit`, `rate-limit-redis`, `redis` packages installed
- Falls back to in-memory limiter (dev only) if Redis unavailable
- Configurable: `RATE_WINDOW_MS` (default 15min), `RATE_MAX` (default 300 req/window)

## 3. Local Development Setup

**Prerequisites**: Node 16+, Python 3.10+, Docker (optional for local Postgres/Redis)

**Start Database** (optional Docker Compose):
```bash
docker-compose up -d  # starts postgres:5432 & redis:6379
```

**Start API** (dev):
```bash
cd diamond-connect-api
npm install
export DATABASE_URL="postgres://user:pass@localhost:5432/diamond_db"
export JWT_SECRET="your_long_random_secret"
export REDIS_URL="redis://localhost:6379"  # optional
npm run dev  # nodemon -> server.js on port 5001
```

**Database Migrations**:
```bash
cd diamond-connect-api
npm run db:migrate        # apply migrations (node-pg-migrate up)
npm run db:migrate:down   # rollback last migration
npm run db:create <name>  # create new migration file
```

**Start Frontend** (dev):
```bash
cd diamond-app-web
npm install
export VITE_API_URL="http://localhost:5001"  # point to local API
npm run dev  # vite dev server on port 5173
```

**Start AI Service** (dev):
```bash
cd diamond-ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py  # Flask on port 5002
```

## 4. Project-Specific Conventions

**Naming**:
- DB columns: `snake_case` (`user_id`, `listing_id`, `demand_id`, `created_at`)
- Routes/controllers: Match DB naming (e.g., `listingId` in URL params → `listing_id` in queries)

**Route → Controller Pattern**:
- Routes are thin: define endpoints + attach middleware → delegate to controller
- Example: `routes/listingRoutes.js` → `controllers/listingController.js`
- Middleware order matters: `verifyToken` → role checks (`isTrader`, `isAdmin`) → file upload → controller

**Error Handling**:
- Controllers call `next(err)` to forward errors to centralized handler (last middleware in `server.js`)
- Centralized handler returns JSON: `{ message: err.message || 'Internal server error' }`

**Socket Events from Controllers**:
- Always check `if (req.io)` before emitting (safe for testing/environments without WebSocket)
- Example: `if (req.io) req.io.emit('listing-deleted', { listingId: id });`

## 5. Production Environment Requirements

**Required Env Vars** (API refuses to start in production if missing):
- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — Strong random value (min 32 chars recommended)
- `ALLOWED_ORIGINS` — Comma-separated allowed origins (must NOT be `*` in production)

**Optional but Recommended**:
- `REDIS_URL` — For Redis-backed rate limiting (required for production-grade limiter)
- `AI_SERVICE_URL` — URL of AI service (e.g., `https://ai.example.com`)
- `CLOUDINARY_*` — Cloud_name, API_key, API_secret (for file uploads)
- `EMAIL_*` — SMTP config for email notifications (user, pass, from)

**Production Checks** (`server.js`):
- Validates `ALLOWED_ORIGINS` is not `*` in production
- Validates `JWT_SECRET` is present
- Logs warnings for missing optional deps (Redis, face-api models)

## 6. Common Tasks Quick Reference

**Add API Route**:
1. Create route in `routes/*Routes.js` (or add to existing)
2. Attach middleware (`verifyToken`, role checks, file upload)
3. Create controller method in `controllers/*.js`
4. Use `db.query` for DB ops, `next(err)` for errors, `req.io.emit` for real-time events

**DB Query Pattern**:
```javascript
const { rows } = await db.query('SELECT * FROM users WHERE user_id = $1', [userId]);
```

**Transaction Pattern**:
```javascript
const client = await db.connect();
try {
  await client.query('BEGIN');
  // ... queries
  await client.query('COMMIT');
} catch (err) {
  await client.query('ROLLBACK');
  throw err;
} finally {
  client.release();
}
```

**Emit Socket Event**:
```javascript
if (req.io) req.io.emit('event-name', { key: 'value' });
```

**Frontend API Call** (`axiosConfig.js` auto-handles auth):
```javascript
import apiClient from '../api/axiosConfig';
const response = await apiClient.get('/api/listings');
```

## 7. Testing & Validation

**Lint Frontend**:
```bash
cd diamond-app-web && npm run lint
```

**Test API Endpoints**:
- Health check: `GET http://localhost:5001/health`
- Use Postman or curl with `Authorization: Bearer <token>` header

**DB Migrations**:
- Always test migrations in dev before production: `npm run db:migrate`
- Ensure backward-compatible changes; seed required data in `seed.js`

## 8. Key Files to Reference

- **API structure**: `server.js` (middleware order, WebSocket setup, rate limiting)
- **DB connection**: `db.js` (Supabase SSL logic, pool config)
- **Auth middleware**: `middleware/authMiddleware.js` (JWT verification, user fetch)
- **WebSocket auth**: `websocket.js` (token verification, user status checks)
- **Frontend API client**: `src/api/axiosConfig.js` (auto-refresh, base URL detection)
- **File uploads**: `middleware/fileUpload.js`, `middleware/faceUpload.js` (Cloudinary integration, face detection)
- **AI service**: `app.py` (model training, PDF parsing, prediction endpoint)

For questions about specific patterns (e.g., common SQL queries, socket event naming, controller scaffolding), reference existing controllers or ask for examples.
