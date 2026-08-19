# AgriMart — Agricultural Marketplace

> **One marketplace, both B2C and B2B.** A farmer with a basic smartphone and no literacy can list a crop by speaking. Every user has a computed Trust Score. Escrow + Dispute Resolution as a real state machine. ONDC-ready API shape.

---

## 🎯 Why AgriMart Beats the Competition

| Platform | B2C | B2B | Farmer Sets Price | Voice First | AI Grading | Escrow + Disputes | ONDC Ready | Group Buying | Crop Doctor |
|----------|-----|-----|-------------------|-------------|------------|-------------------|------------|--------------|-------------|
| **eNAM** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Ninjacart** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **DeHaat** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **WayCool** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AgriMart** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Our Thesis (Built In, Not Bolted On)

1. **One marketplace, both B2C and B2B** — retailers, restaurants, and households transact on the same listings with the same escrow and trust system.
2. **Farmer-set pricing anchored to live APMC benchmark rates** — not platform-dictated pricing.
3. **Voice-first onboarding and listing (KisanVani)** — a farmer with a basic smartphone and no literacy can list a crop by speaking in Kannada/Hindi/English.
4. **Trust & Fraud layer built into the core loop** — computed Trust Score (completion rate, verification status, dispute history) + AI anomaly detector flags suspicious pricing/duplicate registrations before admins find them.
5. **Escrow + Dispute Resolution as a real state machine** — funds provably locked and released only against delivery confirmation, with immutable audit trail.
6. **ONDC-ready API shape** — loosely-coupled REST endpoints for `produce_listings`/`orders` that could plug into Open Network for Digital Commerce.
7. **Group Buying / Demand Pooling** — small buyers join pooled orders to hit wholesale quantity thresholds and unlock better prices.
8. **Crop Doctor** — reuse the AI image pipeline for crop disease diagnosis + treatment suggestions.

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGRIMART ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   FARMER     │     │   BUYER      │     │   ADMIN      │                │
│  │   (React)    │     │   (React)    │     │   (React)    │                │
│  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘                │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              ▼                                              │
│                    ┌───────────────────┐                                    │
│                    │   SUPABASE        │                                    │
│                    │   (PostgreSQL +   │                                    │
│                    │    Auth + Realtime│                                    │
│                    │    + Storage)     │                                    │
│                    └─────────┬─────────┘                                    │
│                              │                                             │
│         ┌────────────────────┼────────────────────┐                        │
│         ▼                    ▼                    ▼                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                │
│  │  FASTAPI     │    │  FASTAPI     │    │  FASTAPI     │                │
│  │  /voice      │    │  /vision     │    │  /fraud      │                │
│  │  /market     │    │  /chatbot    │    │  /market     │                │
│  └──────────────┘    └──────────────┘    └──────────────┘                │
│         │                    │                    │                        │
│         └────────────────────┼────────────────────┘                        │
│                              ▼                                              │
│                    ┌───────────────────┐                                    │
│                    │  ADAPTER PATTERN  │                                    │
│                    │  SpeechAdapter    │                                    │
│                    │  ImageAdapter     │                                    │
│                    └─────────┬─────────┘                                    │
│                              │                                             │
│                    ┌───────────────────┐                                    │
│                    │  MOCK ML MODELS   │                                    │
│                    │  (Swap for real)  │                                    │
│                    └───────────────────┘                                    │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  DESIGN PATTERNS (Explicit for Viva/Demo)                                  │
│  • Singleton: supabaseClient.js (one instance)                             │
│  • Observer/Pub-Sub: Supabase Realtime in ActiveOrders.jsx, DispatchMgr   │
│  • Adapter: speech_adapter.py, image_adapter.py                           │
│  • State Machine: Order status transitions enforced in DB + order_state_  │
│    machine.py (Pending → Accepted → Dispatched → Completed | Disputed)    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
agrimart/
├── frontend/                    # React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── lib/supabaseClient.js      # Singleton Supabase client
│   │   ├── pages/
│   │   │   ├── farmer/                # Dashboard, KisanVani, Inventory,
│   │   │   │                           # CreateListing, OrderHub, Dispatch,
│   │   │   │                           # Wallet, Profile, CropDoctor
│   │   │   ├── buyer/                 # MarketCatalog, ListingDetail, Cart,
│   │   │   │                           # ActiveOrders, Profile, Chatbot
│   │   │   └── admin/                 # Metrics, Verification, Escrow,
│   │   │                               # Disputes, Kiosks, Fraud
│   │   ├── components/                # Layouts, UI components
│   │   ├── i18n/                      # en/hi/kn translations (farmer space)
│   │   ├── hooks/                     # useAuth
│   │   └── App.jsx                    # Routing + role-based protection
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                       # FastAPI (Python 3.11)
│   ├── app/
│   │   ├── main.py                      # App entry, CORS, JWT auth
│   │   ├── core/config.py               # Pydantic Settings
│   │   ├── routers/
│   │   │   ├── voice.py                 # POST /voice/parse-listing
│   │   │   ├── vision.py                # POST /vision/grade-crop, diagnose-crop
│   │   │   ├── fraud.py                 # POST /fraud/score-listing, score-account
│   │   │   ├── market.py                # GET /market/apmc-rates, trends
│   │   │   └── chatbot.py               # POST /chatbot/demand-forecast
│   │   ├── adapters/
│   │   │   ├── speech_adapter.py        # STT text → structured listing JSON
│   │   │   └── image_adapter.py         # CV output → grade/diagnosis JSON
│   │   └── services/
│   │       ├── fraud_service.py
│   │       ├── market_service.py
│   │       └── chatbot_service.py
│   ├── tests/                           # Pytest suite
│   ├── Dockerfile
│   └── requirements.txt
│
├── supabase/                      # Database schema
│   ├── schema.sql                     # Tables: users, farmers, buyers,
│   │                                 # produce_listings, orders, transports,
│   │                                 # transactions, disputes, pooled_contributions
│   ├── rls_policies.sql               # Row Level Security
│   └── functions.sql                  # Atomic stock reservation, trust scores,
│                                     # order state machine, escrow triggers,
│                                     # pooling auto-conversion
│
├── docker-compose.yml               # Frontend + Backend (Supabase hosted)
├── .env.example                     # All required env vars
├── .github/workflows/ci.yml         # GitHub Actions: lint, test, build
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Supabase account (free tier works)
- Razorpay test account
- Resend account (for emails)

### 1. Clone & Configure
```bash
git clone <repo-url>
cd agrimart
cp .env.example .env
# Edit .env with your keys
```

### 2. Supabase Setup
1. Create new Supabase project
2. Run `supabase/schema.sql` in SQL Editor
3. Run `supabase/rls_policies.sql`
4. Run `supabase/functions.sql`
4. Enable Realtime for: `orders`, `transports`, `produce_listings`
5. Create Storage bucket `documents` for KYC uploads

### 3. Run with Docker
```bash
docker-compose up --build
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 4. Local Development (without Docker)
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## 🔑 Key Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anon key | ✅ |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (backend only) | ✅ |
| `JWT_SECRET` | Secret for JWT signing | ✅ |
| `RAZORPAY_KEY_ID` | Razorpay test key ID | ✅ |
| `RAZORPAY_KEY_SECRET` | Razorpay test secret | ✅ |
| `RESEND_API_KEY` | Resend API key for emails | ✅ |
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL (frontend) | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY (frontend) | ✅ |
| `VITE_API_URL` | Backend URL (default: http://localhost:8000) | ✅ |

---

## 🧪 Running Tests

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend lint
cd frontend
npm run lint
```

---

## 📦 Deployment

### Backend (Fly.io / Railway / Render)
```bash
# Set environment variables in platform dashboard
# Deploy Docker image
```

### Frontend (Vercel / Netlify / Cloudflare Pages)
```bash
# Build command: npm run build
# Output directory: dist
# Set VITE_* environment variables
```

### Supabase
- Database, Auth, Realtime, Storage all managed by Supabase
- No local containerization needed

---

## 🔮 What to Extend Next

1. **Real ML Models** — Swap mock adapters for:
   - Whisper (speech-to-text) + Indic language fine-tuning
   - YOLOv8/ViT for crop grading (A/B/C) + disease classification
   - Replace `speech_adapter.py` and `image_adapter.py` implementations

2. **ONDC Integration** — Implement Beckn protocol adapters for:
   - `/search`, `/select`, `/init`, `/confirm`, `/status` endpoints
   - Network participant registration

3. **Advanced Fraud** — Add:
   - Device fingerprinting (fingerprintjs2)
   - IP geolocation velocity checks
   - Graph-based duplicate detection (Neo4j)

4. **Logistics Marketplace** — Driver app + route optimization

5. **Financial Services** — 
   - BNPL for buyers
   - Invoice factoring for farmers
   - Crop insurance integration

6. **Offline-First** — Service workers + IndexedDB for kiosk mode

7. **Analytics Dashboard** — Metabase / Apache Superset integration

---

## 📄 License

MIT License — Built for portfolio/major project demonstration.

---

## 🙏 Acknowledgments

- **Supabase** for PostgreSQL + Auth + Realtime + Storage
- **FastAPI** for high-performance Python API
- **React + Vite + Tailwind** for modern frontend stack
- **Razorpay** for payment infrastructure
- **Resend** for transactional emails
- **Open Network for Digital Commerce (ONDC)** for interoperability vision