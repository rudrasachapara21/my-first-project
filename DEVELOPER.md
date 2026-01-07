# Developer Quickstart — Diamond Connect

This file describes the recommended local dev setup to run the API, frontend, and AI service together for development. It includes optional Docker Compose to run Postgres and Redis locally.

Prerequisites
- Node.js (16+ recommended)
- Python 3.10+
- Docker & docker-compose (optional, recommended for running Postgres + Redis locally)

1) Bring up Postgres + Redis (optional but recommended)
If you don't have a Postgres instance, use Docker Compose provided in this repository.

```bash
# from repo root
docker-compose up -d
# This starts `db` (Postgres) and `redis` services on default ports.
```

2) Configure environment variables
Copy the example `.env.example` to `.env` in the repo root and update values. Key variables:
- DATABASE_URL — e.g. postgres://user:password@localhost:5432/diamond_db
- JWT_SECRET — set a long random secret for production
- VITE_API_URL — frontend points to backend in dev
- REDIS_URL — optional, e.g. redis://localhost:6379

3) Start the API (development)
```bash
cd diamond-connect-api
npm install
# Optional: install Redis-backed rate limiter deps for production-like limiter
# npm install express-rate-limit rate-limit-redis redis

# Set env values (zsh):
export DATABASE_URL="postgres://user:password@localhost:5432/diamond_db"
export JWT_SECRET="a_long_random_secret"
export REDIS_URL="redis://localhost:6379" # optional

npm run dev
# API starts on http://localhost:5001

Database migrations
-------------------
We use `node-pg-migrate` for schema management. After installing dependencies run:

```bash
# from diamond-connect-api
npm install
npm run db:migrate
```

To roll back the last migration:

```bash
npm run db:migrate:down
```

Notes on packages
-----------------
For production-ready rate limiting (Redis-backed), install these optional packages inside `diamond-connect-api`:

```bash
npm install express-rate-limit rate-limit-redis redis
```

The server will automatically use Redis limiter if `REDIS_URL` is set and the packages are installed; otherwise it uses an in-memory fallback for development.

Production required environment variables
---------------------------------------
When deploying to production (e.g., Render), set the following environment variables. The API refuses to start in production if any of these are missing or insecure:

- `DATABASE_URL` — Postgres connection string (required)
- `JWT_SECRET` — strong random value used to sign JWTs (required)
- `ALLOWED_ORIGINS` — comma-separated allowed origins (must not be `*` in production)

If you need help preparing environment values for Render, tell me and I can generate a checklist for you.
```

4) Start the frontend
```bash
cd diamond-app-web
npm install
export VITE_API_URL="http://localhost:5001"
npm run dev
# Open http://localhost:5173
```

5) Start the AI service
```bash
cd diamond-ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Optional: train model once (saves diamond_model.pkl)
python train.py
python app.py
# AI service listens on 5002 by default
```

6) Notes and best practices
- The API will attempt to use Redis-backed rate limiting when `REDIS_URL` is set and the optional packages are installed. If not available, it falls back to an in-memory limiter (dev only).
- DO NOT commit production secrets. Use the `.env.example` and your deployment env configuration (Render environment variables).
- `setup.js` is destructive (drops and recreates tables) — only run it in local/dev. For production, use a migration tool and never run `setup.js` on a live DB.

7) Useful commands
- Seed admin user (the seed script reads `ADMIN_EMAIL` / `ADMIN_PASSWORD` from env):
  - `node seed.js` (run inside `diamond-connect-api` after DB is up)
- Health checks:
  - API: `GET /health` (http://localhost:5001/health)
  - AI: `GET /health` (http://localhost:5002/health)

If you want, I can add a `Makefile` or `npm` scripts that wrap these commands for one-line convenience.
