import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoBaseline, initialInteractions } from '../src/demoData.js';
import { canSelfAssignP1, extractP1Fields, returnRequestToClarification, selfAssignP1, updateCustomerContact } from '../src/rules.mjs';

test('P1 ticket list seeds three distinct shipment requests with locked source and assignment states', () => {
  const [ticketA, ticketB, ticketC] = initialInteractions;
  assert.equal(initialInteractions.length, 3);
  assert.deepEqual(initialInteractions.map(ticket => ticket.requestId), ['REQ-SYN-001', 'REQ-SYN-002', 'REQ-SYN-003']);
  assert.equal(ticketA.channel, 'Email');
  assert.equal(ticketB.channel, 'Email');
  assert.equal(ticketC.channel, 'Phone');
  assert.equal(ticketA.status, 'Pending');
  assert.equal(ticketB.status, 'Pending');
  assert.equal(ticketA.assignedTo, null);
  assert.equal(ticketB.assignedTo, null);
  assert.equal(ticketC.status, 'Picked Up');
  assert.equal(ticketC.assignedTo, 'Sam Support');
  assert.equal(ticketA.interactionId, undefined);
  assert.equal(ticketA.requestId, 'REQ-SYN-001');
  assert.equal(ticketB.requestId, 'REQ-SYN-002');
  assert.equal(ticketC.requestId, 'REQ-SYN-003');
  assert.notEqual(ticketA.customer, ticketB.customer);
  assert.notEqual(ticketB.customer, ticketC.customer);
  assert.notDeepEqual(ticketA.conversation, ticketB.conversation);
  assert.notDeepEqual(ticketB.conversation, ticketC.conversation);
  assert.ok(extractP1Fields(ticketA.sourceRecords).some(field => field.state === 'conflicting'));
  assert.ok(extractP1Fields(ticketB.sourceRecords).some(field => field.state === 'missing'));
  assert.ok(extractP1Fields(ticketC.sourceRecords).every(field => field.state === 'validated'));
  for (const ticket of initialInteractions) {
    assert.equal(extractP1Fields(ticket.sourceRecords).length, 10);
    assert.ok(ticket.documents.length > 0);
    assert.ok(ticket.lastUpdated);
  }
});

test('P1 lets only Support self-assign an unassigned Pending request and preserves the locked lifecycle', () => {
  const [ticketA, , ticketC] = initialInteractions;
  const support = { role: 'Support', name: 'Sam Support' };
  assert.equal(canSelfAssignP1(ticketA, support), true);
  assert.equal(canSelfAssignP1(ticketA, { role: 'Administrator', name: 'Alex Admin' }), false);
  assert.equal(canSelfAssignP1(ticketC, support), false);
  const assigned = selfAssignP1(ticketA, support);
  assert.equal(assigned.assignedTo, 'Sam Support');
  assert.equal(assigned.status, 'Picked Up');
  assert.equal(ticketA.assignedTo, null);
  assert.equal(ticketA.status, 'Pending');
});

test('P1 preserves source contact evidence while applying channel-specific customer contact updates', () => {
  const [emailTicket, , phoneTicket] = initialInteractions;
  const updatedEmail = updateCustomerContact(emailTicket, { company: 'Updated Food Exporter', email: 'ignored@example.invalid', phone: '+65 5555 0101' });
  assert.equal(updatedEmail.customer, 'Updated Food Exporter');
  assert.equal(updatedEmail.customerContact.email, emailTicket.customerContact.email);
  assert.equal(updatedEmail.customerContact.phone, '+65 5555 0101');
  assert.deepEqual(updatedEmail.conversation, emailTicket.conversation);
  const updatedPhone = updateCustomerContact(phoneTicket, { company: 'Updated Machinery Exporter', email: 'dispatch@machinery.example.invalid', phone: 'ignored' });
  assert.equal(updatedPhone.customer, 'Updated Machinery Exporter');
  assert.equal(updatedPhone.customerContact.email, 'dispatch@machinery.example.invalid');
  assert.equal(updatedPhone.customerContact.phone, phoneTicket.customerContact.phone);
  assert.deepEqual(updatedPhone.conversation, phoneTicket.conversation);
});

test('P1 returns a Ready for Submission request to clarification without changing its Request ID', () => {
  const ready = { ...initialInteractions[2], status: 'Ready for Submission' };
  const returned = returnRequestToClarification(ready);
  assert.equal(returned.status, 'For Clarification');
  assert.equal(returned.requestId, ready.requestId);
  assert.throws(() => returnRequestToClarification(initialInteractions[2]), /Only a Ready for Submission/);
});

test('Demo reset baseline is repeatable and restores original requests, inventory, and empty downstream state', () => {
  const first = createDemoBaseline();
  first.interactions[0].status = 'Submitted';
  first.bookings.push({ bookingId: 'BKG-SYN-001' });
  first.inventory[0].reserved = 2;
  first.plans.push({ status: 'Approved' });
  first.handoffs['BKG-SYN-001'] = { podRecorded: true };
  const second = createDemoBaseline();
  assert.deepEqual(second.interactions.map(ticket => ({ requestId: ticket.requestId, status: ticket.status, bookingId: ticket.bookingId, assignedTo: ticket.assignedTo })), [
    { requestId: 'REQ-SYN-001', status: 'Pending', bookingId: null, assignedTo: null },
    { requestId: 'REQ-SYN-002', status: 'Pending', bookingId: null, assignedTo: null },
    { requestId: 'REQ-SYN-003', status: 'Picked Up', bookingId: null, assignedTo: 'Sam Support' }
  ]);
  assert.equal(second.bookings.length, 0);
  assert.equal(second.plans.length, 0);
  assert.equal(second.allocationHistory.length, 0);
  assert.deepEqual(second.handoffs, {});
  assert.ok(second.inventory.every(item => item.reserved === 0));
  assert.equal(second.interactions[0].sourceRecords[1].facts['Weight and dimensions'].subfields.grossWeight, '40 tonnes total');
  assert.ok(second.interactions[1].sourceRecords.every(record => !record.facts['Weight and dimensions']));
});
