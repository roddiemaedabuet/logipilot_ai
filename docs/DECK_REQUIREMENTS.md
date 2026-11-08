# PowerPoint scoping pack requirements (authoritative outline)

**Audience:** product/engineering final-interview assessors. **Claim only what is demonstrated or labeled assumed.** Brand as `LogiPilot AI`, enterprise-size integrated ocean logistics; **never mention the real operator used as inspiration**.

## Minimum deck coverage
1. **Title and executive proposition** — what LogiPilot AI does, three connected processes, POC purpose.
2. **Problem and target user** — support, equipment planners, operations, custody handlers; realistic handoffs and data silos; no fabricated metrics.
3. **Top 3 agentic functions** — P1, P2, P3; precise agent tasks vs deterministic decision engine vs human authority.
4. **End-to-end business flow** — Interaction → Request → confirmed Booking → Allocation → Transit/Handoff → POD. Explicit ID lifecycle.
5. **P1 scope, workflow and exception demo** — email/phone, ten-field checklist, missing/conflict, support validation, Request ID.
6. **P2 scope, workflow and options demo** — constraints, substitutes, partial, cost + priority, approval, reservation, draft instruction, execution.
7. **P3 scope, workflow and discrepancy demo** — booking-level single status, custody chain, evidence, human review, partial delivery, POD.
8. **Scope matrix** — in-scope POC vs out-of-scope enhancements; preserve detailed `ENHANCEMENTS.md` as appendix/notes if needed.
9. **Architecture and POC data boundary** — React + Vite; synthetic mock feeds; AI simulation truthfully labeled; authentication demo; audit.
10. **Risks, mitigations and assumptions** — key risk per process and shared risks, including inaccurate data, unrealistic automatic feasibility, human approval bottlenecks, partner data quality, simulated AI limitations. No invented rates or external facts.
11. **Proposed roadmap** — stage 1 POC; stage 2 production feasibility/integrations; stage 3 enterprise scale and named enhancements. Mark proposed/not committed; no unapproved calendar or budgets.
12. **Acceptance, demo and next steps** — test coverage by process, prototype access, GitHub plan if requested.

**Mandatory:** Clear slide(s) or sections for **Risks**, **In Scope**, **Out of Scope**, **Assumptions**, **Roadmap**. Do not use only vague grouped labels.

## Example assumption statements to label (not facts)
- Simulated internal inventory, booking, vessel schedule, email, transcriptions and handoff data in POC.
- User-provided photos and docs represent recorded evidence, not machine-certified physical truth.
- Third-party handoff data is supplied via synthetic records/manual entry in POC.
- AI behavior in prototype may be rule-based/mocked and is clearly disclosed.

## Example risks and mitigations (not invented quantitative claims)
- Source data staleness/inconsistency → provenance and last-updated indicators; review before approval.
- Wrong container compatibility/quantities → deterministic validation; human approval; audit.
- Incomplete cargo evidence/delivery docs → discrepancy block, manual review, POD gate.
- Demonstration mistaken for production AI/integration → label every mock/simulation; avoid fabricated performance metrics.
- Scope overreach in interview timeframe → demo critical end-to-end journey; trace requirements and mark mocked system edges.
