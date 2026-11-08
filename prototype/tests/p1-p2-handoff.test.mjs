import test from 'node:test';
import assert from 'node:assert/strict';
import { initialInteractions } from '../src/demoData.js';
import { bookingFromSubmittedRequest, bookingIdFor, evaluateAllocation, extractP1Fields, recordCustomerClarification } from '../src/rules.mjs';

test('P1 to P2 handoff creates one Booking ID from an existing Request ID without an Interaction ID', () => {
  const request = initialInteractions[2];
  assert.equal(request.interactionId, undefined);
  assert.equal(request.requestId, 'REQ-SYN-003');
  const booking = bookingFromSubmittedRequest(request);
  assert.equal(booking.bookingId, bookingIdFor(request.requestId));
  assert.equal(booking.requestId, request.requestId);
  assert.equal(booking.currentStatus, 'Equipment Allocation');
  assert.equal(booking.containerType, '40HC');
  assert.equal(booking.quantity, 1);
  assert.equal(booking.cargo, extractP1Fields(request.sourceRecords).find(field => field.name === 'Cargo description').value);
});

test('separate submitted requests produce separately selectable booking identities', () => {
  const first = bookingFromSubmittedRequest(recordCustomerClarification(initialInteractions[0], { fieldName: 'Weight and dimensions', ...initialInteractions[0].customerClarificationTemplates['Weight and dimensions'], at: 'Customer clarification received' }));
  const second = bookingFromSubmittedRequest(initialInteractions[2]);
  assert.notEqual(first.bookingId, second.bookingId);
  assert.notEqual(first.requestId, second.requestId);
  assert.notEqual(first.customer, second.customer);
});

test('Ticket A hands 2 × 40RF and its clarified 30-tonne gross weight to P2 without parsing 40RF as a quantity', () => {
  const request = initialInteractions[0];
  const clarification = request.customerClarificationTemplates['Weight and dimensions'];
  const clarified = recordCustomerClarification(request, { fieldName: 'Weight and dimensions', ...clarification, at: 'Customer clarification received' });
  const booking = bookingFromSubmittedRequest(clarified);
  assert.equal(booking.quantity, 2);
  assert.equal(booking.containerType, '40RF');
  assert.match(booking.grossWeight, /30 tonnes total/i);
});

test('Phone booking retains the selected 1 × 40HC requirement for booking-specific allocation validation', () => {
  const booking = bookingFromSubmittedRequest(initialInteractions[2]);
  const rotterdamInventory = [{ id: 'INV-RTM-40HC', type: '40HC', ready: 5, expectedReady: 1, availableAfterDays: 14, reserved: 1, condition: 'ready', capabilities: [] }];
  const plan = { id: 'PLAN-RTM-40HC', inventoryId: 'INV-RTM-40HC', affectedBookingIds: [booking.bookingId], type: '40HC', quantity: 1, singleOrigin: true, dimensionCompatible: true, weightCompatible: true, specialHandlingCompatible: true, vesselCapacityAvailable: true, depotStorageAvailable: true, availableDay: 14, syntheticTransitDays: 18, repositionCostScore: 48 };
  assert.equal(booking.quantity, 1);
  assert.equal(booking.containerType, '40HC');
  assert.equal(evaluateAllocation(plan, booking, rotterdamInventory, 30, 50).feasible, true);
});
