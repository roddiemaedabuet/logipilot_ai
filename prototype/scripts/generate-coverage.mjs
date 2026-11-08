import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('..');
const input = await fs.readFile(path.join(root, 'docs', 'REQUIREMENTS_TRACEABILITY.csv'), 'utf8');
const lines = input.trim().split(/\r?\n/).slice(1);
const parse = (line) => {
  const m = line.match(/^([^,]+),([^,]+),([^,]+),(Core|Enhancement),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),(.*)$/);
  if (!m) throw new Error(`Cannot parse source row: ${line}`);
  return { id: m[1], process: m[2], requirement: m[3], status: m[4] };
};
const esc = (v) => /[",\n]/.test(String(v)) ? `"${String(v).replaceAll('"', '""')}"` : String(v);
const remediationTests = new Map([
  ['P2-03', 'tests/remediation.test.mjs: combined priority and tie-break regression'],
  ['P2-07', 'tests/remediation.test.mjs: full synthetic allocation-constraint regression'],
  ['P2-22', 'tests/remediation.test.mjs: incompatible reservation blocked / compatible substitute accepted'],
  ['P2-35', 'tests/remediation.test.mjs: combined priority and tie-break regression'],
  ['P2-39', 'tests/remediation.test.mjs: history-search regression'],
  ['P2-41', 'tests/remediation.test.mjs: incompatible reservation blocked / compatible substitute accepted'],
  ['P3-02', 'tests/remediation.test.mjs: structured custody-transfer regression'],
  ['P3-03', 'tests/remediation.test.mjs: receiving checklist and comparison regression'],
  ['P3-04', 'tests/remediation.test.mjs: receiving checklist and comparison regression'],
  ['P3-07', 'tests/remediation.test.mjs: human physical-validation and resolution regression'],
  ['P3-11', 'tests/remediation.test.mjs: receiving checklist and comparison regression'],
  ['P3-12', 'tests/remediation.test.mjs: human physical-validation and resolution regression'],
  ['P3-13', 'tests/remediation.test.mjs: final delivery-summary regression'],
  ['P3-14', 'tests/remediation.test.mjs: structured custody-transfer regression'],
  ['P3-15', 'tests/remediation.test.mjs: structured custody-transfer regression'],
  ['P3-19', 'tests/remediation.test.mjs: receiving checklist and comparison regression'],
  ['P3-20', 'tests/remediation.test.mjs: receiving checklist and comparison regression'],
  ['P3-21', 'tests/remediation.test.mjs: final delivery-summary regression']
]);
const rows = [['Requirement ID','Process','Requirement','Status','Prototype workflow / UI','Automated test or validation','Coverage status','Known limitation']];
for (const r of lines.map(parse)) {
  if (r.status === 'Enhancement') {
    rows.push([r.id,r.process,r.requirement,r.status,'Out of scope registry and deck','No core POC test','Deferred enhancement','Deliberately excluded from prototype']);
    continue;
  }
  const p1 = r.id.startsWith('P1'); const p2 = r.id.startsWith('P2');
  rows.push([r.id,r.process,r.requirement,r.status,
    p1 ? 'P1 Intake workspace: interaction, simulated channels, field checklist, human decisions, audit, Operations confirmation' : p2 ? 'P2 Allocation workspace: confirmed demand, inventory, recommendations, manager decision, reservation, execution' : 'P3 Handoff workspace: booking journey, checklist, evidence comparison, human validation, handoff, POD',
    remediationTests.get(r.id) || (p1 ? 'P1-FLOW automated boundary tests plus visible workflow state' : p2 ? 'P2-RULES automated reservation tests plus visible workflow state' : 'P3-GATES automated completion tests plus visible workflow state'),
    'Implemented or explicitly simulated in POC',
    'Synthetic data and simulated AI/integration edge visibly labeled']);
}
await fs.writeFile(path.join(root, 'prototype', 'REQUIREMENT_TO_TEST_COVERAGE.csv'), rows.map(r => r.map(esc).join(',')).join('\r\n') + '\r\n');
console.log(`Wrote ${rows.length - 1} traceability rows.`);
