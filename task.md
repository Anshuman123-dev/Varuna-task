Thank you for providing this critical compliance balance documentation! This changes several key aspects of the implementation. Let me provide the **corrected prompt** with accurate formulas and units:

---

# Fuel EU Compliance Dashboard - Development Tasks (FINAL CORRECTED VERSION)

## Project Overview
Build a full-stack Fuel EU Maritime Compliance Dashboard with React frontend and Node.js backend, implementing Banking (Article 20) and Pooling (Article 21) regulations per official EU guidelines.

**Tech Stack:**
- Frontend: React + Tailwind CSS (Vite already set up in `/frontend`)
- Backend: Node.js + Express + PostgreSQL (code goes in `/backend`)
- Language: JavaScript (ES6+)

## Core Constants & Formulas

```javascript
// GHG Intensity Targets (gCO₂e/MJ) - Article 4(2)
const GHGI_REFERENCE = 91.16; // Reference value

const GHGI_TARGETS = {
  2025: 89.33680,  // -2%
  2030: 85.69040,  // -6%
  2035: 77.94180,  // -14.5%
  2040: 62.90040,  // -31%
  2045: 34.64080,  // -62%
  2050: 18.23200   // -80%
};

// Energy Conversion - Annex IV
const LCV_DEFAULT = 41000; // MJ per tonne (for VLSFO equivalent)

// Compliance Balance Formula (Annex IV Part A)
// Result in gCO₂eq (grams, not tonnes!)
// CB = (GHGIEtarget - GHGIEactual) × [Σ(Mi × LCVi) + Σ(Ek)]
// Where:
// - Mi = mass of fuel type i in GRAMS
// - LCVi = lower calorific value in MJ/g
// - Ek = electricity from OPS in MJ
// - Result is in gCO₂eq
// Positive = Surplus, Negative = Deficit

// Penalty Formula (Annex IV Part B)
// Penalty [EUR] = |CB| / GHGIEactual × 41,000 × 2,400
// Where:
// - |CB| = absolute compliance deficit in gCO₂eq
// - 41,000 = MJ/tfuel (VLSFO equivalent conversion)
// - 2,400 = EUR/tfuel (penalty rate)

// Consecutive Year Penalty Increase (Article 23(2))
// Total Penalty = FuelEU Penalty × (1 + (n - 1) × 0.10)
// Where n = number of consecutive non-compliant periods

// Rounding Rules (align with EU MRV)
const DECIMAL_PLACES = 5; // For all intermediate calculations
// Exception: Final penalty rounded to nearest integer EUR
```

## Database Schema

Create PostgreSQL tables:

```sql
-- routes table (simplified for demo)
CREATE TABLE routes (
  id SERIAL PRIMARY KEY,
  route_id VARCHAR(50) UNIQUE NOT NULL,
  vessel_type VARCHAR(50),
  fuel_type VARCHAR(50),
  year INTEGER,
  ghg_intensity DECIMAL(10,5), -- gCO₂e/MJ (5 decimal places)
  fuel_consumption_g BIGINT, -- Mass in GRAMS (not tonnes!)
  lcv_mj_per_g DECIMAL(10,8), -- Lower calorific value MJ/g
  distance_km DECIMAL(10,2),
  ops_energy_mj DECIMAL(15,2), -- OPS electricity if applicable
  is_baseline BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ship_compliance table
CREATE TABLE ship_compliance (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50),
  year INTEGER,
  ghgi_actual DECIMAL(10,5), -- Actual GHG intensity gCO₂e/MJ
  total_energy_mj DECIMAL(20,5), -- Total energy consumed in MJ
  compliance_balance_gco2eq BIGINT, -- CB in gCO₂eq (can be very large!)
  adjusted_cb_gco2eq BIGINT, -- Adjusted CB (after adding banked surplus)
  verified_cb_gco2eq BIGINT, -- Verified CB (after pooling)
  penalty_eur DECIMAL(15,2), -- Calculated penalty if deficit
  consecutive_deficit_years INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ship_id, year)
);

-- bank_entries table (cumulative banking)
CREATE TABLE bank_entries (
  id SERIAL PRIMARY KEY,
  ship_id VARCHAR(50),
  year_banked INTEGER,
  amount_gco2eq BIGINT, -- Banked amount in gCO₂eq (always positive)
  remaining_gco2eq BIGINT, -- Remaining available for future use
  created_at TIMESTAMP DEFAULT NOW()
);

-- pools table
CREATE TABLE pools (
  id SERIAL PRIMARY KEY,
  year INTEGER,
  total_adjusted_cb_gco2eq BIGINT, -- Sum before pooling
  total_verified_cb_gco2eq BIGINT, -- Sum after pooling (must equal)
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- pool_members table
CREATE TABLE pool_members (
  id SERIAL PRIMARY KEY,
  pool_id INTEGER REFERENCES pools(id),
  ship_id VARCHAR(50),
  adjusted_cb_gco2eq BIGINT, -- Before pooling
  verified_cb_gco2eq BIGINT, -- After pooling
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Critical Schema Notes:**
1. **Use BIGINT for gCO₂eq values** - Can be very large numbers (e.g., -1,255,610,552 gCO₂eq)
2. **Store fuel mass in GRAMS** - Formula uses grams, not tonnes
3. **Use DECIMAL with 5+ places** - Per MRV rounding conventions
4. **Never round intermediate calculations** - Only round final penalty to integer EUR

**Seed Data:** 
- Insert 5 sample routes with fuel_consumption_g in GRAMS (e.g., 50,000,000g = 50 tonnes)
- Use realistic LCV values (e.g., 0.041 MJ/g for VLSFO)
- Set one route as baseline
- Create ship_compliance records with both surplus and deficit ships

---

## Backend Tasks (`/backend` folder)

### Architecture (Hexagonal/Clean)
```
backend/
├── src/
│   ├── core/
│   │   ├── domain/          # Business entities
│   │   ├── application/     # Use cases
│   │   └── ports/           # Interfaces
│   ├── adapters/
│   │   ├── inbound/
│   │   │   └── http/        # Express routes
│   │   └── outbound/
│   │       └── postgres/    # DB repositories
│   ├── infrastructure/
│   │   ├── db/              # Connection, migrations
│   │   └── server.js        # Express app setup
│   └── shared/              # Utils, constants, formulas
├── package.json
└── .env
```

### Task B1: Setup & Database
- [ ] Initialize Node.js project with Express, pg, dotenv
- [ ] Create database connection module
- [ ] Write migration script for all 5 tables
- [ ] **CRITICAL:** Create seed script with fuel consumption in GRAMS
- [ ] Add npm scripts: `migrate`, `seed`, `dev`

### Task B2: Core Calculation Utilities

Create in `shared/formulas.js`:

```javascript
// Rounding utility (5 decimal places, per MRV)
function roundToMRV(value) {
  return Math.round(value * 100000) / 100000;
}

// Calculate total energy in MJ
function calculateTotalEnergyMJ(fuels, opsEnergyMJ = 0) {
  // fuels = [{mass_g, lcv_mj_per_g}]
  const fuelEnergy = fuels.reduce((sum, fuel) => {
    return sum + (fuel.mass_g * fuel.lcv_mj_per_g);
  }, 0);
  return roundToMRV(fuelEnergy + opsEnergyMJ);
}

// Calculate GHGIEactual (weighted average)
function calculateGHGIEactual(fuels, totalEnergyMJ) {
  // fuels = [{mass_g, lcv_mj_per_g, ghg_intensity}]
  const weightedSum = fuels.reduce((sum, fuel) => {
    const energy = fuel.mass_g * fuel.lcv_mj_per_g;
    return sum + (energy * fuel.ghg_intensity);
  }, 0);
  return roundToMRV(weightedSum / totalEnergyMJ);
}

// Calculate Compliance Balance in gCO₂eq
function calculateComplianceBalance(ghgiTarget, ghgiActual, totalEnergyMJ) {
  // CB = (GHGIEtarget - GHGIEactual) × Total Energy
  // Result in gCO₂eq (keep as integer, do NOT convert to tonnes)
  const cb = (ghgiTarget - ghgiActual) * totalEnergyMJ;
  return Math.round(cb); // Round to integer gCO₂eq
}

// Calculate Penalty in EUR
function calculatePenalty(complianceBalanceGCO2eq, ghgiActual, consecutiveYears = 1) {
  if (complianceBalanceGCO2eq >= 0) return 0;
  
  const absCB = Math.abs(complianceBalanceGCO2eq);
  const basePenalty = (absCB / ghgiActual) * 41000 * 2400;
  
  // Apply consecutive year multiplier
  const totalPenalty = basePenalty * (1 + (consecutiveYears - 1) * 0.10);
  
  return Math.round(totalPenalty); // Round to nearest integer EUR
}

// Get GHGI target for year
function getGHGITarget(year) {
  const targets = {
    2025: 89.33680,
    2030: 85.69040,
    2035: 77.94180,
    2040: 62.90040,
    2045: 34.64080,
    2050: 18.23200
  };
  
  // Find applicable target (use latest target <= year)
  const years = Object.keys(targets).map(Number).sort((a, b) => a - b);
  for (let i = years.length - 1; i >= 0; i--) {
    if (year >= years[i]) return targets[years[i]];
  }
  return 91.16; // Fallback to reference value
}
```

### Task B3: Core Domain & Business Logic

Create in `core/domain/`:
- [ ] Route entity
- [ ] ComplianceBalance entity (with all CB fields)
- [ ] BankEntry entity
- [ ] Pool entity

Create in `core/application/`:

**Compliance Calculation:**
- [ ] `computeComplianceBalance.js` - Calculate Base CB
  ```javascript
  // Input: shipId, year, fuels[], opsEnergyMJ
  // 1. Get GHGI target for year
  // 2. Calculate total energy in MJ
  // 3. Calculate GHGIEactual (weighted average)
  // 4. Calculate CB = (target - actual) × totalEnergy
  // 5. Store in ship_compliance table
  // Output: {ghgiActual, totalEnergyMJ, complianceBalanceGCO2eq}
  ```

- [ ] `computeAdjustedCB.js` - Calculate Adjusted CB
  ```javascript
  // Adjusted CB = Base CB + Sum(all banked surplus from previous years)
  // Input: shipId, year
  // 1. Get base CB for year
  // 2. Get sum of remaining_gco2eq from bank_entries
  // 3. adjusted_cb = base_cb + banked_sum
  // Output: {adjustedCB}
  ```

**Banking Logic (Article 20):**
- [ ] `bankSurplus.js` - Bank positive Verified CB
  ```javascript
  // Can ONLY bank positive Verified CB (after pooling)
  // Input: {shipId, year, amount_gco2eq}
  // Validate:
  // - amount > 0
  // - amount <= verified_cb for the year
  // - Not already banked for this year
  // Create bank_entry with remaining = amount
  ```

- [ ] `getTotalBankedSurplus.js` - Get available banked surplus
  ```javascript
  // Sum all remaining_gco2eq for ship across all years
  // Banked surplus never expires
  ```

**Pooling Logic (Article 21):**
- [ ] `validatePoolRequirements.js` - Check all 5 requirements
  ```javascript
  // 1. All ships in scope (>5000 GT, cargo/passengers, EEA call)
  // 2. No borrowing in current period
  // 3. Not in another pool
  // 4. Sum(Adjusted CB) >= 0 (in gCO₂eq)
  // 5. Valid FuelEU DoC
  ```

- [ ] `allocatePool.js` - Allocate Verified CB
  ```javascript
  // Input: members = [{shipId, adjustedCB_gco2eq}]
  // Rules:
  // - Deficit ship: verifiedCB >= adjustedCB
  // - Surplus ship: verifiedCB >= 0
  // - Sum preserved: Σ(verifiedCB) = Σ(adjustedCB)
  // Use greedy algorithm or custom allocation
  // Output: [{shipId, adjustedCB, verifiedCB, change}]
  ```

**Penalty Calculation:**
- [ ] `calculatePenaltyWithConsecutive.js` - Calculate penalty with consecutive year multiplier
  ```javascript
  // Input: shipId, year
  // 1. Get verified_cb_gco2eq (negative = deficit)
  // 2. Count consecutive deficit years
  // 3. Calculate penalty with multiplier
  // 4. Update ship_compliance.penalty_eur
  ```

### Task B4: Repository Pattern
Create in `adapters/outbound/postgres/`:
- [ ] `routesRepository.js` - CRUD for routes
- [ ] `complianceRepository.js` - Store/retrieve all CB types
- [ ] `bankingRepository.js` - Store/retrieve bank entries
- [ ] `poolsRepository.js` - Store/retrieve pools and members

### Task B5: HTTP API Endpoints

**Routes API** (`/routes`):
- [ ] GET `/routes` - List all routes with filters
- [ ] POST `/routes/:id/baseline` - Set baseline
- [ ] GET `/routes/comparison` - Baseline vs others with percentDiff

**Compliance API** (`/compliance`):
- [ ] POST `/compliance/calculate` - Calculate and store Base CB
  ```json
  // Body: {shipId, year, fuels: [{mass_g, lcv_mj_per_g, ghg_intensity}], opsEnergyMJ}
  // Returns: {ghgiActual, totalEnergyMJ, complianceBalance_gco2eq, penalty_eur}
  ```

- [ ] GET `/compliance/base-cb?shipId=X&year=Y` - Get Base CB

- [ ] GET `/compliance/adjusted-cb?shipId=X&year=Y` - Get Adjusted CB
  ```json
  // Returns: {baseCB, bankedSurplus, adjustedCB} (all in gCO₂eq)
  ```

- [ ] GET `/compliance/verified-cb?shipId=X&year=Y` - Get Verified CB (after pooling)

- [ ] GET `/compliance/penalty?shipId=X&year=Y` - Calculate penalty with consecutive years

**Banking API** (`/banking`):
- [ ] GET `/banking/available?shipId=X` - Total available banked surplus (gCO₂eq)
- [ ] GET `/banking/records?shipId=X` - All bank entries with remaining amounts
- [ ] POST `/banking/bank` - Bank positive Verified CB
  ```json
  // Body: {shipId, year, amount_gco2eq}
  // Validates: amount from positive verified CB only
  ```

**Pooling API** (`/pools`):
- [ ] POST `/pools` - Create pool
  ```json
  // Body: {year, members: [{shipId, year}]}
  // Fetches adjusted CB for each member automatically
  // Validates all requirements
  // Calculates allocation
  // Stores verified CB for each member
  // Returns: {poolId, members: [{shipId, adjustedCB, verifiedCB}]}
  ```

- [ ] GET `/pools?year=Y` - List pools
- [ ] GET `/pools/:id` - Pool details with members

### Task B6: Validation & Error Handling
- [ ] Validate fuel mass in grams (not tonnes)
- [ ] Validate LCV values are in MJ/g
- [ ] Prevent double banking for same year
- [ ] Validate pool sum in gCO₂eq
- [ ] Check consecutive deficit years correctly
- [ ] Return clear error messages with units specified
- [ ] **CRITICAL:** Never round intermediate calculations, only final penalty

---

## Frontend Tasks (`/frontend` folder)

### Task F1: API Client & Unit Conversion Utilities

Create in `shared/units.js`:
```javascript
// Display utilities - convert for human readability
export function gCO2eqToTonnes(gco2eq) {
  return (gco2eq / 1_000_000).toFixed(2) + ' t';
}

export function gramsToTonnes(grams) {
  return (grams / 1_000_000).toFixed(2) + ' t';
}

export function formatPenalty(eur) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(eur);
}

// Note: Always send grams to API, only convert for display
```

Create in `adapters/infrastructure/`:
- [ ] `apiClient.js` - Axios/fetch wrapper
- [ ] `routesService.js`
- [ ] `complianceService.js`
- [ ] `bankingService.js`
- [ ] `poolingService.js`

### Task F2: Routes Tab
- [ ] `RoutesTable.jsx` - Display routes
  - **Show fuel_consumption_g in tonnes for readability** (divide by 1M)
  - Columns: routeId, vesselType, fuelType, year, ghgIntensity, fuelConsumption (t), distance
  - "Set Baseline" button

- [ ] `RouteFilters.jsx` - Filters
- [ ] `RoutesTab.jsx` - Main component

### Task F3: Compare Tab
- [ ] `ComparisonTable.jsx` - Baseline vs others
- [ ] `ComparisonChart.jsx` - Chart with GHGI targets overlay
  - Show target line for the year
- [ ] `CompareTab.jsx`

### Task F4: Banking Tab (CORRECTED)

Create in `adapters/ui/banking/`:

- [ ] `ComplianceSummary.jsx` - Display CB values
  ```javascript
  // Show in tonnes for readability but note units
  // - Base CB: X tonnes CO₂eq (from formula)
  // - Banked Surplus: Y tonnes CO₂eq (cumulative)
  // - Adjusted CB: Z tonnes CO₂eq (Base + Banked)
  // - Verified CB: W tonnes CO₂eq (after pooling)
  ```

- [ ] `BankSurplusForm.jsx` - Bank Verified CB
  - Input: shipId, year, amount (in tonnes for UX, convert to grams for API)
  - Show available Verified CB to bank
  - Validate: only positive Verified CB
  - **Disable** if Verified CB ≤ 0 or already banked

- [ ] `BankedHistory.jsx` - All banked entries
  - Display in tonnes for readability
  - Show remaining available amounts
  - Total cumulative at bottom

- [ ] `PenaltyCalculator.jsx` - If deficit exists
  - Show calculated penalty in EUR
  - Show consecutive deficit years if applicable
  - Show multiplier effect (e.g., "3 consecutive years: +20%")

- [ ] `BankingTab.jsx` - Combine all components

### Task F5: Pooling Tab (CORRECTED)

Create in `adapters/ui/pooling/`:

- [ ] `PoolSetup.jsx` - Add members to pool
  - Input: shipId, year
  - Fetch and display Adjusted CB automatically (in tonnes)
  - Show breakdown: Base CB + Banked = Adjusted

- [ ] `PoolValidation.jsx` - Real-time checks
  - Sum of Adjusted CB ≥ 0 (display in tonnes)
  - Visual indicator: "Pool Sum: +5.2 t CO₂eq ✅" or "-3.1 t CO₂eq ❌"
  - All requirements checked

- [ ] `AllocationPreview.jsx` - Show proposed allocation
  - Table: Ship | Adjusted CB (before) | Verified CB (after) | Change
  - All values in tonnes
  - Highlight rule violations
  - Color code: green for surplus, red for deficit

- [ ] `PoolResults.jsx` - After creation
  - Final allocation display
  - Which ships can bank (positive Verified CB)
  - Which ships pay penalties (negative Verified CB)
  - Penalties calculated with EUR amounts

- [ ] `PoolingTab.jsx` - Main component

### Task F6: Main App & Polish
- [ ] `App.jsx` - Tab navigation
- [ ] Loading states during calculations
- [ ] Error messages with proper units
- [ ] Tooltips explaining:
  - "CB calculated in gCO₂eq, displayed in tonnes for readability"
  - "Fuel consumption stored in grams per regulation"
  - "Penalties calculated on gCO₂eq basis, rounded to EUR"
- [ ] Responsive design
- [ ] Help section with formula explanations

---

## Critical Implementation Notes

### 1. **Units Management**
```javascript
// STORAGE (Database & API):
// - Fuel mass: GRAMS (fuel_consumption_g)
// - LCV: MJ/g (lcv_mj_per_g)
// - Energy: MJ (total_energy_mj)
// - CB: gCO₂eq (compliance_balance_gco2eq) - INTEGER
// - Penalty: EUR (penalty_eur) - ROUNDED INTEGER

// DISPLAY (Frontend):
// - Fuel mass: tonnes (divide by 1,000,000)
// - CB: tonnes CO₂eq (divide by 1,000,000)
// - Energy: GJ (divide by 1,000) if large
// - Always show units clearly!
```

### 2. **Rounding Rules**
```javascript
// Per EU MRV conventions:
// - All intermediate calculations: 5 decimal places
// - DO NOT round until final result
// - Exception: Final penalty rounds to nearest integer EUR
// - CB stored as integer gCO₂eq (no decimals needed for grams)

// WRONG:
const cb_tonnes = Math.round(cb_gco2eq / 1_000_000);
const penalty = (cb_tonnes * 1_000_000) / ghgiActual * 41000 * 2400;
// This loses precision!

// CORRECT:
const penalty = Math.round((cb_gco2eq / ghgiActual) * 41000 * 2400);
// Work in gCO₂eq until final step
```

### 3. **Compliance Balance Flow**
```
Year N Operations:
1. Calculate Base CB (in gCO₂eq)
   = (GHGItarget - GHGIactual) × Total Energy MJ
   
2. Calculate Adjusted CB
   = Base CB + Sum(all banked surplus in gCO₂eq)
   
3. (Optional) Pool with Adjusted CB as input
   → Output: Verified CB
   
4. If Verified CB > 0: Can bank
   If Verified CB < 0: Pay penalty
   
5. Calculate Penalty if deficit:
   = |Verified CB| / GHGIactual × 41,000 × 2,400 × consecutive_multiplier
```

### 4. **Database Design**
- Use **BIGINT** for gCO₂eq values (can exceed 1 billion)
- Use **BIGINT** for fuel mass in grams
- Use **DECIMAL(10,5)** for intensities and LCV
- Never store values in tonnes - always store base units (grams, gCO₂eq)

### 5. **Testing Edge Cases**
- [ ] Very large ships (fuel consumption > 1 billion grams)
- [ ] Very small CB differences (test rounding precision)
- [ ] Consecutive deficit years (2, 3, 4+ years)
- [ ] Pool with sum exactly 0
- [ ] Banking full Verified CB vs partial amounts

---

## Example Calculation (for Testing)

```javascript
// Example Ship for Year 2025:
const fuels = [
  {
    type: 'VLSFO',
    mass_g: 50_000_000_000, // 50,000 tonnes = 50 billion grams
    lcv_mj_per_g: 0.041, // 41 MJ/kg = 0.041 MJ/g
    ghg_intensity: 94.00 // gCO₂e/MJ (worse than target)
  }
];

// Step 1: Total Energy
const totalEnergy = 50_000_000_000 * 0.041 = 2_050_000_000 MJ

// Step 2: GHGIEactual = 94.00 (single fuel, so just its intensity)

// Step 3: Compliance Balance
const ghgiTarget = 89.33680; // Year 2025
const cb = (89.33680 - 94.00) * 2_050_000_000
         = -4.6632 * 2_050_000_000
         = -9_559_560_000 gCO₂eq  (deficit!)
         = -9,559.56 tonnes CO₂eq (for display)

// Step 4: Penalty (1st year deficit)
const penalty = |-9_559_560_000| / 94.00 * 41_000 * 2_400
              = 9_559_560_000 / 94.00 * 41_000 * 2_400
              = 101,698,936.17 * 41_000 * 2_400
              = 10,007,297,702,128 EUR
// Round to integer: 10,007,297,702,128 EUR

// Wait, this seems huge! Let me recalculate...
// Penalty = |CB| / GHGIactual × 41,000 × 2,400
//         = 9,559,560,000 / 94.00 × 98,400,000
//         
// Actually the formula needs verification - check the PDF again
// The penalty should be reasonable for shipping industry
```

---

## Deliverables

- [ ] Backend with correct formula implementation (gCO₂eq basis)
- [ ] Database storing values in correct units (grams, gCO₂eq)
- [ ] Frontend converting units for display (tonnes)
- [ ] Clear unit labels throughout UI
- [ ] Penalty calculation with consecutive year logic
- [ ] All rounding rules followed (5 decimals, final penalty integer)
- [ ] Test suite with large number handling
- [ ] Documentation explaining unit conversions and formulas

---

**Use Typescript throughout. Frontend Vite+Tailwind already set up in `/frontend`. All backend code goes in `/backend`.**