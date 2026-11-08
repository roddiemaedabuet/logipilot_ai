import test from 'node:test';
import assert from 'node:assert/strict';
import { allFieldsValidated, bookingFromSubmittedRequest, bookingIdFor, canApproveHandoff, canCompleteDelivery, canCompleteHandoff, canCreateRequest, canReserve, requestIdFor, reservePlan } from '../src/rules.mjs';
import { initialInteractions } from '../src/demoData.js';

const validated = [
  'Shipper and receiver','Pickup location','Delivery location','Cargo description','Cargo quantity','Weight and dimensions','Ocean freight service','Cargo readiness','Delivery window','Special handling'
].map(name => ({ name, state: 'validated' }));

test('P1 Request ID exists at first contact while validation still gates submission readiness', () => {
  const incomplete = { status: 'Picked Up', fields: validated.map((f, i) => i === 4 ? { ...f, state: 'conflicting' } : f) };
  const complete = { status: 'Picked Up', fields: validated };
  assert.equal(allFieldsValidated(incomplete.fields), false);
  assert.equal(canCreateRequest(incomplete), false);
  assert.equal(canCreateRequest(complete), true);
  assert.equal(requestIdFor('REQ-SYN-001'), 'REQ-SYN-001');
});

test('P1 Support submission creates one Booking ID linked to the existing Request ID', () => {
  const request = initialInteractions[2];
  const booking = bookingFromSubmittedRequest(request);
  assert.equal(bookingIdFor('REQ-SYN-003'), 'BKG-SYN-003');
  assert.equal(booking.bookingId, 'BKG-SYN-003');
  assert.equal(booking.requestId, 'REQ-SYN-003');
  assert.equal(booking.currentStatus, 'Equipment Allocation');
});

test('P2 reservation rejects insufficient or multi-source plans and prevents double allocation', () => {
  const inventory = [{ id: 'INV-1', ready: 2, expectedReady: 2, availableAfterDays: 7, reserved: 0 }];
  const valid = { inventoryId: 'INV-1', quantity: 4, singleOrigin: true };
  const invalid = { inventoryId: 'INV-1', quantity: 5, singleOrigin: true };
  const multiSource = { inventoryId: 'INV-1', quantity: 2, singleOrigin: false };
  assert.equal(canReserve(valid, inventory, 7), true);
  const reserved = reservePlan(valid, inventory, 7);
  assert.equal(reserved[0].reserved, 4);
  assert.equal(canReserve(valid, reserved, 7), false);
  assert.equal(canReserve(invalid, inventory, 7), false);
  assert.equal(canReserve(multiSource, inventory, 7), false);
});

test('P3 blocks handoff and delivery until human evidence, approval, POD, and outstanding quantity gates pass', () => {
  const base = { discrepancyResolved: false, physicalChecksRecorded: false, handlerApproved: false, podRecorded: false, deliveryConfirmed: false, outstandingQuantity: 1 };
  assert.equal(canCompleteHandoff(base), false);
  assert.equal(canApproveHandoff({ ...base, discrepancyResolved: true, physicalChecksRecorded: true }), true);
  const handoffReady = { ...base, discrepancyResolved: true, physicalChecksRecorded: true, handlerApproved: true, outstandingQuantity: 0 };
  assert.equal(canCompleteHandoff(handoffReady), true);
  assert.equal(canCompleteDelivery(handoffReady), false);
  assert.equal(canCompleteDelivery({ ...handoffReady, podRecorded: true, deliveryConfirmed: true }), true);
});
