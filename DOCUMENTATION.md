# 💎 Diamond Connect — Full Project Documentation

> **Version:** 1.0.0  
> **Author:** Rudra Sachapara  
> **Last Updated:** 2 March 2026  
> **Status:** Production (deployed on Render)

---

## 📌 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture & System Design](#2-architecture--system-design)
3. [Technology Stack](#3-technology-stack)
4. [Microservices Breakdown](#4-microservices-breakdown)
5. [Database Design](#5-database-design)
6. [API Endpoints & Connections](#6-api-endpoints--connections)
7. [Real-Time Communication (WebSocket)](#7-real-time-communication-websocket)
8. [AI / Machine Learning Service](#8-ai--machine-learning-service)
9. [Authentication & Security](#9-authentication--security)
10. [Third-Party Integrations & APIs](#10-third-party-integrations--apis)
11. [Mobile App (Capacitor)](#11-mobile-app-capacitor)
12. [DevOps & Deployment](#12-devops--deployment)
13. [Unique Features & Advanced Technologies](#13-unique-features--advanced-technologies)
14. [Environment Variables](#14-environment-variables)
15. [File & Folder Structure](#15-file--folder-structure)

---

## 1. Project Overview

**Diamond Connect** is a full-stack, real-time diamond trading platform designed for the diamond industry. It connects **Traders** (diamond sellers/buyers) and **Brokers** (intermediaries) through a modern web and mobile application.

### What It Does
- Traders can **list diamonds** for sale with photos, certificates, and pricing
- Traders can **post demands** (buy requests) specifying diamond specs they need
- Brokers can **express interest** in demands and submit **offers**
- Real-time **chat system** between traders and brokers via WebSocket
- **AI-powered diamond price prediction** using machine learning (Random Forest)
- **PDF certificate scanner** — upload a GIA certificate PDF and auto-extract diamond specs
- **News feed** with automatic RSS aggregation from industry sources
- **Admin dashboard** for user verification, content moderation, and analytics
- **Financial reporting** with transaction tracking
- **Email notifications** with OTP verification (Nodemailer + SMTP)
- **Face detection** for profile photo uploads using TensorFlow.js
- **Watchlist**, reviews, notifications, and support ticket system

### Who It's For
- Diamond traders who want to list/sell diamonds digitally
- Brokers who mediate between buyers and sellers
- Admins who manage the platform

---

## 2. Architecture & System Design

Diamond Connect follows a **3-tier microservices architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                            │
│                                                             │
│  ┌──────────────────┐    ┌─────────────────────────────┐   │
│  │  diamond-app-web  │    │  Mobile App (Capacitor)     │   │
│  │  React + Vite     │    │  Android / iOS              │   │
│  │  Port: 5173       │    │  (same React codebase)      │   │
│  └────────┬─────────┘    └──────────┬──────────────────┘   │
│           │           HTTP / WS      │                      │
└───────────┼──────────────────────────┼──────────────────────┘
            │                          │
┌───────────┼──────────────────────────┼──────────────────────┐
│           ▼          API LAYER       ▼                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              diamond-connect-api                      │   │
│  │         Node.js + Express + Socket.IO                 │   │
│  │                  Port: 5001                           │   │
│  └───────┬────────────────────────┬─────────────────────┘   │
│          │                        │                         │
│          ▼                        ▼                         │
│  ┌──────────────┐        ┌──────────────┐                   │
│  │  PostgreSQL   │        │    Redis      │                  │
│  │  Port: 5432   │        │  Port: 6379   │                  │
│  └──────────────┘        └──────────────┘                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
            │
            │  HTTP (internal)
            ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI LAYER                                  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             diamond-ai-service                        │   │
│  │        Python + Flask + scikit-learn                   │   │
│  │                Port: 5002                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Languages
| Language       | Usage                                        |
|----------------|----------------------------------------------|
| **JavaScript** | Backend API (Node.js), Frontend (React)      |
| **Python**     | AI/ML service (Flask, scikit-learn)           |
| **SQL**        | Database schema, migrations, queries          |
| **HTML/CSS**   | Frontend markup & styling                     |

### Frontend (`diamond-app-web`)
| Technology             | Version  | Purpose                                  |
|------------------------|----------|------------------------------------------|
| **React**              | 18.3.1   | UI framework (SPA)                       |
| **Vite**               | 5.3.1    | Build tool & dev server                  |
| **React Router DOM**   | 6.24.1   | Client-side routing                      |
| **Axios**              | 1.11.0   | HTTP client for API calls                |
| **Socket.IO Client**   | 4.8.1    | Real-time WebSocket communication        |
| **Framer Motion**      | 12.25.0  | Animations & transitions                 |
| **Three.js**           | 0.160.0  | 3D graphics & rendering                  |
| **@react-three/fiber** | 8.16.8   | React renderer for Three.js              |
| **@react-three/drei**  | 9.105.0  | Three.js helpers                         |
| **Chart.js**           | 4.5.0    | Data visualization charts                |
| **react-chartjs-2**    | 5.3.0    | React wrapper for Chart.js              |
| **Lucide React**       | 0.562.0  | Icon library                             |
| **Lottie React**       | 2.4.1    | Lottie animation rendering               |
| **React Icons**        | 5.5.0    | Icon collection                          |
| **Styled Components**  | 6.1.11   | CSS-in-JS styling                        |
| **jwt-decode**         | 4.0.0    | JWT token decoding on client             |
| **React Hot Toast**    | 2.6.0    | Toast notifications                      |
| **PDFKit**             | 0.17.2   | PDF generation on client                 |
| **Capacitor Core**     | 7.4.3    | Native mobile wrapper                    |
| **Capacitor Android**  | 7.4.3    | Android native bridge                    |
| **Capacitor iOS**      | 7.4.3    | iOS native bridge                        |

### Backend API (`diamond-connect-api`)
| Technology                 | Version  | Purpose                                |
|----------------------------|----------|----------------------------------------|
| **Node.js**                | 16+      | Runtime environment                    |
| **Express**                | 4.18.2   | Web framework                          |
| **pg (node-postgres)**     | 8.11.3   | PostgreSQL driver                      |
| **Socket.IO**              | 4.8.1    | WebSocket server for real-time chat    |
| **jsonwebtoken (JWT)**     | 9.0.2    | Authentication token management        |
| **bcrypt / bcryptjs**      | 6.0 / 2.4| Password hashing                      |
| **Multer**                 | 2.0.2    | File upload handling (multipart)       |
| **Cloudinary**             | 1.41.3   | Cloud image storage & CDN              |
| **Nodemailer**             | 7.0.12   | Email sending (SMTP + HTTP fallback)   |
| **node-cron**              | 4.2.1    | Scheduled tasks (news fetching)        |
| **rss-parser**             | 3.13.0   | RSS feed parsing for news aggregation  |
| **ExcelJS**                | 4.4.0    | Excel report generation                |
| **PDFKit**                 | 0.17.2   | PDF report generation                  |
| **express-rate-limit**     | 6.7.0    | Rate limiting middleware               |
| **rate-limit-redis**       | 2.0.0    | Redis-backed rate limiting             |
| **Redis**                  | 4.7.0    | Caching & rate-limit store             |
| **express-validator**      | 6.15.0   | Request validation                     |
| **Morgan**                 | 1.10.1   | HTTP request logging                   |
| **@vladmandic/face-api**   | 1.7.15   | Face detection in profile photos       |
| **@tensorflow/tfjs-node**  | 4.22.0   | TensorFlow runtime for face detection  |
| **canvas**                 | 2.11.2   | Node.js canvas for image processing    |
| **node-pg-migrate**        | 6.2.2    | Database schema migrations             |
| **serverless-http**        | 4.0.0    | Serverless deployment adapter          |
| **ws**                     | 8.18.3   | Low-level WebSocket support            |

### AI Service (`diamond-ai-service`)
| Technology                 | Purpose                                       |
|----------------------------|-----------------------------------------------|
| **Python 3.10+**           | Runtime                                       |
| **Flask**                  | Lightweight web framework                     |
| **Flask-CORS**             | Cross-origin request handling                 |
| **Pandas**                 | Data manipulation & CSV processing            |
| **NumPy**                  | Numerical computing                           |
| **scikit-learn**           | Machine Learning (RandomForestRegressor)      |
| **pdfplumber**             | PDF text extraction for certificate scanning  |
| **pickle**                 | Model serialization/deserialization           |
| **Gunicorn**               | Production WSGI server                        |

### Infrastructure & DevOps
| Technology        | Purpose                                          |
|-------------------|--------------------------------------------------|
| **PostgreSQL 15** | Primary relational database                      |
| **Redis 7**       | Caching, rate limiting, session store             |
| **Docker**        | Container orchestration (docker-compose)         |
| **Render**        | Production hosting (API + Frontend)              |
| **Supabase**      | Managed PostgreSQL (production option)           |
| **Cloudinary**    | Image CDN & transformation                       |
| **Git / GitHub**  | Version control                                  |

---

## 4. Microservices Breakdown

### 4.1 `diamond-connect-api` (Backend API)

The main backend service handling all business logic. Follows MVC pattern:

```
diamond-connect-api/
├── server.js           # Express app entry point, middleware, route registration
├── db.js               # PostgreSQL connection pool (supports Supabase SSL)
├── websocket.js        # Socket.IO initialization with JWT authentication
├── setup.js            # Database table creation (dev only — destructive)
├── seed.js             # Admin user seeding
├── controllers/        # Business logic (19 controllers)
│   ├── authController.js
│   ├── listingController.js
│   ├── demandController.js
│   ├── conversationController.js
│   ├── pricingController.js
│   ├── adminController.js
│   ├── transactionController.js
│   └── ... (12 more)
├── routes/             # Express route definitions (18 route files)
│   ├── auth.js
│   ├── listingRoutes.js
│   ├── demandRoutes.js
│   └── ... (15 more)
├── middleware/          # Auth, validation, file upload, face detection
│   ├── authMiddleware.js
│   ├── validators.js
│   ├── faceUpload.js       # AI face detection + Cloudinary upload
│   ├── fileUpload.js       # Standard file upload (Multer + Cloudinary)
│   └── errorHandler.js
├── services/           # External integrations
│   ├── emailService.js     # Nodemailer SMTP + HTTP fallback
│   ├── newsFetcher.js      # RSS feed aggregation (JCK, Rapaport)
│   ├── notificationService.js
│   └── pricingService.js   # (migrated to Python AI service)
├── migrations/         # SQL migrations (node-pg-migrate)
│   ├── 001_init.sql
│   └── 002_user_warnings.sql
└── models/             # Face detection model weights (TensorFlow)
    ├── tiny_face_detector_model-shard1
    └── tiny_face_detector_model-weights_manifest.json
```

### 4.2 `diamond-app-web` (Frontend)

Single-page React application with 30+ pages:

```
diamond-app-web/
├── src/
│   ├── main.jsx            # App entry point
│   ├── App.jsx             # Root component with routing
│   ├── api/
│   │   └── axiosConfig.js  # Axios instance with JWT interceptor & auto-refresh
│   ├── context/            # React Context providers
│   │   ├── AuthContext.jsx
│   │   ├── WebSocketContext.jsx  # Socket.IO provider
│   │   ├── ThemeContext.jsx
│   │   ├── NotificationContext.jsx
│   │   └── LoadingContext.jsx
│   ├── pages/              # 32 page components
│   │   ├── AuthPage.jsx
│   │   ├── TraderHome.jsx
│   │   ├── BrokerHome.jsx
│   │   ├── AIPricing.jsx       # AI price prediction UI
│   │   ├── ChatWindowPage.jsx  # Real-time chat
│   │   ├── FinancialPage.jsx   # Financial reports
│   │   ├── SellDiamonds.jsx
│   │   ├── ViewDemands.jsx
│   │   └── admin/              # Admin panel pages
│   ├── components/         # Reusable UI components
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── NotificationCenter.jsx
│   │   └── ... (15+ components)
│   ├── theme/              # Theme configuration
│   └── styles/             # Global CSS
├── android/                # Capacitor Android project
├── ios/                    # Capacitor iOS project
└── capacitor.config.json   # Mobile app config (com.diamondconnect.app)
```

### 4.3 `diamond-ai-service` (ML Service)

Standalone Python Flask microservice for diamond pricing AI:

```
diamond-ai-service/
├── app.py              # Flask server (3 routes: /predict, /analyze-pdf, /fetch-certificate)
├── train.py            # Standalone model training script (sklearn pipeline)
├── diamond_model.pkl   # Serialized trained model (RandomForestRegressor)
├── diamonds.csv        # Training dataset (Kaggle diamonds dataset)
└── requirements.txt    # Python dependencies
```

---

## 5. Database Design

**Engine:** PostgreSQL 15  
**Schema Migration:** `node-pg-migrate`

### Entity Relationship Diagram (Tables)

| Table                        | Description                                      |
|------------------------------|--------------------------------------------------|
| `users`                      | User accounts (trader/broker/admin) with roles   |
| `demands`                    | Diamond buy requests posted by traders            |
| `listings`                   | Diamond sell listings with photos & certificates  |
| `demand_interests`           | Broker interest in specific demands               |
| `offers`                     | Price offers from brokers on demands              |
| `conversations`              | Chat conversation metadata                        |
| `conversation_participants`  | Many-to-many user↔conversation                    |
| `messages`                   | Individual chat messages                          |
| `notifications`              | In-app notification records                       |
| `news`                       | Industry news articles (RSS-aggregated)           |
| `support_queries`            | User support tickets                              |
| `watchlist`                  | User's saved/bookmarked listings                  |

### Key Data Types
- `user_role` — PostgreSQL ENUM: `'trader'`, `'broker'`, `'admin'`
- `diamond_details` — JSONB (flexible diamond spec storage)
- `image_urls` — `TEXT[]` (PostgreSQL array for multiple images)
- Money fields — `NUMERIC(12,2)` for price precision
- Weight fields — `NUMERIC(12,4)` for carat precision

### Relationships
- Users → Demands (one-to-many)
- Users → Listings (one-to-many)
- Demands → Offers (one-to-many)
- Demands → Demand Interests (one-to-many)
- Users ↔ Conversations (many-to-many via `conversation_participants`)
- Conversations → Messages (one-to-many)
- Users → Notifications (one-to-many)
- Users ↔ Listings (many-to-many via `watchlist`)

---

## 6. API Endpoints & Connections

### REST API Routes (Port 5001)

| Route Prefix            | Module             | Key Operations                                  |
|-------------------------|--------------------|--------------------------------------------------|
| `/api/auth`             | Authentication     | Register, Login, OTP verify, Refresh tokens      |
| `/api/users`            | User Management    | List users, CRUD operations                      |
| `/api/profile`          | Profile            | Get/Update profile, Upload profile photo (face)  |
| `/api/listings`         | Diamond Listings   | Create/Read/Update/Delete diamond listings       |
| `/api/demands`          | Diamond Demands    | Post/View/Manage buy demands                     |
| `/api/offers`           | Offers             | Submit/Accept/Reject price offers                |
| `/api/conversations`    | Chat               | Create/Fetch conversations                       |
| `/api/search`           | Search             | Full-text search across listings & demands       |
| `/api/watchlist`        | Watchlist          | Add/Remove/View saved listings                   |
| `/api/notifications`    | Notifications      | Get/Mark-read notifications                      |
| `/api/news`             | Industry News      | Auto-aggregated RSS news feed                    |
| `/api/pricing`          | AI Pricing         | Diamond price estimation (proxies to AI service) |
| `/api/reviews`          | Reviews            | Submit/View user reviews                         |
| `/api/stats`            | Statistics         | Dashboard analytics & metrics                    |
| `/api/support`          | Support            | Submit/Track support tickets                     |
| `/api/admin`            | Admin Panel        | User verification, moderation, platform mgmt     |
| `/api/reports`          | Financial Reports  | Generate & download reports (Excel/PDF)          |
| `/api/transactions`     | Transactions       | Financial transaction records                    |
| `/health`               | Health Check       | Server health endpoint                           |
| `/api/face-detection/health` | Face API Health | Face detection model availability check     |

### AI Service Routes (Port 5002)

| Route                | Method | Description                                      |
|----------------------|--------|--------------------------------------------------|
| `/predict`           | POST   | Predict diamond price from manual input           |
| `/analyze-pdf`       | POST   | Extract specs from GIA certificate PDF & predict  |
| `/fetch-certificate` | POST   | Look up diamond by report number in CSV database  |
| `/health`            | GET    | AI service health + model load status             |

---

## 7. Real-Time Communication (WebSocket)

### Technology
- **Server:** Socket.IO 4.8.1 (on top of Node.js HTTP server)
- **Client:** socket.io-client 4.8.1

### Connection Flow
1. Client connects with JWT token in `auth` handshake
2. Server validates JWT, checks user status (not suspended, email verified, account approved)
3. User joins their personal room (`user:<user_id>`)
4. Socket.IO handles:
   - **Real-time chat messages** (send/receive)
   - **Live notifications** (new offers, demand updates)
   - **Typing indicators**
   - **Online/Offline presence**

### Security
- JWT-authenticated WebSocket handshake
- Bearer token prefix auto-stripped
- Database validation on every connection (suspended/verified checks)
- CORS-configured origins

---

## 8. AI / Machine Learning Service

### Model: RandomForestRegressor (scikit-learn)

**Algorithm:** Random Forest Regression with 50–100 estimators  
**Training Data:** `diamonds.csv` (Kaggle diamond dataset)

### Features Used for Prediction
| Feature   | Type        | Mapping                                              |
|-----------|-------------|------------------------------------------------------|
| Carat     | Numeric     | Direct float value                                   |
| Cut       | Categorical | Fair=0, Good=1, Very Good=2, Premium=3, Ideal/Excellent=4 |
| Color     | Categorical | J=0, I=1, H=2, G=3, F=4, E=5, D=6                  |
| Clarity   | Categorical | I1=0, SI2=1, SI1=2, VS2=3, VS1=4, VVS2=5, VVS1=6, IF=7, FL=8 |

### Capabilities
1. **Manual Price Prediction** — User inputs carat, cut, color, clarity → AI returns estimated USD price
2. **PDF Certificate Scanner** — Upload GIA PDF → `pdfplumber` extracts text → regex extracts specs → AI predicts price
3. **Certificate Lookup** — Search by GIA report number in local CSV database

### Model Lifecycle
- Model trains automatically on Flask app startup from `diamonds.csv`
- Trained model serialized to `diamond_model.pkl` via `pickle`
- Model can be retrained independently via `python train.py`

---

## 9. Authentication & Security

### Authentication System
- **JWT-based** authentication with access + refresh tokens
- **bcrypt** password hashing (cost factor: default)
- **Email OTP verification** for new registrations
- **Token refresh** — Axios interceptor auto-refreshes expired JWTs
- **Role-based access control** (Trader / Broker / Admin)

### Security Measures
| Feature                    | Implementation                                    |
|----------------------------|---------------------------------------------------|
| Rate Limiting              | Redis-backed (prod) / in-memory (dev), 300 req/15min |
| CORS                       | Configurable allowed origins, strict in production |
| Security Headers           | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy |
| Input Validation           | express-validator middleware                       |
| File Upload Validation     | MIME type filtering (jpeg, png, webp, tiff, heic)  |
| Face Detection             | TensorFlow.js face-api validates exactly 1 face in profile photos |
| Production Safety Checks   | Server refuses to start without required env vars  |
| SQL Injection Prevention   | Parameterized queries via node-postgres            |
| Body Size Limit            | 50MB max for image uploads                        |

---

## 10. Third-Party Integrations & APIs

| Service / API          | Usage                                                |
|------------------------|------------------------------------------------------|
| **Cloudinary**         | Image hosting, CDN delivery, on-the-fly transforms   |
| **Nodemailer + SMTP**  | Email sending (OTP codes, notifications, admin emails)|
| **RSS Feeds (JCK, Rapaport)** | Auto-fetched diamond industry news              |
| **node-cron**          | Scheduled news fetching at intervals                 |
| **Supabase**           | Managed PostgreSQL option (SSL auto-configured)      |
| **Render**             | Cloud hosting for API, frontend, AI service          |
| **TensorFlow.js**      | Server-side face detection in uploaded photos         |
| **GIA Certificate Parsing** | PDF → regex text extraction for diamond specs    |

---

## 11. Mobile App (Capacitor)

Diamond Connect ships as a **cross-platform mobile app** using Capacitor:

| Platform       | Config                              |
|----------------|-------------------------------------|
| **App ID**     | `com.diamondconnect.app`            |
| **App Name**   | Diamond Connect                     |
| **Web Dir**    | `dist` (Vite build output)          |
| **Android**    | Full native project in `android/`   |
| **iOS**        | Full native project in `ios/`       |
| **Transport**  | WebSocket with forced `websocket` transport (prevents 400 on mobile) |

The same React codebase compiles to:
- Web app (SPA)
- Android APK/AAB
- iOS IPA

---

## 12. DevOps & Deployment

### Docker Compose (Local Development)
```yaml
Services:
  db:       PostgreSQL 15 (port 5432)
  redis:    Redis 7 (port 6379)
  api:      diamond-connect-api (port 5001)
```

### Production Deployment (Render)
- **Frontend:** Static site / Web Service on Render
- **Backend API:** Web Service on Render
- **AI Service:** Separate Python Web Service
- **Database:** Supabase (managed PostgreSQL) or Render PostgreSQL

### Database Migrations
```bash
npm run db:migrate       # Run pending migrations
npm run db:migrate:down  # Rollback last migration
```

---

## 13. Unique Features & Advanced Technologies

| Feature                          | Technology                                            |
|----------------------------------|-------------------------------------------------------|
| **AI Diamond Price Prediction**  | RandomForestRegressor (scikit-learn) with auto-training |
| **PDF Certificate Auto-Scanner** | pdfplumber + regex extraction → AI prediction         |
| **Face Detection Upload Guard**  | TensorFlow.js + face-api.js on Node.js server         |
| **Real-Time Chat System**        | Socket.IO with JWT-authenticated WebSocket            |
| **3D Visual Elements**           | Three.js + React Three Fiber on frontend              |
| **Cross-Platform Mobile**        | Capacitor (Android + iOS from single React codebase)  |
| **Auto News Aggregation**        | RSS feed parsing + cron scheduling                    |
| **Redis Rate Limiting**          | Production-grade distributed rate limiting             |
| **Auto JWT Refresh**             | Axios interceptor transparently refreshes tokens      |
| **Financial Reporting**          | Excel (ExcelJS) and PDF (PDFKit) report generation    |
| **Lottie Animations**            | Animated loading states and UI feedback               |
| **Role-Based Multi-Dashboard**   | Separate Trader, Broker, and Admin experiences        |

---

## 14. Environment Variables

| Variable              | Service  | Description                                      |
|-----------------------|----------|--------------------------------------------------|
| `DATABASE_URL`        | API      | PostgreSQL connection string                     |
| `JWT_SECRET`          | API      | Secret key for signing JWTs                      |
| `PORT`                | API      | API server port (default: 5001)                  |
| `AI_SERVICE_PORT`     | AI       | AI service port (default: 5002)                  |
| `REDIS_URL`           | API      | Redis connection (optional, enables Redis limiter)|
| `ALLOWED_ORIGINS`     | API      | CORS allowed origins (comma-separated)           |
| `VITE_API_URL`        | Frontend | Backend API base URL                             |
| `CLOUDINARY_CLOUD_NAME` | API   | Cloudinary cloud name                            |
| `CLOUDINARY_API_KEY`  | API      | Cloudinary API key                               |
| `CLOUDINARY_API_SECRET` | API   | Cloudinary API secret                            |
| `SMTP_HOST`           | API      | Email SMTP host                                  |
| `SMTP_PORT`           | API      | Email SMTP port                                  |
| `SMTP_USER`           | API      | Email SMTP username                              |
| `SMTP_PASS`           | API      | Email SMTP password                              |
| `ADMIN_EMAIL`         | API      | Initial admin email for seeding                  |
| `ADMIN_PASSWORD`      | API      | Initial admin password for seeding               |
| `RATE_WINDOW_MS`      | API      | Rate limit window in ms (default: 900000)        |
| `RATE_MAX`            | API      | Max requests per window (default: 300)           |
| `FACE_DETECTION_STRICT` | API   | Reject uploads when face detection unavailable   |

---

## 15. File & Folder Structure

```
diamond-connect-project/
│
├── docker-compose.yml          # PostgreSQL + Redis + API containers
├── .env.example                # Environment variable template
├── DEVELOPER.md                # Developer quickstart guide
│
├── diamond-connect-api/        # ── BACKEND (Node.js + Express) ──
│   ├── server.js               # Main entry: Express app, middleware, routes
│   ├── db.js                   # PostgreSQL pool (Supabase SSL support)
│   ├── websocket.js            # Socket.IO with JWT auth
│   ├── setup.js                # DB table creation (dev only)
│   ├── seed.js                 # Admin user seeding
│   ├── controllers/            # 19 business logic controllers
│   ├── routes/                 # 18 Express route files
│   ├── middleware/             # Auth, validation, face detection, file upload
│   ├── services/               # Email, news fetcher, notifications, pricing
│   ├── migrations/             # SQL schema migrations
│   ├── models/                 # Face detection model weights
│   ├── scripts/                # Utility scripts (model download)
│   └── uploads/                # Local file uploads directory
│
├── diamond-app-web/            # ── FRONTEND (React + Vite) ──
│   ├── src/
│   │   ├── api/                # Axios config with JWT interceptor
│   │   ├── context/            # Auth, WebSocket, Theme, Notification, Loading
│   │   ├── pages/              # 32+ page components (inc. admin/)
│   │   ├── components/         # 20+ reusable UI components
│   │   ├── theme/              # Theme configuration
│   │   └── styles/             # Global styles
│   ├── android/                # Capacitor Android project
│   ├── ios/                    # Capacitor iOS project
│   └── capacitor.config.json   # Mobile app configuration
│
└── diamond-ai-service/         # ── AI SERVICE (Python + Flask) ──
    ├── app.py                  # Flask server (predict, analyze-pdf, certificate)
    ├── train.py                # Model training pipeline
    ├── diamond_model.pkl       # Serialized ML model
    ├── diamonds.csv            # Training dataset
    └── requirements.txt        # Python dependencies
```

---

> **Diamond Connect** — Built by Rudra Sachapara. A production-grade diamond trading platform combining full-stack web development, real-time communication, AI/ML pricing, and cross-platform mobile deployment into a single cohesive system.
