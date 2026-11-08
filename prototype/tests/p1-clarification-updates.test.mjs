import test from 'node:test';
import assert from 'node:assert/strict';
import { initialInteractions } from '../src/demoData.js';
import { allFieldsValidated, appendP1Evidence, bookingFromSubmittedRequest, canCreateRequest, canEditP1FieldReview, extractP1Fields, recordCustomerClarification, reviewP1Field, shipmentRequirementErrors } from '../src/rules.mjs';

const field = (ticket, name) => extractP1Fields(ticket.sourceRecords).find((entry) => entry.name === name);
const clarification = (name, value, subfields) => ({
  source: 'Synthetic customer clarification record',
  at: 'Synthetic event correction',
  explanation: `Customer-supplied clarification for ${name}`,
  isClarification: true,
  facts: { [name]: { value, subfields } },
});

test('Ticket A retains original conflicting weight evidence and recalculates from complete clarification evidence', () => {
  const original = initialInteractions[0];
  const updated = appendP1Evidence(original, clarification('Weight and dimensions', '30 tonnes total; 12.19 m × 2.44 m × 2.59 m; 2 x 40RF', {
    grossWeight: '30 tonnes total', dimensions: '12.19 m × 2.44 m × 2.59 m', equipmentType: '40RF', containerQuantity: '2',
  }));
  assert.equal(field(original, 'Weight and dimensions').state, 'conflicting');
  assert.equal(field(updated, 'Weight and dimensions').state, 'validated');
  assert.equal(field(updated, 'Weight and dimensions').provenance.length, 3);
  assert.equal(original.sourceRecords.length, 2);
});

test('P1 Ticket A customer clarification resolves only the weight conflict and preserves earlier evidence', () => {
  const ticket = initialInteractions[0];
  const template = ticket.customerClarificationTemplates['Weight and dimensions'];
  assert.equal(field(ticket, 'Weight and dimensions').state, 'conflicting');
  const clarified = recordCustomerClarification(ticket, { fieldName: 'Weight and dimensions', ...template, at: 'Synthetic customer reply event' });
  const weight = field(clarified, 'Weight and dimensions');
  assert.equal(weight.state, 'validated');
  assert.equal(weight.provenance.length, 3);
  assert.equal(weight.provenance[0].source, 'Customer Email');
  assert.equal(weight.provenance[1].source, 'Packing List');
  assert.equal(weight.provenance[2].source, 'Customer Clarification Email');
  assert.equal(field(clarified, 'Cargo description').value, field(ticket, 'Cargo description').value);
  const completed = reviewP1Field(clarified, { fieldName: 'Weight and dimensions', status: 'Completed', notes: 'Support reviewed the recorded customer clarification.', userName: 'Sam Support', at: 'Synthetic review 00' });
  assert.equal(completed.blocked, false);
  assert.equal(completed.ticket.fieldReviews['Weight and dimensions'].status, 'Completed');
});

test('Ticket B remains blocked until each missing category has complete recorded clarification evidence', () => {
  const original = initialInteractions[1];
  const withWeight = appendP1Evidence(original, clarification('Weight and dimensions', '18 tonnes gross; 1.00 m × 0.80 m × 0.60 m; 1 x 20DV', {
    grossWeight: '18 tonnes gross', dimensions: '1.00 m × 0.80 m × 0.60 m', equipmentType: '20DV', containerQuantity: '1',
  }));
  assert.equal(canCreateRequest({ ...withWeight, fields: extractP1Fields(withWeight.sourceRecords) }), false);
  const complete = appendP1Evidence(withWeight, clarification('Delivery window', 'Customer-stated delivery window', {
    deliveryWindow: 'Customer-stated delivery window',
  }));
  const fields = extractP1Fields(complete.sourceRecords);
  assert.equal(allFieldsValidated(fields), true);
  assert.equal(canCreateRequest({ ...complete, fields }), true);
});

test('Ticket B structured customer clarifications complete only their selected missing fields with Support notes', () => {
  const ticket = initialInteractions[1];
  const weightTemplate = ticket.customerClarificationTemplates['Weight and dimensions'];
  const weightClarified = recordCustomerClarification(ticket, { fieldName: 'Weight and dimensions', ...weightTemplate, at: 'Customer reply for weight' });
  const completedWeight = reviewP1Field(weightClarified, { fieldName: 'Weight and dimensions', status: 'Completed', notes: 'Support validated the customer-provided weight, dimensions, units, and container type.', userName: 'Sam Support', at: 'Support review for weight' });
  assert.equal(field(completedWeight.ticket, 'Weight and dimensions').state, 'validated');
  assert.equal(completedWeight.ticket.fieldReviews['Weight and dimensions'].status, 'Completed');
  assert.equal(field(completedWeight.ticket, 'Delivery window').state, 'missing');
  const deliveryTemplate = ticket.customerClarificationTemplates['Delivery window'];
  const deliveryClarified = recordCustomerClarification(completedWeight.ticket, { fieldName: 'Delivery window', ...deliveryTemplate, at: 'Customer reply for delivery' });
  const completedDelivery = reviewP1Field(deliveryClarified, { fieldName: 'Delivery window', status: 'Completed', notes: 'Support validated the customer-provided delivery window.', userName: 'Sam Support', at: 'Support review for delivery' });
  assert.equal(field(completedDelivery.ticket, 'Delivery window').state, 'validated');
  assert.equal(completedDelivery.ticket.fieldReviews['Delivery window'].status, 'Completed');
  assert.equal(ticket.sourceRecords.length, 2);
  assert.equal(completedDelivery.ticket.sourceRecords.length, 4);
  assert.equal(allFieldsValidated(extractP1Fields(completedDelivery.ticket.sourceRecords)), true);
});

test('P1 rejects invalid weight, dimensions, equipment, and container quantity before review or booking creation', () => {
  const ticket = initialInteractions[1];
  const invalid = recordCustomerClarification(ticket, {
    fieldName: 'Weight and dimensions', correctedInformation: 'Gross weight 1 ton; dimensions 30 feet; container type steel; quantity 0.', customerClarification: 'Customer supplied the recorded values.', source: 'Customer clarification', at: 'Customer reply invalid',
    subfields: { grossWeight: '1 ton', dimensions: '30 feet', equipmentType: 'steel', containerQuantity: '0' },
  });
  const weight = field(invalid, 'Weight and dimensions');
  assert.equal(weight.state, 'partial');
  assert.match(weight.issue, /Dimensions must provide length, width, and height/);
  assert.match(weight.issue, /Container type must be one of/);
  assert.match(weight.issue, /Container quantity must be a positive whole number/);
  const review = reviewP1Field(invalid, { fieldName: 'Weight and dimensions', status: 'Completed', notes: 'Support recorded the invalid customer-provided information.', userName: 'Sam Support', at: 'Support invalid review' });
  assert.equal(review.blocked, true);
  assert.throws(() => bookingFromSubmittedRequest(review.ticket), /all mandatory shipment requirements are valid/);
  assert.equal(shipmentRequirementErrors(weight.subfields).length, 3);
});

test('P1 creates an allocatable booking only from Ticket B valid customer clarifications', () => {
  const ticket = initialInteractions[1];
  const weight = recordCustomerClarification(ticket, { fieldName: 'Weight and dimensions', ...ticket.customerClarificationTemplates['Weight and dimensions'], at: 'Customer reply weight' });
  const delivery = recordCustomerClarification(weight, { fieldName: 'Delivery window', ...ticket.customerClarificationTemplates['Delivery window'], at: 'Customer reply delivery' });
  const booking = bookingFromSubmittedRequest(delivery);
  assert.equal(booking.containerType, '20DV');
  assert.equal(booking.quantity, 1);
  assert.notEqual(booking.containerType, 'TBD');
});

test('Ticket C does not allow an incomplete clarification to bypass mandatory validation', () => {
  const original = initialInteractions[2];
  assert.equal(allFieldsValidated(extractP1Fields(original.sourceRecords)), true);
  const updated = appendP1Evidence(original, clarification('Cargo quantity', 'Six crates confirmed', {}));
  const quantity = field(updated, 'Cargo quantity');
  assert.equal(quantity.state, 'partial');
  assert.match(quantity.issue, /Missing: quantity/);
  assert.equal(canCreateRequest({ ...updated, fields: extractP1Fields(updated.sourceRecords) }), false);
});

test('P1 saves independent Support notes and permits Pending to Clarification to Completed on a valid field', () => {
  const ticket = initialInteractions[2];
  const clarification = reviewP1Field(ticket, {
    fieldName: 'Cargo description', notes: 'Support is checking commodity wording with the recorded call.', status: 'Clarification', userName: 'Sam Support', at: 'Synthetic review 01',
  });
  assert.equal(clarification.ticket.fieldReviews['Cargo description'].status, 'Clarification');
  assert.equal(clarification.ticket.fieldReviews['Cargo description'].notes, 'Support is checking commodity wording with the recorded call.');
  assert.equal(clarification.ticket.fieldReviews['Weight and dimensions'], undefined);
  const completed = reviewP1Field(clarification.ticket, {
    fieldName: 'Cargo description', notes: 'Support confirmed the recorded description.', status: 'Completed', userName: 'Sam Support', at: 'Synthetic review 02',
  });
  assert.equal(completed.ticket.fieldReviews['Cargo description'].status, 'Completed');
  assert.equal(completed.ticket.sourceRecords.length, ticket.sourceRecords.length);
});

test('P1 blocks manual Completed status for unresolved evidence while retaining notes and original provenance', () => {
  const ticket = initialInteractions[0];
  const result = reviewP1Field(ticket, {
    fieldName: 'Weight and dimensions', notes: 'Support needs the customer to reconcile the two recorded weights.', status: 'Completed', userName: 'Sam Support', at: 'Synthetic review 03',
  });
  assert.equal(result.blocked, true);
  assert.equal(result.ticket.fieldReviews['Weight and dimensions'].status, 'Clarification');
  assert.match(result.ticket.fieldReviews['Weight and dimensions'].notes, /reconcile/);
  assert.equal(field(result.ticket, 'Weight and dimensions').provenance.length, 2);
});

test('P1 keeps freeform Support notes separate from evidence and does not fabricate corrections', () => {
  const ticket = initialInteractions[1];
  const result = reviewP1Field(ticket, {
    fieldName: 'Weight and dimensions',
    notes: 'Customer has been asked to supply weight, dimensions, and equipment type.',
    status: 'Clarification', userName: 'Sam Support', at: 'Synthetic review 04',
  });
  assert.equal(result.ticket.fieldReviews['Weight and dimensions'].status, 'Clarification');
  assert.equal(result.ticket.fieldReviews['Weight and dimensions'].notes, 'Customer has been asked to supply weight, dimensions, and equipment type.');
  assert.equal(result.ticket.sourceRecords.length, ticket.sourceRecords.length);
  assert.equal(field(result.ticket, 'Weight and dimensions').state, 'missing');
  assert.equal(field(result.ticket, 'Delivery window').state, 'missing');
});

test('P1 blocks a review status change without Support notes and retains review history after saved changes', () => {
  const ticket = initialInteractions[2];
  const missingNotes = reviewP1Field(ticket, {
    fieldName: 'Cargo description', notes: '', status: 'Completed', userName: 'Sam Support', at: 'Synthetic review 05',
  });
  assert.equal(missingNotes.noteRequired, true);
  assert.equal(missingNotes.ticket.fieldReviews, undefined);
  const first = reviewP1Field(ticket, {
    fieldName: 'Cargo description', notes: 'Support needs to verify the description wording.', status: 'Clarification', userName: 'Sam Support', at: 'Synthetic review 06',
  });
  const second = reviewP1Field(first.ticket, {
    fieldName: 'Cargo description', notes: 'Support validated the recorded description.', status: 'Completed', userName: 'Sam Support', at: 'Synthetic review 07',
  });
  assert.equal(second.ticket.fieldReviews['Cargo description'].history.length, 2);
  assert.equal(second.ticket.fieldReviews['Cargo description'].history[0].status, 'Clarification');
  assert.equal(second.ticket.fieldReviews['Cargo description'].history[1].status, 'Completed');
  const unchanged = reviewP1Field(second.ticket, {
    fieldName: 'Cargo description', notes: '', status: 'Completed', userName: 'Sam Support', at: 'Synthetic review 08',
  });
  assert.equal(unchanged.noteRequired, false);
  assert.equal(unchanged.ticket.fieldReviews['Cargo description'].history.length, 3);
});

test('P1 field-review edits are limited to the assigned Support employee or Administrator', () => {
  const [unassigned, , assigned] = initialInteractions;
  assert.equal(canEditP1FieldReview(unassigned, { role: 'Support', name: 'Sam Support' }), false);
  assert.equal(canEditP1FieldReview(assigned, { role: 'Support', name: 'Sam Support' }), true);
  assert.equal(canEditP1FieldReview(assigned, { role: 'Support', name: 'Other Support' }), false);
  assert.equal(canEditP1FieldReview(unassigned, { role: 'Administrator', name: 'Alex Admin' }), true);
  assert.equal(canEditP1FieldReview(assigned, { role: 'Operations', name: 'Owen Operations' }), false);
});
