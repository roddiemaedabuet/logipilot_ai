# LogiPilot AI

LogiPilot AI is a final-interview, AI-first logistics POC for a large multinational integrated ocean-freight/logistics operator. It demonstrates one shared, permission-controlled journey using sample records, mocked AI behavior, deterministic business rules, and mandatory human approvals.

## Core functions

1. **Shipment Requests** — simulated email and phone intake, evidence-led extraction, customer clarification, Support validation, and Request/Booking ID lifecycle.
2. **Container Allocation** — confirmed booking demand, sample inventory, explained recommendations, Equipment Manager approval, reservation, and execution tracking.
3. **Receiving & Handoff** — Receiver physical validation, recorded-evidence comparison, manual discrepancy resolution, partial delivery, proof of delivery, and completion gates.

## POC boundary

All data is sample data. AI, email, phone, booking, inventory, schedule, cost, partner evidence, authentication, and temporary-credential flows are simulated. The POC has no live enterprise integration, real authentication, customer messaging, dispatch, customs/terminal control, or autonomous approval or delivery completion.

Future enhancements remain out of scope, including demand forecasting, external leasing, full external feasibility validation, Vessel Disruption Recovery, AI QA & Coaching, PWA/native mobile applications, and advanced exception handling.

## Setup and run

Prerequisite: a current Node.js runtime with `pnpm` available.

```powershell
cd C:\LogiPilot_AI\prototype
pnpm install
pnpm dev
```

Open the localhost URL reported by Vite. To use a fixed local port for review:

```powershell
pnpm dev -- --port 5177
```

## Demo login procedure

1. Select one of the shown admin-created sample accounts at the sign-in screen.
2. Use the application’s local simulated temporary-credential flow; no real email or credential is used.
3. On first sign-in, enter any disposable local value to complete the required password-change demonstration.
4. Use **Switch account** to demonstrate module permissions.

Sample roles:

- **Support** — Shipment Requests.
- **Equipment Manager** — Container Allocation.
- **Receiver** — Receiving & Handoff.
- **Administrator** — all modules and the account-permission demonstration.

## Suggested connected demo

1. As Support, open a shipment request, claim it if unassigned, review the evidence, record a customer clarification where needed, validate, and submit. The request has a Request ID from first contact; submission creates the Booking ID.
2. As Equipment Manager, select the resulting booking, compare recommendations, approve a feasible plan, and inspect its reservation, draft Operations instruction, and execution state.
3. As Receiver, confirm arrival when eligible, record physical checks and discrepancy evidence, approve the handoff, record proof of delivery, and confirm delivery.

Use **Reset Demo Data** to return the local POC to its baseline state before another walkthrough.

## Test and build

```powershell
cd C:\LogiPilot_AI\prototype
pnpm test
pnpm build
```

Optional traceability refresh:

```powershell
pnpm coverage
```

Automated tests cover critical validation, ID timing, allocation, reservation, journey, evidence, and delivery-gate rules. Browser-based authenticated cross-role UAT and all live-integration behavior remain outside the POC and must not be inferred from automated tests.

## Key artifacts

- `presentation/LogiPilot_AI_Scoping_Pack.pptx` — final scoping pack.
- `presentation/build_scoping_pack.mjs` — editable PowerPoint generation source.
- `presentation/LogiPilot_AI_Requirement_Coverage.csv` — presentation traceability (86 core requirements; 11 enhancements retained as future scope).
- `prototype/` — React + Vite POC.
- `prototype/REQUIREMENT_TO_TEST_COVERAGE.csv` — requirement-to-demo/test mapping.
- `qa/` — implementation audit, automated test reports, test execution records, and defect report.
- `docs/` — locked requirements, context, enhancement register, and deck requirements.

## Repository hygiene

The repository intentionally excludes dependencies, build output, local environment files, certificates/keys, caches, and temporary PowerPoint-rendering artifacts. No real secrets are required by this POC.
