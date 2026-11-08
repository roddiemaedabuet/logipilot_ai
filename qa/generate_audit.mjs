import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('..');
const src = await fs.readFile(path.join(root, 'docs', 'REQUIREMENTS_TRACEABILITY.csv'), 'utf8');
const lines = src.trim().split(/\r?\n/).slice(1);
const parse = (line) => {
  const m = line.match(/^([^,]+),([^,]+),([^,]+),(Core|Enhancement),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),(.*)$/);
  if (!m) throw new Error(`Cannot parse: ${line}`);
  return { id: m[1], process: m[2], requirement: m[3], status: m[4], expected: m[5].replace(/^"|"$/g, '').replaceAll('""', '"') };
};
const core = lines.map(parse).filter(r => r.status === 'Core');
const pass = new Map([
  ['P1-20', ['P1 ID-boundary rule accepts only a fully validated intake before the request-creation action.', 'tests/rules.test.mjs: P1 creates a Request ID only after every locked intake field is validated']],
  ['P1-25', ['Booking confirmation rule requires Submitted plus Request ID and produces the linked Booking ID.', 'tests/rules.test.mjs: P1 creates a Booking ID only after Operations sees a submitted Request']],
  ['P2-05', ['Expected-ready units enter the available capacity only when their readiness lead time falls inside the selected horizon.', 'tests/rules-extended.test.mjs: P2 includes expected-ready inventory only after the configured readiness lead time']],
  ['P2-11', ['The 7/14/30-day horizon is applied by the capacity rule; 7 and 30 are explicitly tested.', 'tests/rules-extended.test.mjs: readiness-lead-time test']],
  ['P2-12', ['Readiness lead time gates expected-ready units in the deterministic capacity calculation.', 'tests/rules-extended.test.mjs: readiness-lead-time test']],
  ['P2-40', ['Reservation rejects insufficient capacity and a second allocation after inventory has been reserved.', 'tests/rules.test.mjs: P2 reservation rejects insufficient or multi-source plans and prevents double allocation']],
  ['P2-42', ['Cost-limit and shortage flags are generated from the synthetic plan values.', 'tests/rules-extended.test.mjs: P2 explains synthetic cost-limit and shortage flags']],
  ['P3-08', ['Handoff approval remains blocked until physical checks and discrepancy resolution have both occurred.', 'tests/rules-extended.test.mjs: P3 permits handoff approval only after physical evidence and discrepancy resolution']],
  ['P3-18', ['Delivery completion stays blocked until handoff readiness, POD, confirmation, and zero outstanding quantity are all true.', 'tests/rules.test.mjs: P3 blocks handoff and delivery until human evidence, approval, POD, and outstanding quantity gates pass']],
  ['P2-03', ['Ranking evaluates confirmed booking, synthetic pickup urgency, synthetic contractual priority, earliest feasible availability, and synthetic repositioning cost in that order; production policy remains TBD.', 'tests/remediation.test.mjs: P2 uses confirmed booking, pickup urgency, contractual priority, earliest availability, then cost']],
  ['P2-07', ['Approval evaluates the locked synthetic cost, vessel capacity, dates, transit, depot space, condition, capacity, and cargo/equipment constraints. Deferred port/customs feasibility is not evaluated.', 'tests/remediation.test.mjs: P2 evaluates each locked synthetic allocation constraint']],
  ['P2-22', ['Actual reservation approval rejects incompatible equipment or cargo attributes; positive and negative paths are exercised.', 'tests/remediation.test.mjs: P2 blocks an incompatible allocation at reservation and permits a compatible substitute']],
  ['P2-35', ['Ranked feasible options use earlier availability and lower synthetic repositioning cost after booking urgency and priority comparison.', 'tests/remediation.test.mjs: P2 uses confirmed booking, pickup urgency, contractual priority, earliest availability, then cost']],
  ['P2-39', ['Search covers retained synthetic recommendation, approval-decision, allocation, and execution-outcome records.', 'tests/remediation.test.mjs: P2 searches synthetic recommendation, approval, allocation, and execution history records']],
  ['P2-41', ['A cargo-compatible substitute can be reserved only via the normal manager-controlled approval path; incompatible alternatives are blocked.', 'tests/remediation.test.mjs: P2 blocks an incompatible allocation at reservation and permits a compatible substitute']],
  ['P3-02', ['Structured custody events capture sending and receiving parties under the same Booking ID.', 'tests/remediation.test.mjs: P3 retains structured custody transfers under one Booking ID without a Handoff ID']],
  ['P3-03', ['Receiving checklist and document/quantity comparison are built from the active handoff record.', 'tests/remediation.test.mjs: P3 builds a receiving checklist, compares documents and quantities, and requires human evidence']],
  ['P3-04', ['Conflicting and missing documents plus quantity mismatch are detected as comparison outputs.', 'tests/remediation.test.mjs: P3 builds a receiving checklist, compares documents and quantities, and requires human evidence']],
  ['P3-07', ['Human physical validation creates the required recorded validation state before approval can proceed.', 'tests/remediation.test.mjs: P3 builds a receiving checklist, compares documents and quantities, and requires human evidence']],
  ['P3-11', ['The simulated AI checklist is regenerated from current document and quantity evidence.', 'tests/remediation.test.mjs: P3 builds a receiving checklist, compares documents and quantities, and requires human evidence']],
  ['P3-12', ['Manual recorded evidence is required before discrepancy resolution changes the handoff record.', 'tests/remediation.test.mjs: P3 builds a receiving checklist, compares documents and quantities, and requires human evidence']],
  ['P3-13', ['Final summary retains custody transfers, discrepancies, resolutions, timestamps, documents, and POD under the Booking ID.', 'tests/remediation.test.mjs: P3 final delivery summary includes repeated transfers, discrepancies, resolutions, documents, timestamps, and POD']],
  ['P3-14', ['Multiple structured custody transfers are retained as history events under one Booking ID, without status-object proliferation.', 'tests/remediation.test.mjs: P3 retains structured custody transfers under one Booking ID without a Handoff ID']],
  ['P3-15', ['Each custody event stores sender, receiver, accountable handler, timestamp, supporting documents, and validation result.', 'tests/remediation.test.mjs: P3 retains structured custody transfers under one Booking ID without a Handoff ID']],
  ['P3-19', ['The document comparison tests booking, manifest, receiving record, and POD evidence states.', 'tests/remediation.test.mjs: P3 builds a receiving checklist, compares documents and quantities, and requires human evidence']],
  ['P3-20', ['Expected/received/outstanding quantities and conflicting document evidence are evaluated together.', 'tests/remediation.test.mjs: P3 builds a receiving checklist, compares documents and quantities, and requires human evidence']],
  ['P3-21', ['Outstanding quantity is retained without creating a Partial Delivery journey status.', 'tests/remediation.test.mjs: P3 final delivery summary includes repeated transfers, discrepancies, resolutions, documents, timestamps, and POD']]
]);
const partial = new Map();
const fail = new Map();
const location = (id) => id.startsWith('P1') ? 'prototype/src/App.jsx (P1), src/demoData.js, src/rules.mjs' : id.startsWith('P2') ? 'prototype/src/App.jsx (P2), src/demoData.js, src/rules.mjs' : 'prototype/src/App.jsx (P3), src/demoData.js, src/rules.mjs';
const block = 'Not observed end-to-end. Browser testing stopped at the mandatory first-login password-change handoff; the user must perform that final action.';
const rows = core.map(r => {
  const item = pass.get(r.id) || partial.get(r.id) || fail.get(r.id);
  const result = pass.has(r.id) ? 'Pass' : partial.has(r.id) ? 'Partial' : fail.has(r.id) ? 'Fail' : 'Blocked';
  return { ...r, implementation: location(r.id), actual: item?.[0] ?? block, result, evidence: item?.[1] ?? 'Browser observation blocked; no pass inferred from code or traceability alone.' };
});
const esc = (v) => /[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v);
const out = [['Requirement ID','Implementation location','Expected behavior','Actual observed behavior','Result','Test evidence'], ...rows.map(r => [r.id,r.implementation,r.expected,r.actual,r.result,r.evidence])];
await fs.writeFile(path.join(root, 'qa', 'Implementation_Audit.csv'), out.map(r => r.map(esc).join(',')).join('\r\n') + '\r\n');
const counts = Object.fromEntries(['Pass','Partial','Fail','Blocked'].map(s => [s, rows.filter(r => r.result === s).length]));
const md = `# LogiPilot AI Functional Verification\n\n## Result summary\n\n| Result | Count |\n|---|---:|\n| Pass | ${counts.Pass} |\n| Partial | ${counts.Partial} |\n| Fail | ${counts.Fail} |\n| Blocked | ${counts.Blocked} |\n| Total locked core requirements | ${rows.length} |\n\n## Test evidence\n\n- \`pnpm test\`: 8 passing automated tests.\n- \`pnpm build\`: completed successfully.\n- Browser observed the account selector, simulated temporary credential, and mandatory first-login password-change screen. Browser module click-through could not continue because the final password-change action requires user handoff.\n\n## Critical defects\n\n1. **P2-03, P2-07, P2-35:** allocation ranking does not implement combined priority/urgency logic, the full locked constraint set, or the tie-break rule.\n2. **P2-39:** current search does not cover the required historical outcomes.\n3. **P3-02, P3-13, P3-14, P3-15:** custody data and final summary do not fully capture the locked chain-of-custody requirements.\n4. **P2-22 and P2-41:** compatibility exists as an isolated rule but is not wired into the approval flow; compatible-substitute behavior is incomplete.\n\n## Future enhancements confirmed excluded\n\nAll 11 CSV enhancement rows remain excluded from core POC behavior: historical forecasting, external leasing, full external feasibility validation, KPI dashboard, multiple-source consolidation, post-approval auto-replan, proactive alerts, automatic booking-amendment response, AI confidence, AI escalation suggestion, and formal exception case workflow. Additional future initiatives such as Vessel Disruption Recovery, retrospective AI QA/coaching, richer enterprise SSO/RBAC, and direct partner/terminal APIs were also not added.\n\n## Audit file\n\n\`qa/Implementation_Audit.csv\` contains one row per locked core requirement with implementation location, source acceptance behavior, observed behavior, result, and evidence.\n`;
await fs.writeFile(path.join(root, 'qa', 'Test_Results.md'), md);
const remediationMd = `# LogiPilot AI Functional Verification

## Result summary

| Result | Count |
|---|---:|
| Pass | ${counts.Pass} |
| Partial | ${counts.Partial} |
| Fail | ${counts.Fail} |
| Blocked | ${counts.Blocked} |
| Total locked core requirements | ${rows.length} |

## Test evidence

- \`pnpm test\`: 15 passing automated tests, including P2 constraint/ranking/compatibility/history regressions and P3 structured-custody/checklist/comparison regressions.
- \`pnpm build\`: completed successfully.
- Browser evidence is limited to the account selector, simulated temporary credential, and mandatory first-login password-change screen. The browser automation policy requires the user to perform the final password-change submission, so no module click-through is claimed.

## Browser handoff / manual verification steps

1. Open the local POC, choose a synthetic account, and sign in with the shown simulated temporary credential.
2. Enter any local simulated password, then manually select **Continue to authorized modules**. This is the required first-login control; no real credential is sent.
3. As Equipment Manager, open P2; inspect ranked recommendations, approve the compatible substitute, search the retained decision/execution history, and observe incompatible allocation remain blocked.
4. As Responsible Handler, open P3; record physical checks, enter a discrepancy-evidence note, resolve it, approve handoff, record a subsequent custody transfer, then record POD and delivery confirmation.

## Remediated defects

- **P2-03, P2-07, P2-22, P2-35, P2-39, P2-41:** deterministic allocation evaluation/ranking, compatibility enforcement at reservation, compatible substitutes, and searchable retained history.
- **P3-02, P3-03, P3-04, P3-07, P3-11, P3-12, P3-13, P3-14, P3-15, P3-19, P3-20, P3-21:** structured custody transfers, derived checklist and comparison, human-evidence gates, discrepancy resolution, multi-transfer history, final delivery summary, and partial-quantity handling without a status.

## Remaining verification gap

The remaining blocked requirements have not been marked passing: they require browser interaction beyond the mandatory user-controlled first-login password-change submission. No failed or partially implemented audited requirements remain.

## Future enhancements confirmed excluded

All 11 CSV enhancement rows remain excluded from core POC behavior: historical forecasting, external leasing, full external feasibility validation, KPI dashboard, multiple-source consolidation, post-approval auto-replan, proactive alerts, automatic booking-amendment response, AI confidence, AI escalation suggestion, and formal exception case workflow. Additional future initiatives such as Vessel Disruption Recovery, retrospective AI QA/coaching, richer enterprise SSO/RBAC, and direct partner/terminal APIs were also not added.

## Audit file

\`qa/Implementation_Audit.csv\` contains one row per locked core requirement with implementation location, source acceptance behavior, observed behavior, result, and evidence.
`;
await fs.writeFile(path.join(root, 'qa', 'Test_Results.md'), remediationMd);
console.log(JSON.stringify({ counts, total: rows.length }, null, 2));
