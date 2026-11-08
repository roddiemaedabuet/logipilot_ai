# LogiPilot AI — Authoritative Product Context (interview case study)

**Status:** Requirements discovery for P1, P2 and P3 has been completed/locked in conversation. This pack records those decisions. PPT, prototype, and GitHub publishing have **not** been authorized for execution by this pack alone.

## 1. Employer's exact deliverable contract
- **Scope and create a POC of an Agentic logistics app that is AI-first.**
- **Define the roadmap and identify top 3 agentic functions that the app should have.**
- **Output: a scoping pack (PPT), a basic prototype (ideally interactive), and GitHub repos if applicable.**

The evaluation concerns Product Management and Engineering ability. Present realistic prioritization, a coherent MVP scope, execution risks, assumptions, and an interactive proof of concept. Do not promise a production platform.

## 2. Positioning and system boundary
- Name: **LogiPilot AI**.
- Customer archetype: **large, multinational, enterprise-scale integrated ocean freight/logistics operator**. Do **not** reference Maersk by name.
- P1 POC shipment mode: **ocean freight only**. P2 supports container movements internationally; P3 supports ocean transport and applicable inland handoffs.
- Primary users: shore-based support agents, Equipment Managers/Container Allocation Planners, Operations users, responsible sending/receiving handlers; administrators manage access. Not seafarers.
- One unified application with **three** permission-controlled modules and shared records.
- Core process chain: **P1 request intake → Operations booking confirmation → P2 container allocation → P3 shipment tracking & custody handoff → delivery**.
- System of record in this POC is **synthetic**. Any automatic updates and integrations are simulated using defined sample data/events, not real enterprise APIs.
- Humans remain responsible for sending customer communications, approving allocations and handoffs, physical evidence, discrepancies, and final delivery confirmation.

## 3. Locked identities and status semantics
- **Request ID:** issued at first email/phone contact; exists even for incomplete or abandoned request and remains unchanged through Support processing.
- **Booking ID:** issued **only when Support submits a fully validated request**; links to the source Request ID and becomes immediately available to Container Allocation.
- **Shipment ID:** an optional later operational identifier after confirmed booking, **not a P1 ID**. Do not create an unnecessary extra identifier in POC.
- **Handoff ID:** explicitly **prohibited**. Store multiple handoff events under the existing Booking ID.
- **P1 intake lifecycle:** `Pending` (unassigned) → `Picked Up` (assigned) ↔ `For Clarification` (missing/conflict) → `Ready for Submission` (Support-validated) → `Submitted` (Booking ID generated automatically). Support may approve, request clarification, or reject invalid requests with recorded reason and audit history; do not invent new status labels without approval.
- **Booking journey:** ONE current status for a confirmed booking; chronological status + custody event log. Finalized status vocabulary for cross-process display: `Pending`, `Picked Up (Support)`, `Ready for Submission`, `Submitted`, `Equipment Allocation`, `Ready for Pickup`, `Cargo Collected`, `At Origin Port`, `Ocean Transit`, `Landed at Destination Port`, `Inland Transit` (if applicable), `Arrived at Receiving Location`, `Under Validation`, `Handed Off`, `Partially Delivered`, `Delivered / Completed`; `For Clarification` is an exception state. Once Support submission creates a Booking ID, the shared booking journey begins at `Equipment Allocation`. For repeated custody transfers, record separate handoff events under the booking, not duplicate persistent statuses.
- P2 allocation approval statuses are distinct from booking journey states: `Draft`, `Pending Approval`, `Approved`, `Rejected`, `Cancelled`. P2 execution statuses: `Pending`, `In Progress`, `Completed`, `Failed`.

## 4. P1 — AI Shipment Request Intake (LOCKED)
**Trigger:** Shipper/supplier reaches Support by email or phone. P1 is not a generic receiving checklist.

### P1 inputs and workflow
1. Email channel: capture email content, attachments, conversation thread; AI extracts and summarizes, checks completeness, flags conflicts and drafts follow-up questions; on reply, refresh extraction/validation. Support reviews and sends messages.
2. Phone channel: authorized live transcription or support-authored notes/documents; AI summarizes while the call is ongoing, updates checklist and suggests questions; Support speaks with customer. Simulate channels where real telephony/email are unavailable.
3. Every required field has evidence/provenance (source email, attachment, phone note), an individual completeness/consistency state, and a correction history. Never silently overwrite conflicting values.
4. Support can manually/automatically receive an assigned interaction, transfer it, review summaries and checklists, ask for clarification, and reject an invalid request with reason; assignment mechanics are ordinary workflow, not an AI-agent capability.
5. On complete, human-validated required fields: retain the Request ID created at first contact; Support submission creates the linked Booking ID and makes the record available to Container Allocation.

### The ten required intake fields (granular, not collapsed)
1. **Shipper AND Receiver (Consignee)**: each party's company, contact person, email, phone, full address, country.
2. **Pickup location**: full address, map pin/link where available, origin port where applicable; ambiguous locations flagged.
3. **Delivery location**: full destination address, port and map pin/link when applicable.
4. **Cargo description**: commodity, suitability, consistency with stated quantity, weight, dimensions and handling.
5. **Cargo quantity**: number of packages/units/containers; reconcile against documents.
6. **Weight and dimensions**: gross weight, dimensions, container size/type, plausibility vs load limits, over-size/over-weight indicators.
7. **Ocean freight service**: FCL vs LCL, port-to-port vs door-to-door and any relevant inland leg.
8. **Preferred pickup date / cargo readiness**.
9. **Required delivery date or window**; flag schedule concerns only if verified schedule data exist; never guarantee feasibility.
10. **Special handling**: hazardous, refrigerated/temperature controlled, fragile, oversized, etc.

AI checklist identifies `missing`, `partial`, `conflicting`, `implausible` and validated values per field, proposes targeted clarifications, integrates updates with provenance, and requires human final validation. Example: email says two containers of 15 tonnes each; another document says 40 tonnes total; flag inconsistency rather than assuming correction.

**Interactive POC minimum:** email/phone simulated interactions, thread/transcript, AI summary, all-ten-field checklist, follow-up suggestion, human validation, Request ID lifecycle, submission to Operations, audit history.

## 5. P2 — Intelligent Container Allocation (LOCKED)
**Persona:** Equipment Manager/Container Allocation Planner. Supports all container types (including reefer and specialty) and international ports/depots. Prioritizes confirmed bookings, earliest pickup deadlines, and contractual customer priority.

**Core workflow:** current + expected-ready inventory and confirmed demand → constrained compatibility and shortage check → several ranked explanations/alternatives incl. substitute/partial/reposition options → manager comparison, modification, manual alternative, review and approve → reserve inventory (no double allocation) + draft instruction for Operations → track execution. AI recommends; **does not auto-approve or execute**.

**Example synthetic situation, purely illustrative:** Port A has an equipment surplus and Port B has a shortage. Use configurable 7/14/30-day planning horizon, default **30 days**. Do not treat numeric demo quantities as actual industry facts.

**Locked important distinctions:**
- Demand = **confirmed bookings only**; historical demand forecasting is enhancement.
- Available inventory includes ready empty containers **plus expected returns**, only after cleaning/inspection/maintenance/repositioning lead time.
- Constraints: transport cost, available vessel capacity, dates, transit time, depot storage capacity, container condition and size, cargo compatibility (temperature, hazard, dimensions, weight and special handling). Full verification of port/terminal/customs requirements and cutoffs is *enhancement*; do not imply completed real-world feasibility certification.
- Recommendation includes quantity/type, origin/destination/schedule, cost, ETA/transit time, affected booking IDs, risks, priority rationale, expected shortage or delay, and comparative options. Prefer **lowest feasible cost** while respecting priority/deadlines; flag configured cost limit overruns.
- Reactive reassessment based on relevant operational changes before approval and `Recalculate` user action; stale recommendations revalidated before approval. **Autonomous revised plans after approval** are enhancement.
- No external leasing in core; when unresolvable, identify affected bookings and estimated delay instead.
- **One source location per recommended allocation plan in core**; combining containers from multiple source locations to fulfill a destination is enhancement.
- Authorized Equipment Manager approves, rejects, modifies or performs manual allocations with reasons; Operations receives draft repositioning instruction on approval. Approved containers reserved; cancellations before execution with reason.
- Inventory display, plan comparisons, booking linkage, searchable history, freshness indicators and execution states are included. Automated alert center and KPI dashboard are enhancements.
- POC uses realistic synthetic inventory/booking/schedule/cost feeds (no live integration). Full decision-by-decision list is in `REQUIREMENTS_TRACEABILITY.csv` (`P2-01` ... `P2-49`).

**Interactive POC scenario:** shortage → AI recommendation options → side-by-side comparison → manager approval → reservation → draft Operations instruction → status tracking, with one partial/unresolvable example.

## 6. P3 — AI Receiving & Handoff Management (LOCKED)
**Not Vessel Disruption Recovery** (now future enhancement). This is **custody and evidence tracking** at receiving locations through delivery. Real logistics partner/terminal/trucker may be external; do not assume the operator owns every touchpoint.

**Core P3 handoff occurs when cargo arrives at a receiving location**, while booking journey tracking begins at booking confirmation. Each transition records sending/receiving parties, responsible last handler, timestamp, documents and validation outcomes *under the Booking ID*.

- AI compiles standardized handoff package and checklist from booking, manifest, shipping docs, receiving docs, container information, special handling and previous handoffs. It **compares** expected vs recorded actual cargo and identifies missing, inconsistent, conflicting or invalid information.
- Last responsible/sending handler, not a mandatory Equipment Manager, reviews/approves the handoff and supplies records to the next receiving team. Do not invent an obligatory separate receiver accept/reject step; it was not locked.
- Physical count, condition, seal and container checks are performed by human staff and documented. AI checks the **recorded evidence**; it cannot independently confirm physical truth.
- When discrepancy appears, block automatic handoff **completion**, show AI-suggested actions, require human intervention, photos/documents/explanation, check evidence and retain resolution/audit history. There is **no autonomous AI escalation** or formal exception workflow in core; both are enhancements. Manual operational escalation remains possible.
- Partial delivery: an authorized Receiver records documented delivered/outstanding quantity under the Booking ID; keep booking **open** at `Partially Delivered` while quantity remains. Unexplained shortage or unresolved discrepancy remains `Under Validation`.
- Track every successive handoff to final consignee; one current booking status with event history. Automatic status updates from available simulated operational records and authorized manual updates.
- Completion requires proof of delivery and responsible-handler confirmation; generate full final summary (handoffs, discrepancies, resolutions, POD).
- Interactive POC: booking confirmed → journey transit/arrival → AI validation → manual discrepancy intervention → accepted handoff → POD → completion. `P3-01` ... `P3-23` in traceability file.

## 7. Access, technical and delivery guidance
- Existing approved technical direction: **React + Vite** for interactive prototype. Framework use is not justification for adding features.
- Admin manually creates accounts; temp credentials delivered via email as a business requirement; first login forces password change. Email transport may be mocked for POC, **clearly shown as simulated**. Each user sees only modules individually authorized.
- Role boundary: Support approves P1 validation/submission; Equipment Manager approves P2; responsible sending handler approves P3 handoff, and responsible handler confirms delivery. Operations handles booking confirmation and receives P2 draft instruction. Admin manages users. Do not assume elaborate enterprise RBAC.
- Data: self-contained synthetic dataset, deterministic sample scenarios, visible sample data freshness and change events, no secrets or live dependencies. Explain that AI functionality may be simulated and differentiate it from deterministic calculations.
- All core requirements must be represented in design/traceability; POC can simulate enterprise feeds and document processing, rather than integrate real systems.
- Git backup to remote **later and only when expressly requested**. No automatic push or remote creation.

## 8. PPT must explicitly include
1. Case study / problem and enterprise-ocean-logistics target archetype (without client-name references).
2. Executive scope, business objectives, users, workflow / journey.
3. The **three** agentic functions, why agentic, and human-vs-agent decision boundaries.
4. P1, P2, P3 workflows including exception paths and interactive demo storyboard.
5. **In scope, Out of scope, Assumptions, Risks and mitigations** clearly separated (for product overall and process-specific where relevant).
6. High-level technical architecture, mocked data/integration boundary, safeguards and auditability.
7. A **proposed roadmap**: POC → pilot/integration feasibility → scaled enterprise enhancements (qualitative; **no invented committed dates or budgets**).
8. POC acceptance criteria / demo outcomes and next steps.
9. Be explicit that the prototype is a basic interview POC and which AI behaviors are mocked.

## 9. Contradiction guards and out-of-scope boundary
- Initial P1 intake states are pre-booking Request records; Support submission creates the Booking ID and starts the shared journey at Equipment Allocation.
- P2 reactive reassessment **before approval** is core; automatically regenerating post-approval plans without user intervention is enhancement.
- P2 rejected `multi-source consolidation`, but **multiple alternative single-origin options** remain core.
- P3 manually resolving discrepancies is core; **formal manual exception case management** is enhancement.
- P3 can record documented partial delivery quantitatively and use the Product Owner-approved `Partially Delivered` journey status while quantity remains.
- External tracking is represented through synthetic records, not claims of control over third parties.
- A *draft* repositioning instruction is not evidence that the movement was dispatched; track execution separately.

## 10. Acceptance criteria and coverage
`REQUIREMENTS_TRACEABILITY.csv` is the coverage source; every `Core` row must be demonstrable or have an explicit explanation of simulated data and working UI. `Enhancement` rows must not be silently implemented/represented as core. The prototype need not integrate actual enterprise APIs, email systems, telephony, port systems, vessel controls, or customs platforms.
