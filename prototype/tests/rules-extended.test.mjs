import test from 'node:test';
import assert from 'node:assert/strict';
import { canApproveHandoff, capacityFor, compatible, planFlags } from '../src/rules.mjs';

test('P2 includes expected-ready inventory only after the configured readiness lead time', () => {
  const unit = { ready: 3, expectedReady: 2, availableAfterDays: 7, reserved: 1 };
  assert.equal(capacityFor(unit, 1), 2);
  assert.equal(capacityFor(unit, 7), 4);
  assert.equal(capacityFor(unit, 30), 4);
});

test('P2 compatibility rule rejects non-reefer equipment for temperature-controlled cargo', () => {
  const booking = { containerType: '40RF', specialHandling: ['Temperature controlled'] };
  assert.equal(compatible(booking, { type: '40RF', condition: 'ready', capabilities: ['reefer'] }), true);
  assert.equal(compatible(booking, { type: '40RF', condition: 'ready', capabilities: [] }), false);
  assert.equal(compatible(booking, { type: '40HC', condition: 'ready', capabilities: ['reefer'] }), false);
});

test('P2 explains synthetic cost-limit and shortage flags', () => {
  const flags = planFlags({ syntheticCostScore: 51, remainingShortage: 2, compatible: true }, 50);
  assert.deepEqual(flags, ['Above configured synthetic cost limit', 'Remaining shortage: 2']);
});

test('P3 permits handoff approval only after physical evidence and discrepancy resolution', () => {
  assert.equal(canApproveHandoff({ discrepancyResolved: false, physicalChecksRecorded: true, handlerApproved: false }), false);
  assert.equal(canApproveHandoff({ discrepancyResolved: true, physicalChecksRecorded: false, handlerApproved: false }), false);
  assert.equal(canApproveHandoff({ discrepancyResolved: true, physicalChecksRecorded: true, handlerApproved: false }), true);
  assert.equal(canApproveHandoff({ discrepancyResolved: true, physicalChecksRecorded: true, handlerApproved: true }), false);
});
