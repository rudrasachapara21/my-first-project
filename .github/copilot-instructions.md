## Diamond Connect — Copilot Instructions

Use this file to quickly orient an AI coding agent to the repository layout, how services integrate, and the exact dev/run commands that work locally.

1) Big picture (3 services)
- `diamond-connect-api/` — Node/Express API (primary backend). Entry: `server.js`. Routes live in `routes/`, business logic in `controllers/`. Uses PostgreSQL (see `db.js`) and Socket.IO (see `websocket.js`).
- `diamond-app-web/` — React + Vite + Capacitor mobile/web client. Entry: `src/main.jsx`. Uses `src/api/axiosConfig.js` for HTTP; this file autodetects `VITE_API_URL` or falls back to the Render production URL.
- `diamond-ai-service/` — Small Flask service for training & price prediction. Entry: `app.py`. Uses `diamonds.csv` to train a RandomForest on startup and exposes `/predict`, `/analyze-pdf`, and `/fetch-certificate`.

2) Important integration points & patterns
- Database: `diamond-connect-api/db.js` expects `DATABASE_URL` env var. It has a special Supabase check: if the URL contains `supabase.co`, SSL is enabled (`rejectUnauthorized: false`). Do not remove this logic if deploying to Supabase.
- Uploads: `server.js` will create an `uploads/` directory on startup and serves static files at `/uploads`.
- Websockets: `websocket.js` initializes Socket.IO and `server.js` attaches the io object to `req.io` so controllers can emit events directly (look for `req.io.emit` usages).
- Auth & tokens: frontend stores `token` and `refreshToken` in `localStorage`; `src/api/axiosConfig.js` automatically attaches `Authorization: Bearer <token>` and attempts token refresh via POST to `/api/auth/refresh` on 401.
- Error handling: Express error handler is registered last in `server.js`. Routes should forward errors to `next(err)` so centralized handler returns JSON.

3) How to run locally (exact commands)
- Start API (dev):
  - cd diamond-connect-api
  - npm install
  - export DATABASE_URL="postgres://user:pass@host:port/dbname"  # required
  - npm run dev    # uses nodemon -> server.js
- Start frontend (dev):
  - cd diamond-app-web
  - npm install
  - npm run dev    # vite development server
  - To point to local API: set VITE_API_URL in your environment or `.env` (Vite): `VITE_API_URL=http://localhost:5001`
- Start AI service (dev):
  - cd diamond-ai-service
  - python3 -m venv .venv && source .venv/bin/activate
  - pip install -r requirements.txt
  - python app.py    # runs Flask server on PORT (default 5002)
  - Note: `train_model_from_csv()` runs on startup if `diamonds.csv` exists.

4) Quick endpoints & examples
- API health: GET http://localhost:5001/health (defined in `server.js`).
- Example AI predict (JSON): POST http://localhost:5002/predict
  - Body: {"carat":1.2, "cut":"Ideal", "color":"G", "clarity":"VS1"}
- Example: frontend base config: `diamond-app-web/src/api/axiosConfig.js` uses `VITE_API_URL` or `https://diamond-connect-backend.onrender.com`.

5) Project-specific conventions to preserve
- Routes are thin: `routes/*` map to endpoints and call `controllers/*` for logic. Follow existing pattern when adding features.
- Middleware files live under `middleware/` (e.g., `authMiddleware.js`, `fileUpload.js`, `errorHandler.js`) — attach them in routes consistently.
- Controllers and routes use snake_case for DB column names and `demand_id`/`listing_id` style IDs; keep consistency when writing DB queries.

6) Where to look first for common tasks
- Add an API route: `diamond-connect-api/routes/*Routes.js` -> corresponding `diamond-connect-api/controllers/*.js`.
- Emit socket events from controller: use `req.io.emit(...)` (see `server.js` attaching `req.io`).
- DB queries: `diamond-connect-api/db.js` and `controllers/*` (use `db.query` or `db.connect()` for transactions).
- Frontend: `diamond-app-web/src/api/axiosConfig.js` (auth + refresh), `src/pages` and `src/components` for UI patterns.
- AI: `diamond-ai-service/app.py` for parsing PDFs and mapping text fields (`CUT_MAP`, `COLOR_MAP`, `CLARITY_MAP`). `diamonds.csv` is the canonical training data.

7) Short checklist for PR changes
- Run `npm run lint` in `diamond-app-web/` for frontend style checks.
- Verify API routes with `GET /health` and any new route using Postman or curl.
- Ensure migrations / DB changes are backward-compatible; update `seed.js` if you add required data.

If anything above is unclear or you want more examples (e.g., common SQL patterns, typical socket event names, or controller stubs), tell me which area to expand and I'll iterate.
