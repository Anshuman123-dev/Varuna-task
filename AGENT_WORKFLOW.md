# AI Agent Workflow Log

## Agents Used

- **Cursor Agent** (Primary): Used for code generation, refactoring, and architectural decisions
- **GitHub Copilot** (Secondary): Used for inline code completions and boilerplate generation
- **Claude Code** (Tertiary): Used for complex logic verification and formula validation

## Prompts & Outputs

### Example 1: Initial Project Setup

**Prompt:**
```
Build a full-stack Fuel EU Maritime Compliance Dashboard with React frontend and Node.js backend, implementing Banking (Article 20) and Pooling (Article 21) regulations per official EU guidelines.
```

**Generated Output:**
- Complete project structure with hexagonal architecture
- Backend folder structure: `core/application/`, `adapters/inbound/http/`, `adapters/outbound/postgres/`
- Frontend folder structure: `components/`, `adapters/infrastructure/`, `hooks/`
- Database schema with proper BIGINT types for gCO₂eq values
- Initial Express server setup with TypeScript

**Validation:** Verified against EU FuelEU Maritime Regulation documentation to ensure compliance with Article 20 (Banking) and Article 21 (Pooling) requirements.

---

### Example 2: Compliance Balance Calculation Formula

**Prompt:**
```
Implement the compliance balance calculation following Annex IV Part A. The formula is:
CB = (GHGIEtarget - GHGIEactual) × [Σ(Mi × LCVi) + Σ(Ek)]
Result must be in gCO₂eq (grams, not tonnes!)
```

**Generated Output:**
```typescript
export function calculateComplianceBalance(
	ghgiTarget: number,
	ghgiActual: number,
	totalEnergyMJ: number
): number {
	const cb = (ghgiTarget - ghgiActual) * totalEnergyMJ;
	return Math.round(cb);
}
```

**Refinement:**
- Initially, the agent suggested storing in tonnes, but corrected to grams per regulation
- Added proper rounding to integer gCO₂eq (no decimals for grams)
- Verified units: fuel mass in grams, LCV in MJ/g, energy in MJ

---

### Example 3: Banking Logic Implementation

**Prompt:**
```
Implement banking logic for Article 20. Ships can only bank positive Verified CB (after pooling). Banked surplus never expires and can be applied to future years.
```

**Generated Output:**
- `bankSurplus.ts` - Validates only positive Verified CB can be banked
- `getTotalBankedSurplus.ts` - Sums all remaining banked amounts
- `applyBankedSurplus.ts` - Applies banked surplus to calculate Adjusted CB
- Repository pattern for database operations

**Correction:**
- Initial implementation allowed banking from Base CB, but corrected to only allow banking from Verified CB (after pooling)
- Added validation to prevent double banking for the same year
- Ensured banked amounts are cumulative and never expire

---

### Example 4: Pooling Allocation Algorithm

**Prompt:**
```
Implement pooling allocation per Article 21. Deficit ships must get verifiedCB >= adjustedCB. Surplus ships must get verifiedCB >= 0. Sum must be preserved.
```

**Generated Output:**
```typescript
export async function allocatePool(members: PoolMember[]) {
	// Greedy algorithm: allocate surplus to deficits
	const deficits = members.filter(m => m.adjustedCB < 0);
	const surpluses = members.filter(m => m.adjustedCB > 0);
	
	// Allocate surpluses to cover deficits
	// ... allocation logic
}
```

**Refinement:**
- Initial algorithm didn't preserve sum exactly - corrected to ensure Σ(verifiedCB) = Σ(adjustedCB)
- Added validation for all 5 pooling requirements
- Implemented proper error handling for invalid pools

---

### Example 5: Frontend Unit Conversion

**Prompt:**
```
Create unit conversion utilities. Backend stores in grams and gCO₂eq, but frontend should display in tonnes for readability.
```

**Generated Output:**
```typescript
export function gCO2eqToTonnes(gco2eq: number): string {
	return (gco2eq / 1_000_000).toFixed(2) + ' t';
}

export function gramsToTonnes(grams: number): string {
	return (grams / 1_000_000).toFixed(2) + ' t';
}
```

**Validation:**
- Verified conversion factors (1,000,000 grams = 1 tonne)
- Ensured API always receives grams, only converts for display
- Added tooltips explaining unit conversions to users

---

### Example 6: Penalty Calculation with Consecutive Years

**Prompt:**
```
Calculate penalty with consecutive year multiplier per Article 23(2). Formula: Total Penalty = Base Penalty × (1 + (n - 1) × 0.10) where n = consecutive deficit years.
```

**Generated Output:**
```typescript
export function calculatePenalty(
	complianceBalanceGCO2eq: number,
	ghgiActual: number,
	consecutiveYears: number = 1
): number {
	if (complianceBalanceGCO2eq >= 0) return 0;
	const absCB = Math.abs(complianceBalanceGCO2eq);
	const basePenalty = (absCB / ghgiActual) * 41000 * 2400;
	const totalPenalty = basePenalty * (1 + (consecutiveYears - 1) * 0.1);
	return Math.round(totalPenalty);
}
```

**Correction:**
- Initial implementation used wrong formula - corrected to use absolute CB value
- Fixed consecutive year multiplier calculation
- Ensured penalty rounds to nearest integer EUR (per regulation)

---

## Validation / Corrections

### Unit Management Issues
**Problem:** Initial implementation mixed units (tonnes vs grams)
**Solution:** 
- Standardized: Backend always uses grams and gCO₂eq
- Frontend converts only for display
- Added clear unit labels throughout UI

### Rounding Precision
**Problem:** Agent initially rounded intermediate calculations
**Solution:**
- Implemented MRV rounding (5 decimal places) only for intermediate values
- Final penalty rounds to integer EUR
- CB stored as integer gCO₂eq (no decimals)

### Database Schema
**Problem:** Initial schema used INTEGER for gCO₂eq (too small)
**Solution:**
- Changed to BIGINT for all gCO₂eq fields
- Changed to BIGINT for fuel_consumption_g
- Verified can handle values > 1 billion grams

### Pooling Validation
**Problem:** Initial pooling logic didn't validate all 5 requirements
**Solution:**
- Added comprehensive validation function
- Checks: ship scope, no borrowing, not in another pool, sum >= 0, valid DoC
- Returns clear error messages for each violation

---

## Observations

### Where Agent Saved Time

1. **Architecture Setup:** Generated complete hexagonal architecture structure in minutes vs hours of manual setup
2. **Formula Implementation:** Correctly implemented complex EU regulation formulas with proper units
3. **Database Migrations:** Generated SQL migration scripts with proper types (BIGINT, DECIMAL)
4. **TypeScript Types:** Generated comprehensive type definitions for all entities
5. **API Endpoints:** Created all REST endpoints with proper error handling
6. **Frontend Components:** Generated React components with Tailwind CSS styling
7. **Unit Conversion Utilities:** Created conversion functions with proper precision

### Where It Failed or Hallucinated

1. **Unit Confusion:** Initially suggested storing in tonnes instead of grams (corrected after review)
2. **Pooling Sum Preservation:** Initial algorithm didn't preserve sum exactly (required manual correction)
3. **Banking Source:** Initially allowed banking from Base CB instead of Verified CB (corrected per Article 20)
4. **Penalty Formula:** First attempt used wrong formula structure (corrected to match Annex IV Part B)
5. **Database Types:** Initially used INTEGER instead of BIGINT for large values (corrected after testing)

### How Tools Were Combined Effectively

1. **Cursor Agent for Structure:** Used for overall architecture and folder structure
2. **Copilot for Boilerplate:** Used inline completions for repetitive code (repositories, API routes)
3. **Claude for Verification:** Used for complex formula validation and regulation compliance checks
4. **Iterative Refinement:** Combined multiple agents - used Cursor to generate, Claude to verify, Copilot to complete

---

## Best Practices Followed

### 1. Used Cursor's Task Management
- Created `task.md` with detailed requirements
- Broke down into manageable subtasks (B1-B6, F1-F6)
- Checked off tasks as completed

### 2. Copilot Inline Completions
- Used for repetitive patterns (repository methods, API handlers)
- Generated TypeScript interfaces from examples
- Completed boilerplate code (error handlers, validation)

### 3. Claude Code for Refactoring
- Verified formula correctness against EU regulations
- Refactored complex logic (pooling allocation)
- Validated unit conversions and rounding rules

### 4. Code Review Process
- Always reviewed agent output before committing
- Tested formulas with example calculations
- Verified database schema against requirements
- Checked unit conversions with edge cases

### 5. Documentation-Driven Development
- Started with detailed requirements in `task.md`
- Documented formulas and units clearly
- Added comments explaining regulation references

### 6. Incremental Development
- Built backend first (core logic)
- Then frontend (UI components)
- Tested integration at each step
- Fixed issues as they arose

---

## Key Learnings

1. **Always verify units:** AI agents can confuse units (grams vs tonnes, gCO₂eq vs tonnes CO₂eq)
2. **Test formulas with examples:** Don't trust formula implementation without manual calculation verification
3. **Use proper data types:** BIGINT for large values, DECIMAL for precise calculations
4. **Regulation compliance:** Always cross-reference with official documentation
5. **Iterative refinement:** Use multiple agents and iterations to get correct implementation
6. **Document as you go:** Clear documentation helps agents understand context better

---

## Statistics

- **Total Prompts:** ~50+ prompts across all agents
- **Code Generated:** ~3,000+ lines of TypeScript/React code
- **Corrections Made:** ~15 significant corrections (units, formulas, types)
- **Time Saved:** Estimated 40-50 hours vs manual coding
- **Accuracy Rate:** ~70% first attempt, ~95% after corrections

