# Fraud Risk Triage Baseline: Web Prototype & Scoring Engine

A self-contained, explainable fraud-risk triage prototype built for engineering teams. It scores transaction-level risk indicators and scam-message text features using transparent, deterministic heuristic rules.

---

## 1. Scope, Assumptions & Safety Boundary

- **Prototype & Triage Only**: This is a prototype designed for risk assessment and triage queue prioritization. It is **not** a production fraud model, credit score, or autonomous financial decision-maker.
- **Heuristic Indicators, Not Probabilities**: Scores are heuristic risk ratings on a 0–100 scale, **not** statistical probabilities or proof of fraud.
- **Human-in-the-Loop Protocol**: Elevated scores ($\ge 30$) produce a `recommend_human_review` disposition. **Never automatically decline or block a customer** based solely on this prototype.
- **Privacy & Zero-API Execution**: Scoring engines are pure synchronous TypeScript functions. No customer data or message strings are sent to external LLMs, cloud APIs, or external telemetry stores.
- **Fictional Data**: All demo cases and preset samples are synthetic and fictional.

---

## 2. Directory Structure & Integration Boundary

The scoring logic is isolated in `src/scoring/` so it can be merged directly into a shared backend (Node.js, Express, NestJS, AWS Lambda, Cloud Run) or a monorepo without touching UI code:

```text
src/
├── scoring/
│   ├── types.ts               # Input/output schemas, bands, reason types
│   ├── constants.ts           # Rule definitions, point weights, regex patterns
│   ├── transactionScorer.ts   # Pure function: scoreTransaction(input)
│   ├── messageScorer.ts       # Pure function: scoreMessage(text)
│   ├── sampleData.ts          # Fictional demo presets
│   └── tests/
│       ├── testCases.ts       # 18 comprehensive unit tests
│       └── runTests.ts        # Standalone CLI test runner
├── context/
│   └── CaseContext.tsx        # Case queue store, LocalStorage, & live feed simulator
├── types/
│   └── cases.ts               # Analyst notes, audit trail, and case dossier schemas
├── components/
│   ├── Header.tsx             # Navigation tabs & live pending review counters
│   ├── SafetyBanner.tsx       # Prototype scope & limitations notice
│   ├── TriageWorkbench.tsx    # Live Analyst Workbench, Queue, & Case Dossier drawer
│   ├── CaseDetailsDrawer.tsx  # Full incident dossier, analyst notes thread, & audit trail
│   ├── BatchTriagePanel.tsx   # Bulk CSV upload, enrichment, & 1-click queue import
│   ├── RulesPolicyPanel.tsx   # Policy inspection & queue hit-rate counters
│   ├── ScoreCard.tsx          # Radial gauge, bands, reasons & JSON contract inspector
│   ├── TransactionPanel.tsx   # Single transaction form & real-time evaluation
│   ├── MessagePanel.tsx       # Single message textarea & transparent cue highlighter
│   ├── TestSuitePanel.tsx     # In-browser test runner & assertion inspector
│   └── IntegrationPanel.tsx   # Merge instructions & code snippets
├── App.tsx                    # Root application router
└── main.tsx                   # Application entry point
```

---

## 3. Input & Output Contract

### Common Output Contract
Both `scoreTransaction()` and `scoreMessage()` return the following contract:

```json
{
  "score": 45,
  "band": "medium",
  "reasons": [
    {
      "code": "new_device",
      "description": "Transaction is from a device not previously seen",
      "points": 15
    },
    {
      "code": "country_mismatch",
      "description": "Transaction country differs from usual customer country",
      "points": 20
    },
    {
      "code": "account_younger_than_7_days",
      "description": "Account was registered less than 7 days ago",
      "points": 10
    }
  ],
  "disposition": "recommend_human_review",
  "scoreType": "heuristic_triage_not_probability"
}
```

### Risk Bands & Disposition Thresholds
| Band | Score Range | Default Disposition | Recommended Action |
| :--- | :--- | :--- | :--- |
| **Low** | 0 – 29 | `standard_processing` | Automated pipeline processing; standard authorization |
| **Medium** | 30 – 59 | `recommend_human_review` | Route to analyst queue for contextual verification |
| **High** | 60 – 100 | `recommend_human_review` | High priority triage; verify identity with secondary verification |

*All scores are capped at 100.*

---

## 4. Transaction Scoring Engine

### Inputs (`TransactionInput`)
- `amount` (*number*, required): Must be a non-negative finite number.
- `baselineAmount` (*number | null*, optional): Historical average transaction amount for the customer.
- `country` (*string | null*, optional): ISO country code of current transaction.
- `usualCountry` (*string | null*, optional): Historical home country of customer.
- `newDevice` (*boolean*, optional): Whether the transaction originated on an unrecognized device.
- `billingShippingMismatch` (*boolean*, optional): Whether billing and shipping destinations diverge.
- `attemptsLast10m` (*non-negative integer*, optional): Payment attempts in the last 10 minutes.
- `declinesLast24h` (*non-negative integer*, optional): Card declines in the last 24 hours.
- `accountAgeDays` (*non-negative integer | null*, optional): Days elapsed since account registration.

### Rule Weights
1. **Amount Spike Relative to Baseline**:
   - `amount >= 5x baseline`: **+25 points** (`amount_spike_5x`)
   - `amount >= 3x baseline`: **+18 points** (`amount_spike_3x`)
   - `amount >= 2x baseline`: **+10 points** (`amount_spike_2x`)
   *(Rules are mutually exclusive; only the highest tier applies)*
2. **Country Mismatch**: `country` differs from `usualCountry` (case-insensitive): **+20 points** (`country_mismatch`)
3. **New Device**: Unrecognized device flag: **+15 points** (`new_device`)
4. **Billing / Shipping Mismatch**: Address discrepancy: **+12 points** (`billing_shipping_mismatch`)
5. **Velocity (Attempts in 10 minutes)**:
   - 5 or more attempts: **+20 points** (`velocity_attempts_high`)
   - 3 to 4 attempts: **+12 points** (`velocity_attempts_elevated`)
6. **Declines (Last 24 hours)**:
   - 5 or more declines: **+20 points** (`declines_high`)
   - 3 to 4 declines: **+12 points** (`declines_elevated`)
7. **New Account**: Account age under 7 days: **+10 points** (`account_younger_than_7_days`)

---

## 5. Scam Message Scoring Engine

### Transparent NLP Feature Detectors
Text is evaluated via explainable regex patterns targeting known social engineering and phishing tactics:
- **Credential / OTP Requests**: Demands for one-time passcodes, PINs, 2FA, passwords, or seed phrases (**+25 points**)
- **Unusual / Irreversible Payment**: Requests for Apple/Google/Steam gift cards, Bitcoin/crypto, wire transfers, Western Union (**+25 points**)
- **Suspicious Link Structure**: Known URL shorteners (`bit.ly`, `tinyurl.com`, `t.co`, etc.), raw IP URLs, or high-risk TLDs (**+22 points**)
- **Coercive Threats & Lockout**: Account suspension, legal action, law enforcement, or freeze notices (**+20 points**)
- **Sensitive Personal Data**: Requests for Social Security Numbers (SSN), card CVVs, or routing numbers (**+20 points**)
- **Brand Name Paired with Link**: Recognizable institution (Chase, PayPal, IRS, FedEx, Amazon) paired with link (**+18 points**)
- **Urgency & Short Deadlines**: Demands for immediate action within 24 hours or expiring notices (**+15 points**)
- **Secrecy Requests**: Instructions to keep transaction secret or refrain from informing bank/family (**+15 points**)

---

## 6. How to Run Tests & Setup

### Install Dependencies
```bash
npm install
```

### Run Unit Tests (CLI)
```bash
npm test
```
*Executes `tsx src/scoring/tests/runTests.ts` covering 18 unit tests across normal transactions, suspicious multi-indicator cases, amount tiers, velocity rules, benign/scam messages, edge cases, and determinism.*

### Run In-Browser Test Suite
Open the web app and navigate to the **"Unit Test Suite"** tab to run all tests interactively in real time with assertion inspectors.

### Start Development Server
```bash
npm run dev
```

### Type Check & Build
```bash
npm run lint
npm run build
```
