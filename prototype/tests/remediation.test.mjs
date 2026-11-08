import test from 'node:test';
import assert from 'node:assert/strict';
import { JOURNEY_STATUSES, buildReceivingChecklist, canCompleteDelivery, canReserve, compareReceivingEvidence, createCustodyEvent, deliveryOutstandingQuantity, deliverySummary, documentValidationLabel, evaluateAllocation, isAwaitingArrivalConfirmation, isReceivingEligible, rankAllocationPlans, recordPartialDelivery, recordPhysicalValidation, recordProofOfDelivery, reservePlan, resolveReceivingDiscrepancy, searchAllocationHistory } from '../src/rules.mjs';

const booking = { bookingId: 'BKG-SYN-204', confirmed: true, pickupUrgencyRank: 1, contractualPriorityRank: 2, containerType: '40RF', specialHandling: ['Temperature controlled'] };
const inventory = [{ id: 'INV-RF', type: '40RF', ready: 3, expectedReady: 2, availableAfterDays: 7, reserved: 0, condition: 'ready', capabilities: ['reefer'] }];
const plan = { id: 'PLAN-OK', inventoryId: 'INV-RF', affectedBookingIds: ['BKG-SYN-204'], type: '40RF', quantity: 4, singleOrigin: true, dimensionCompatible: true, weightCompatible: true, specialHandlingCompatible: true, vesselCapacityAvailable: true, depotStorageAvailable: true, availableDay: 7, syntheticTransitDays: 18, repositionCostScore: 48 };

test('P2 evaluates each locked synthetic allocation constraint, including cost, schedule, readiness, capacity, vessel, and depot space', () => {
  const eligible = evaluateAllocation(plan, booking, inventory, 7, 50);
  assert.equal(eligible.feasible, true);
  const invalid = evaluateAllocation({ ...plan, type: '20DV', dimensionCompatible: false, vesselCapacityAvailable: false, depotStorageAvailable: false, availableDay: 14, repositionCostScore: 51 }, booking, inventory, 7, 50);
  assert.equal(invalid.feasible, false);
  for (const constraint of ['equipmentType', 'cargoCompatibility', 'vesselCapacity', 'scheduleWithinHorizon', 'depotStorage', 'cost']) assert.ok(invalid.failed.includes(constraint));
});

test('P2 uses confirmed booking, pickup urgency, contractual priority, earliest availability, then cost without asserting a production weighting policy', () => {
  const laterBooking = { ...booking, bookingId: 'BKG-SYN-205', pickupUrgencyRank: 2, contractualPriorityRank: 1 };
  const urgent = { ...plan, id: 'URGENT', affectedBookingIds: [booking.bookingId], availableDay: 7, repositionCostScore: 48 };
  const lessUrgent = { ...plan, id: 'LESS-URGENT', affectedBookingIds: [laterBooking.bookingId], availableDay: 0, repositionCostScore: 1 };
  assert.equal(rankAllocationPlans([lessUrgent, urgent], [booking, laterBooking], inventory, 7, 50)[0].id, 'URGENT');
  const earlier = { ...plan, id: 'EARLIER', availableDay: 0, repositionCostScore: 49 };
  const lowerCost = { ...plan, id: 'LOWER-COST', availableDay: 0, repositionCostScore: 10 };
  assert.equal(rankAllocationPlans([earlier, lowerCost], [booking], inventory, 7, 50)[0].id, 'LOWER-COST');
});

test('P2 blocks an incompatible allocation at reservation and permits a compatible substitute only through normal approval reservation', () => {
  const incompatible = { ...plan, id: 'PLAN-BAD', type: '20DV' };
  assert.equal(canReserve(incompatible, inventory, 7, booking, 50), false);
  assert.throws(() => reservePlan(incompatible, inventory, 7, booking, 50), /Reservation blocked/);
  const substitute = { ...plan, id: 'PLAN-SUBSTITUTE', quantity: 2, substituteFor: 'Synthetic requested 40RF equipment' };
  assert.equal(canReserve(substitute, inventory, 7, booking, 50), true);
  assert.equal(reservePlan(substitute, inventory, 7, booking, 50)[0].reserved, 2);
});

test('P2 searches synthetic recommendation, approval, allocation, and execution history records', () => {
  const history = [
    { bookingId: 'BKG-SYN-204', planId: 'A', type: 'Recommendation', detail: 'Synthetic recommendation', outcome: 'Pending Approval' },
    { bookingId: 'BKG-SYN-204', planId: 'A', type: 'Approval decision', detail: 'Manager approval', outcome: 'Approved' },
    { bookingId: 'BKG-SYN-204', planId: 'A', type: 'Allocation', detail: 'Reservation created', outcome: 'Reserved' },
    { bookingId: 'BKG-SYN-204', planId: 'A', type: 'Execution outcome', detail: 'Execution status changed', outcome: 'Completed' }
  ];
  assert.equal(searchAllocationHistory(history, 'recommendation').length, 1);
  assert.equal(searchAllocationHistory(history, 'manager approval').length, 1);
  assert.equal(searchAllocationHistory(history, 'reservation').length, 1);
  assert.equal(searchAllocationHistory(history, 'completed').length, 1);
});

test('P3 retains structured custody transfers under one Booking ID without a Handoff ID', () => {
  const first = createCustodyEvent({ at: 'Synthetic event 20', sender: 'Synthetic origin handler', receiver: 'Synthetic receiving team', responsibleHandler: 'Synthetic handler', documents: ['Synthetic manifest'], validationOutcome: 'Validated' });
  const second = createCustodyEvent({ at: 'Synthetic event 21', sender: 'Synthetic receiving team', receiver: 'Synthetic onward receiving party', responsibleHandler: 'Synthetic handler', documents: ['Synthetic custody-transfer record'], validationOutcome: 'Transferred', discrepancy: 'Initial quantity mismatch', resolution: 'Evidence recorded' });
  assert.equal(first.handoffId, undefined);
  assert.equal(second.sender, 'Synthetic receiving team');
  assert.equal(second.receiver, 'Synthetic onward receiving party');
  assert.equal(second.responsibleHandler, 'Synthetic handler');
});

test('P3 final delivery summary includes repeated transfers, discrepancies, resolutions, documents, timestamps, and POD', () => {
  const events = [
    createCustodyEvent({ at: 'Synthetic event 20', sender: 'Synthetic origin handler', receiver: 'Synthetic receiving team', responsibleHandler: 'Synthetic handler', documents: ['Synthetic manifest'], validationOutcome: 'Validated', discrepancy: 'Quantity mismatch', resolution: 'Count reconciled' }),
    createCustodyEvent({ at: 'Synthetic event 21', sender: 'Synthetic receiving team', receiver: 'Synthetic onward receiving party', responsibleHandler: 'Synthetic handler', documents: ['Proof of delivery'], validationOutcome: 'Delivered', pod: 'Synthetic POD recorded' })
  ];
  const summary = deliverySummary({ bookingId: 'BKG-SYN-204', currentStatus: 'Delivered / Completed' }, events);
  assert.equal(summary.bookingId, 'BKG-SYN-204');
  assert.equal(summary.currentStatus, 'Delivered / Completed');
  assert.equal(summary.handoffCount, 2);
  assert.equal(summary.handoffs[0].resolution, 'Count reconciled');
  assert.equal(summary.handoffs[1].pod, 'Synthetic POD recorded');
  assert.deepEqual(summary.handoffs[1].documents, ['Proof of delivery']);
  assert.equal(JOURNEY_STATUSES.includes('Partial Delivery'), false);
});

test('P3 builds a receiving checklist, compares documents and quantities, and requires human evidence for physical validation and resolution', () => {
  const handoff = { expectedQuantity: 4, receivedQuantity: 3, outstandingQuantity: 1, physicalChecksRecorded: false, discrepancyResolved: false, documents: [{ name: 'Booking record', state: 'present' }, { name: 'Manifest', state: 'present' }, { name: 'Receiving record', state: 'conflicting' }, { name: 'Proof of delivery', state: 'missing' }] };
  const comparison = compareReceivingEvidence(handoff);
  assert.equal(comparison.quantityMismatch, true);
  assert.deepEqual(comparison.conflictingDocuments, ['Receiving record']);
  assert.deepEqual(comparison.missingDocuments, ['Proof of delivery']);
  assert.ok(buildReceivingChecklist(handoff).some(item => item.includes('mismatch requires human resolution')));
  assert.equal(recordPhysicalValidation(handoff).physicalChecksRecorded, true);
  assert.throws(() => resolveReceivingDiscrepancy(handoff, ''), /Recorded evidence is required/);
  const resolved = resolveReceivingDiscrepancy(handoff, 'Synthetic evidence note');
  assert.equal(resolved.receivedQuantity, 4);
  assert.equal(resolved.outstandingQuantity, 0);
  assert.equal(resolved.discrepancyResolved, true);
  assert.equal(resolved.documents.find(item => item.name === 'Receiving record').state, 'done');
});

test('P3 records POD as present only after receiving gates are satisfied and reconciles equal quantities', () => {
  const pending = { expectedQuantity: 2, receivedQuantity: 2, outstandingQuantity: 0, physicalChecksRecorded: true, discrepancyResolved: true, handlerApproved: true, podRecorded: false, deliveryConfirmed: false, documents: [{ name: 'Proof of delivery', state: 'missing' }] };
  assert.equal(compareReceivingEvidence(pending).quantityMismatch, false);
  assert.equal(canCompleteDelivery(pending), false);
  const completed = recordProofOfDelivery(pending);
  assert.equal(completed.documents[0].state, 'done');
  assert.equal(completed.podRecorded, true);
  assert.equal(completed.deliveryConfirmed, true);
  assert.equal(canCompleteDelivery(completed), true);
  assert.throws(() => recordProofOfDelivery({ ...pending, physicalChecksRecorded: false }), /POD cannot be recorded/);
});

test('P3 active workload excludes unarrived bookings while retaining receiving and completed journeys', () => {
  assert.equal(isReceivingEligible({ currentStatus: 'Equipment Allocation' }), false);
  assert.equal(isReceivingEligible({ currentStatus: 'Ocean Transit' }), false);
  assert.equal(isReceivingEligible({ currentStatus: 'Arrived at Receiving Location' }), true);
  assert.equal(isReceivingEligible({ currentStatus: 'Under Validation' }), true);
  assert.equal(isReceivingEligible({ currentStatus: 'Delivered / Completed' }), true);
});

test('P3 exposes completed approved allocations for Receiver arrival confirmation without auto-arriving cargo', () => {
  const awaiting = { bookingId: 'BKG-SYN-204', currentStatus: 'Equipment Allocation' };
  const completedApproved = [{ affectedBookingIds: ['BKG-SYN-204'], status: 'Approved', executionStatus: 'Completed' }];
  assert.equal(isAwaitingArrivalConfirmation(awaiting, completedApproved), true);
  assert.equal(isReceivingEligible(awaiting), false);
  assert.equal(isAwaitingArrivalConfirmation(awaiting, [{ ...completedApproved[0], executionStatus: 'In Progress' }]), false);
  assert.equal(isAwaitingArrivalConfirmation({ ...awaiting, currentStatus: 'Arrived at Receiving Location' }, completedApproved), false);
});

test('P3 records cumulative documented partial deliveries, blocks duplicates and keeps the booking eligible', () => {
  const handoff = { expectedQuantity: 10, receivedQuantity: 10, outstandingQuantity: 0, deliveredQuantity: 0, deliveryOutstandingQuantity: 10, physicalChecksRecorded: true, discrepancyResolved: true, handlerApproved: true, podRecorded: false, deliveryConfirmed: false, documents: [{ name: 'Proof of delivery', state: 'pending' }], partialDeliveryEvents: [] };
  const first = recordPartialDelivery(handoff, { quantity: 6, notes: 'Receiver recorded six containers with supporting evidence.', receiverConfirmed: true, receiver: 'Harper Receiver', at: 'Sample event 30' });
  assert.equal(first.deliveredQuantity, 6);
  assert.equal(deliveryOutstandingQuantity(first), 4);
  assert.throws(() => recordPartialDelivery(first, { quantity: 6, notes: 'Receiver recorded six containers with supporting evidence.', receiverConfirmed: true, receiver: 'Harper Receiver', at: 'Sample event 31' }), /already been recorded/);
  assert.throws(() => recordPartialDelivery(first, { quantity: 5, notes: 'Too many containers.', receiverConfirmed: true, receiver: 'Harper Receiver', at: 'Sample event 31' }), /cannot exceed/);
  const fullQuantityRecorded = recordPartialDelivery(first, { quantity: 4, notes: 'Receiver recorded the final four containers with supporting evidence.', receiverConfirmed: true, receiver: 'Harper Receiver', at: 'Sample event 32' });
  assert.equal(fullQuantityRecorded.deliveredQuantity, 10);
  assert.equal(deliveryOutstandingQuantity(fullQuantityRecorded), 0);
  assert.equal(canCompleteDelivery(fullQuantityRecorded), false);
  assert.equal(isReceivingEligible({ currentStatus: 'Partially Delivered' }), true);
});

test('P3 exposes document validation as Pending until the existing validation actions make it Done', () => {
  const handoff = { expectedQuantity: 2, receivedQuantity: 2, outstandingQuantity: 0, documents: [{ name: 'Booking record', state: 'pending' }, { name: 'Manifest', state: 'pending' }, { name: 'Receiving record', state: 'pending' }, { name: 'Proof of delivery', state: 'pending' }], physicalChecksRecorded: false, discrepancyResolved: false, handlerApproved: false, podRecorded: false, deliveryConfirmed: false, deliveredQuantity: 0, deliveryOutstandingQuantity: 0 };
  assert.equal(documentValidationLabel(handoff.documents[0]), 'Pending');
  const inspected = recordPhysicalValidation(handoff);
  assert.equal(documentValidationLabel(inspected.documents[0]), 'Done');
  const resolved = resolveReceivingDiscrepancy(inspected, 'Receiver recorded evidence that resolves the comparison.');
  assert.equal(documentValidationLabel(resolved.documents.find(item => item.name === 'Receiving record')), 'Done');
  const pod = recordProofOfDelivery({ ...resolved, handlerApproved: true });
  assert.equal(documentValidationLabel(pod.documents.find(item => item.name === 'Proof of delivery')), 'Done');
});
