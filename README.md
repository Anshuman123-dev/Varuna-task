# Fuel EU Maritime Compliance Dashboard

A full-stack web application for managing Fuel EU Maritime Regulation compliance, implementing Banking (Article 20) and Pooling (Article 21) mechanisms per official EU guidelines.

## Overview

This dashboard helps shipping companies:
- Calculate compliance balances (CB) for vessels
- Bank surplus compliance credits for future use
- Pool compliance balances across multiple ships
- Calculate penalties for non-compliance
- Track GHG intensity targets from 2025 to 2050

**Key Features:**
- 📊 Route management and comparison
- 🏦 Banking system for surplus compliance credits (Article 20)
- 🤝 Pooling mechanism for compliance balance allocation (Article 21)
- 📈 Visual comparison with GHG intensity targets
- 💰 Penalty calculation with consecutive year multipliers
- 🔄 Fallback data support for offline scenarios

## Architecture Summary

The project follows **Hexagonal Architecture** (Ports & Adapters) principles:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │ Routes   │  │ Compare  │  │ Banking  │  │ Pooling ││
│  │   Tab    │  │   Tab    │  │   Tab    │  │   Tab   ││
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘│
│         │            │            │            │        │
│         └────────────┴────────────┴────────────┘        │
│                         │                                │
│              ┌───────────▼───────────┐                   │
│              │   API Services        │                   │
│              │  (apiClient.ts)       │                   │
│              └───────────┬───────────┘                   │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────▼──────────────────────────────┐
│              Backend (Node.js + Express)                 │
│  ┌──────────────────────────────────────────────────┐   │
│  │         HTTP Adapters (Inbound)                  │   │
│  │  routes.ts | compliance.ts | banking.ts | pools │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │         Application Layer (Use Cases)               │ │
│  │  computeComplianceBalance | bankSurplus |          │ │
│  │  allocatePool | calculatePenalty                   │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │         Shared Domain Logic                          │ │
│  │  formulas.ts (CB, Penalty, GHGI calculations)       │ │
│  └──────────────────────┬──────────────────────────────┘ │
│                         │                                │
│  ┌──────────────────────▼──────────────────────────────┐ │
│  │         PostgreSQL Adapters (Outbound)               │ │
│  │  routesRepository | complianceRepository |          │ │
│  │  bankingRepository | poolsRepository                │ │
│  └──────────────────────┬──────────────────────────────┘ │
└──────────────────────────┼──────────────────────────────┘
                           │
              ┌─────────────▼─────────────┐
              │   PostgreSQL Database      │
              │  routes | ship_compliance  │
              │  bank_entries | pools      │
              │  pool_members             │
              └───────────────────────────┘
```

### Backend Structure

```
backend/
├── src/
│   ├── core/
│   │   └── application/          # Use cases (business logic)
│   │       ├── computeComplianceBalance.ts
│   │       ├── computeAdjustedCB.ts
│   │       ├── bankSurplus.ts
│   │       ├── applyBankedSurplus.ts
│   │       ├── allocatePool.ts
│   │       └── calculatePenaltyWithConsecutive.ts
│   ├── adapters/
│   │   ├── inbound/http/         # Express routes (API endpoints)
│   │   │   ├── routes.ts
│   │   │   ├── compliance.ts
│   │   │   ├── banking.ts
│   │   │   └── pools.ts
│   │   └── outbound/postgres/    # Database repositories
│   │       ├── routesRepository.ts
│   │       ├── complianceRepository.ts
│   │       ├── bankingRepository.ts
│   │       └── poolsRepository.ts
│   ├── infrastructure/
│   │   ├── db/                   # Database setup
│   │   │   ├── client.ts
│   │   │   ├── migrate.ts
│   │   │   └── seed.ts
│   │   └── server.ts             # Express app initialization
│   └── shared/
│       └── formulas.ts           # Core calculation formulas
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/               # React UI components
│   │   ├── RoutesTab.tsx
│   │   ├── CompareTab.tsx
│   │   ├── BankingTab.tsx
│   │   ├── PoolingTab.tsx
│   │   └── FallbackNotification.tsx
│   ├── adapters/
│   │   └── infrastructure/      # API clients
│   │       ├── apiClient.ts
│   │       ├── routesService.ts
│   │       ├── complianceService.ts
│   │       ├── bankingService.ts
│   │       └── poolingService.ts
│   ├── hooks/
│   │   └── useFallbackNotification.ts
│   └── shared/
│       ├── units.ts             # Unit conversion utilities
│       └── fallbackData.ts      # Offline fallback data
```

## Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL
- **Validation:** Zod

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Charts:** Recharts
- **Icons:** Lucide React

## Setup & Run Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### 1. Clone Repository

```bash
git clone <repository-url>
cd varuna
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your PostgreSQL credentials:
# DATABASE_URL=postgresql://user:password@localhost:5432/fueleu_db
# PORT=4000

# Run database migrations
npm run migrate

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:4000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access Application

Open your browser and navigate to `http://localhost:5173`

## How to Execute Tests

### Backend Tests

Currently, the project uses manual testing. To test the API endpoints:

```bash
# Health check
curl http://localhost:4000/health

# Get all routes
curl http://localhost:4000/routes

# Calculate compliance balance
curl -X POST http://localhost:4000/compliance/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "shipId": "SHIP001",
    "year": 2025,
    "fuels": [{
      "mass_g": 50000000000,
      "lcv_mj_per_g": 0.041,
      "ghg_intensity": 94.0
    }],
    "opsEnergyMJ": 0
  }'

# Get adjusted CB
curl "http://localhost:4000/compliance/adjusted-cb?shipId=SHIP001&year=2025"

# Get available banked surplus
curl "http://localhost:4000/banking/available?shipId=SHIP001"

# Create a pool
curl -X POST http://localhost:4000/pools \
  -H "Content-Type: application/json" \
  -d '{
    "year": 2025,
    "members": [
      {"shipId": "SHIP001", "year": 2025},
      {"shipId": "SHIP002", "year": 2025}
    ]
  }'
```

### Frontend Testing

The frontend includes fallback data for testing when the backend is unavailable. The UI will automatically show a notification when using fallback data.

### Database Verification

```bash
# Connect to PostgreSQL
psql -U your_user -d fueleu_db

# Check tables
\dt

# View sample data
SELECT * FROM routes LIMIT 5;
SELECT * FROM ship_compliance LIMIT 5;
SELECT * FROM bank_entries;
SELECT * FROM pools;
```

## API Endpoints

### Routes
- `GET /routes` - List all routes
- `GET /routes/comparison` - Compare routes with baseline
- `POST /routes/:id/baseline` - Set baseline route

### Compliance
- `POST /compliance/calculate` - Calculate base compliance balance
- `GET /compliance/base-cb?shipId=X&year=Y` - Get base CB
- `GET /compliance/adjusted-cb?shipId=X&year=Y` - Get adjusted CB
- `GET /compliance/verified-cb?shipId=X&year=Y` - Get verified CB
- `GET /compliance/penalty?shipId=X&year=Y` - Calculate penalty

### Banking
- `GET /banking/available?shipId=X` - Get total available banked surplus
- `GET /banking/records?shipId=X` - Get all bank entries
- `POST /banking/bank` - Bank positive verified CB

### Pooling
- `POST /pools` - Create a new pool
- `GET /pools?year=Y` - List pools for a year
- `GET /pools/:id` - Get pool details

## Sample Requests/Responses

### Calculate Compliance Balance

**Request:**
```json
POST /compliance/calculate
{
  "shipId": "SHIP001",
  "year": 2025,
  "fuels": [
    {
      "mass_g": 50000000000,
      "lcv_mj_per_g": 0.041,
      "ghg_intensity": 94.0
    }
  ],
  "opsEnergyMJ": 0
}
```

**Response:**
```json
{
  "ghgiActual": 94.0,
  "totalEnergyMJ": 2050000000,
  "complianceBalanceGCO2eq": -9559560000
}
```

### Get Adjusted CB

**Request:**
```
GET /compliance/adjusted-cb?shipId=SHIP001&year=2025
```

**Response:**
```json
{
  "baseCB": -9559560000,
  "bankedSurplus": 5000000000,
  "adjustedCB": -4559560000
}
```

### Create Pool

**Request:**
```json
POST /pools
{
  "year": 2025,
  "members": [
    {"shipId": "SHIP001", "year": 2025},
    {"shipId": "SHIP002", "year": 2025}
  ]
}
```

**Response:**
```json
{
  "poolId": 1,
  "year": 2025,
  "members": [
    {
      "shipId": "SHIP001",
      "adjustedCB": -4559560000,
      "verifiedCB": -2000000000,
      "change": 2559560000
    },
    {
      "shipId": "SHIP002",
      "adjustedCB": 8000000000,
      "verifiedCB": 5459560000,
      "change": -2540440000
    }
  ]
}
```

## Key Formulas

### Compliance Balance (Annex IV Part A)
```
CB = (GHGIEtarget - GHGIEactual) × [Σ(Mi × LCVi) + Σ(Ek)]
```
- Result in **gCO₂eq** (grams)
- Positive = Surplus, Negative = Deficit

### Penalty (Annex IV Part B)
```
Penalty [EUR] = |CB| / GHGIEactual × 41,000 × 2,400 × multiplier
```
- Multiplier = 1 + (consecutive_years - 1) × 0.10
- Rounded to nearest integer EUR

### GHG Intensity Targets
- 2025: 89.3368 gCO₂e/MJ (-2%)
- 2030: 85.6904 gCO₂e/MJ (-6%)
- 2035: 77.9418 gCO₂e/MJ (-14.5%)
- 2040: 62.9004 gCO₂e/MJ (-31%)
- 2045: 34.6408 gCO₂e/MJ (-62%)
- 2050: 18.2320 gCO₂e/MJ (-80%)

## Units & Conversions

**Storage (Database & API):**
- Fuel mass: **GRAMS** (fuel_consumption_g)
- LCV: **MJ/g** (lcv_mj_per_g)
- Energy: **MJ** (total_energy_mj)
- CB: **gCO₂eq** (compliance_balance_gco2eq) - INTEGER
- Penalty: **EUR** (penalty_eur) - ROUNDED INTEGER

**Display (Frontend):**
- Fuel mass: **tonnes** (divide by 1,000,000)
- CB: **tonnes CO₂eq** (divide by 1,000,000)
- Energy: **GJ** (divide by 1,000) if large
- Always shows units clearly in UI

## Project Status

✅ **Completed:**
- Backend API with all endpoints
- Database schema and migrations
- Compliance balance calculations
- Banking system (Article 20)
- Pooling mechanism (Article 21)
- Penalty calculation with consecutive years
- Frontend UI with all tabs
- Unit conversion utilities
- Fallback data support

🔄 **Future Enhancements:**
- Automated test suite
- User authentication
- Multi-year compliance tracking
- Export to PDF/Excel
- Advanced reporting and analytics
- Real-time compliance monitoring

## License

This project is developed for educational and compliance purposes.

## References

- [EU FuelEU Maritime Regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1805)
- Article 20: Banking of Surplus
- Article 21: Pooling
- Article 23: Penalties
- Annex IV: Calculation Methods

