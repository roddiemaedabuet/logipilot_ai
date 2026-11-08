import test from 'node:test';
import assert from 'node:assert/strict';
import { initialInteractions } from '../src/demoData.js';
import { allFieldsValidated, appendP1Evidence, canCreateRequest, extractP1Fields } from '../src/rules.mjs';

const byName = (fields, name) => fields.find((field) => field.name === name);

test('P1 evidence pipeline produces different ticket-specific extraction results', () => {
  const [ticketA, ticketB, ticketC] = initialInteractions;
  const a = extractP1Fields(ticketA.sourceRecords);
  const b = extractP1Fields(ticketB.sourceRecords);
  const c = extractP1Fields(ticketC.sourceRecords);
  assert.notEqual(byName(a, 'Cargo description').value, byName(b, 'Cargo description').value);
  assert.notEqual(byName(b, 'Cargo description').value, byName(c, 'Cargo description').value);
  assert.equal(byName(c, 'Weight and dimensions').state, 'validated');
  assert.equal(allFieldsValidated(c), true);
});

test('P1 detects Ticket A weight conflict and retains both original evidence values', () => {
  const fields = extractP1Fields(initialInteractions[0].sourceRecords);
  const weight = byName(fields, 'Weight and dimensions');
  assert.equal(weight.state, 'conflicting');
  assert.equal(weight.provenance.length, 2);
  assert.ok(weight.provenance.some((item) => item.value.includes('15 tonnes')));
  assert.ok(weight.provenance.some((item) => item.value.includes('40 tonnes')));
  assert.match(weight.clarification, /confirm the correct weight and dimensions/i);
});

test('P1 preserves Ticket B missing data and only suggests clarification for missing fields', () => {
  const fields = extractP1Fields(initialInteractions[1].sourceRecords);
  const weight = byName(fields, 'Weight and dimensions');
  const delivery = byName(fields, 'Delivery window');
  assert.equal(weight.state, 'missing');
  assert.equal(weight.value, 'Not supplied in source records');
  assert.equal(delivery.state, 'missing');
  assert.match(weight.clarification, /grossWeight, dimensions, equipmentType/);
  assert.match(delivery.clarification, /deliveryWindow/);
  assert.equal(byName(fields, 'Cargo quantity').clarification, null);
});

test('P1 recalculates a field when new source evidence is appended without fabricating other values', () => {
  const ticketB = initialInteractions[1];
  const update = { source: 'Synthetic customer clarification', at: 'Synthetic event 04', facts: {
    'Weight and dimensions': { value: '18 tonnes gross; 1.00 m × 0.80 m × 0.60 m; one 20DV container', subfields: { grossWeight: '18 tonnes gross', dimensions: '1.00 m × 0.80 m × 0.60 m', equipmentType: '20DV', containerQuantity: '1' } }
  } };
  const updated = appendP1Evidence(ticketB, update);
  const fields = extractP1Fields(updated.sourceRecords);
  assert.equal(byName(fields, 'Weight and dimensions').state, 'validated');
  assert.equal(byName(fields, 'Delivery window').state, 'missing');
  assert.equal(byName(fields, 'Weight and dimensions').provenance.at(-1).source, 'Synthetic customer clarification');
});

test('P1 human Request-ID gate remains dependent on extracted completeness', () => {
  const [ticketA, , ticketC] = initialInteractions;
  assert.equal(canCreateRequest({ ...ticketA, fields: extractP1Fields(ticketA.sourceRecords) }), false);
  assert.equal(canCreateRequest({ ...ticketC, fields: extractP1Fields(ticketC.sourceRecords) }), true);
});
