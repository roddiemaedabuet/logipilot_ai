# LogiPilot AI — Codex source-of-truth pack

This is **not** a finished PPT or prototype. It is the locked discovery context and instructions for Codex to avoid feature invention before development.

## On your Windows PC
1. Extract this ZIP **directly into** `C:\LogiPilot_AI\` so `C:\LogiPilot_AI\AGENTS.md` and `C:\LogiPilot_AI\docs\PROJECT_CONTEXT.md` exist.
2. Open Codex in `C:\LogiPilot_AI`.
3. Paste the contents of `CODEX_START_HERE.txt` as your **first prompt**.
4. Review Codex's audit **before** telling it to generate the PowerPoint.
5. After approval, build PPT → interactive prototype → test/README → explicitly authorized GitHub backup.

## Contents
- `AGENTS.md` — Codex rules and no-hallucination guardrails.
- `docs/PROJECT_CONTEXT.md` — P1/P2/P3 product requirements, statuses, IDs, workflow and architecture context.
- `docs/REQUIREMENTS_TRACEABILITY.csv` — 25 P1 requirements, 49 P2 decisions, 23 P3 decisions with core/enhancement status.
- `docs/ENHANCEMENTS.md` — future enhancements not to implement as core.
- `docs/DECK_REQUIREMENTS.md` — PPT checklist, risks, assumptions, scope and roadmap.
- `CODEX_START_HERE.txt` — first prompt for Codex.

## Special note on source-of-truth
The 49 P2 and 23 P3 entries correspond to the numbered discovery questions. P1 was a locked discussion rather than a numbered 1–25 question series; its 25 rows are **requirements extracted from decisions**, not user-answer question numbers. If a material discrepancy is found, ask user before changing the locked scope.
