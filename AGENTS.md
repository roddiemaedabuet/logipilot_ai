# Codex operating instructions — LogiPilot AI

This file controls work in this repository. Read **all** documents in `docs/` before planning or editing anything. Treat `docs/PROJECT_CONTEXT.md` and `docs/REQUIREMENTS_TRACEABILITY.csv` as the product source of truth.

## Non-negotiable constraints
1. The task is a **final-interview case study**: define a roadmap, scope an AI-first agentic logistics application, identify the **top three agentic functions**, deliver a **PowerPoint scoping pack** and an **interactive basic prototype**, and prepare a GitHub-ready repository if applicable.
2. App name: **LogiPilot AI**. Describe the market as a **large multinational integrated ocean-freight/logistics operator**. **Do not name Maersk** or imply an affiliation.
3. Exactly three core functions: **P1 AI Shipment Request Intake; P2 Intelligent Container Allocation; P3 AI Receiving & Handoff Management**. Vessel Disruption Recovery and retrospective AI QA & Coaching are **future enhancements**, NOT P3/core.
4. Do not invent business requirements, integration endpoints, external data, customer identities, feasibility guarantees, prices, estimated times, approval authorities, transport rules, KPI baselines, model accuracy, or real AI capabilities. When information is missing, keep it labeled `TBD` / `ASSUMPTION — PROPOSED`, not settled fact. Ask only for material blockers.
5. Do not treat the future-enhancement list as part of initial POC scope. Do not add new workflow states, IDs, modules, screens, automation or roles absent from the locked requirements. Keep the prototype simple.
6. Preserve the distinction between **agentic assistance** (multi-step extraction, cross-document validation, option generation, recommendations, monitored re-evaluation) and **deterministic business rules** (costs, capacity, priorities, eligibility, inventory quantities and reservation logic). Human approvals are mandatory where specified.
7. Prototype data must be **realistic but clearly synthetic**. Any LLM/agent functionality simulated in the POC must be explicitly labeled **simulated**, never described as a deployed or real integration.
8. Important identity rule: **Request ID** on first customer contact; **Booking ID** only when Support submits a fully validated request. Downstream P2/P3 use Booking ID. **No Interaction ID or Handoff ID**. Pre-booking P1 statuses cannot logically require an as-yet-uncreated Booking ID.
9. Keep **one current journey status per booking** plus historical events; handoff history may have multiple records. Do not introduce a Partial Delivery status. Preserve original P1 states.
10. Admin-created login accounts, temporary credentials, first-login password change, per-module permissions. No unapproved live identity provider or external email integration. Do not commit secrets.
11. Produce a requirement-to-workflow-to-acceptance-criterion-to-demo traceability check for *all* core entries. Do not quietly drop requirements because of POC feasibility; implement simple demonstration mechanisms or explicitly mark as scoped simulation in the deck.
12. Before generating slides, code, or git commits, **first** audit the supplied context, report scope/contradictions and coverage concisely, and obtain user go-ahead. Do not initialize a Git remote, push, or claim backup until authorized.

## Proposed repository folders after user approval
- `presentation/LogiPilot_AI_Scoping_Pack.pptx`
- `prototype/` — React + Vite interactive prototype
- `docs/` — authoritative requirements and traceability
- `README.md` — setup + demo instructions

## Execution discipline
- Cite only what is in these source documents as interview case-study assumptions; do not present guessed metrics as facts.
- Use phased delivery: (A) context audit, (B) slide outline, (C) PPT, (D) prototype, (E) testing and README, (F) user-approved GitHub push.
- Each phase ends with a short coverage checklist and identified unverified assumptions.
