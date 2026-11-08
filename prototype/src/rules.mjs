export const P1_FIELDS = [
  'Shipper and receiver', 'Pickup location', 'Delivery location', 'Cargo description', 'Cargo quantity',
  'Weight and dimensions', 'Ocean freight service', 'Cargo readiness', 'Delivery window', 'Special handling'
];
export const SUPPORTED_CONTAINER_TYPES = ['20DV', '40RF', '40HC', '45PW'];

export const P1_STATUSES = ['Pending', 'Picked Up', 'For Clarification', 'Ready for Submission', 'Submitted'];
export const P1_WORKFLOW_STAGES = ['Pending', 'Picked Up', 'For Clarification', 'Ready for Submission', 'Submitted', 'Equipment Allocation'];
export const JOURNEY_STATUSES = ['Equipment Allocation', 'Ready for Pickup', 'Cargo Collected', 'At Origin Port', 'Ocean Transit', 'Landed at Destination Port', 'Inland Transit', 'Arrived at Receiving Location', 'Under Validation', 'Handed Off', 'Partially Delivered', 'Delivered / Completed'];

export const P1_FIELD_INPUTS = {
  'Shipper and receiver': [['shipperCompany', 'Shipper company'], ['shipperContact', 'Shipper contact'], ['shipperEmail', 'Shipper email'], ['shipperPhone', 'Shipper phone'], ['shipperAddress', 'Shipper address'], ['shipperCountry', 'Shipper country'], ['consigneeCompany', 'Consignee company'], ['consigneeContact', 'Consignee contact'], ['consigneeEmail', 'Consignee email'], ['consigneePhone', 'Consignee phone'], ['consigneeAddress', 'Consignee address'], ['consigneeCountry', 'Consignee country']],
  'Pickup location': [['pickupAddress', 'Pickup address'], ['originPort', 'Origin port']],
  'Delivery location': [['deliveryAddress', 'Delivery address'], ['destinationPort', 'Destination port']],
  'Cargo description': [['commodity', 'Commodity and suitability']],
  'Cargo quantity': [['quantity', 'Packages, units, or containers']],
  'Weight and dimensions': [['grossWeight', 'Gross weight and unit'], ['dimensions', 'Length × width × height with units'], ['equipmentType', 'Container type'], ['containerQuantity', 'Container quantity']],
  'Ocean freight service': [['service', 'FCL/LCL and service scope']],
  'Cargo readiness': [['readinessDate', 'Pickup date / cargo readiness']],
  'Delivery window': [['deliveryWindow', 'Required delivery date or window']],
  'Special handling': [['handling', 'Special handling requirements']],
};
const P1_REQUIRED_SUBFIELDS = Object.fromEntries(Object.entries(P1_FIELD_INPUTS).map(([field, inputs]) => [field, inputs.map(([key]) => key)]));

const p1FieldLabel = (name) => name === 'Shipper and receiver' ? 'shipper and consignee details' : name.toLowerCase();
const present = (value) => value !== undefined && value !== null && String(value).trim() !== '';

export function shipmentRequirementErrors(subfields = {}) {
  const errors = [];
  const grossWeight = String(subfields.grossWeight || '').trim();
  const dimensions = String(subfields.dimensions || '').trim();
  const equipmentType = String(subfields.equipmentType || '').trim().toUpperCase();
  const containerQuantity = String(subfields.containerQuantity || '').trim();
  if (!/^\s*(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?\s*(?:kg|kgs|g|t|ton|tons|tonne|tonnes|lb|lbs)\b/i.test(grossWeight) || Number.parseFloat(grossWeight.replaceAll(',', '')) <= 0) errors.push('Gross weight must be a positive number with a unit (for example, 1 tonne or 1,000 kg).');
  const dimensionsWithUnits = [...dimensions.matchAll(/\d+(?:\.\d+)?\s*(?:mm|cm|m|ft|feet|in|inch|inches)\b/gi)];
  if (dimensionsWithUnits.length !== 3) errors.push('Dimensions must provide length, width, and height, each with a unit (for example, 1.00 m × 0.80 m × 0.60 m).');
  if (!SUPPORTED_CONTAINER_TYPES.includes(equipmentType)) errors.push(`Container type must be one of: ${SUPPORTED_CONTAINER_TYPES.join(', ')}.`);
  if (!/^\d+$/.test(containerQuantity) || Number(containerQuantity) <= 0) errors.push('Container quantity must be a positive whole number.');
  return errors;
}

export function extractP1Fields(sourceRecords = []) {
  return P1_FIELDS.map((name) => {
    const evidence = sourceRecords.flatMap((record) => record.facts?.[name] ? [{ ...record.facts[name], source: record.source, at: record.at, explanation: record.explanation || null, isClarification: record.isClarification === true }] : []);
    const activeEvidence = evidence.some((item) => item.isClarification) ? evidence.filter((item) => item.isClarification) : evidence;
    const values = [...new Set(activeEvidence.map((item) => item.value).filter(present))];
    const supplied = new Set(activeEvidence.flatMap((item) => Object.entries(item.subfields || {}).filter(([, value]) => present(value)).map(([key]) => key)));
    const missing = (P1_REQUIRED_SUBFIELDS[name] || []).filter((key) => !supplied.has(key));
    const implausible = activeEvidence.some((item) => item.implausible === true);
    const conflicting = values.length > 1;
    const resolvedSubfields = Object.assign({}, ...activeEvidence.map((item) => item.subfields || {}));
    const requirementErrors = name === 'Weight and dimensions' && !missing.length ? shipmentRequirementErrors(resolvedSubfields) : [];
    const state = evidence.length === 0 ? 'missing' : conflicting ? 'conflicting' : implausible ? 'implausible' : missing.length || requirementErrors.length ? 'partial' : 'validated';
    const provenance = evidence.map(({ source, at, value, explanation, isClarification }) => ({ source, at, value, explanation, isClarification }));
    const issue = conflicting ? `Conflicting recorded values: ${values.join(' | ')}` : implausible ? `Recorded ${p1FieldLabel(name)} requires human review.` : missing.length ? `Missing: ${missing.join(', ')}` : requirementErrors.length ? requirementErrors.join(' ') : null;
    const clarification = conflicting ? `Please confirm the correct ${p1FieldLabel(name)}. Recorded values are ${values.join(' and ')}.` : missing.length || requirementErrors.length ? `Please provide valid ${missing.length ? missing.join(', ') : p1FieldLabel(name)} information.` : null;
    const resolution = evidence.some((item) => item.isClarification) ? 'Recorded clarification evidence is the active basis for this field; original source history is retained below.' : null;
    return { name, state, value: values.join(' | ') || 'Not supplied in source records', evidence: provenance.map((item) => item.source).join(' · ') || 'No source evidence', provenance, subfields: resolvedSubfields, issue, clarification, resolution, corrections: conflicting ? [issue] : [] };
  });
}

export function appendP1Evidence(ticket, evidenceRecord) {
  return { ...ticket, sourceRecords: [...(ticket.sourceRecords || []), evidenceRecord] };
}

const P1_REVIEW_STATUSES = ['Pending', 'Clarification', 'Completed'];

export function canEditP1FieldReview(interaction, user) {
  return user?.role === 'Administrator' || (user?.role === 'Support' && interaction?.assignedTo === user.name);
}

export function reviewP1Field(ticket, { fieldName, notes = '', status = 'Pending', userName, at }) {
  if (!P1_FIELDS.includes(fieldName)) throw new Error('A review must reference a locked intake field.');
  if (!P1_REVIEW_STATUSES.includes(status)) throw new Error('Use Pending, Clarification, or Completed for field review.');
  const previousReview = ticket.fieldReviews?.[fieldName];
  const previousStatus = previousReview?.status || 'Pending';
  if (status !== previousStatus && !present(notes)) return { ticket, field: extractP1Fields(ticket.sourceRecords).find((entry) => entry.name === fieldName), noteRequired: true, blocked: false };
  const field = extractP1Fields(ticket.sourceRecords).find((entry) => entry.name === fieldName);
  const blocked = status === 'Completed' && field.state !== 'validated';
  const resolvedStatus = blocked ? 'Clarification' : status;
  const reviewEvent = { status: resolvedStatus, notes: String(notes).trim(), actor: userName, at };
  return {
    ticket: {
      ...ticket,
      fieldReviews: {
        ...(ticket.fieldReviews || {}),
        [fieldName]: { ...reviewEvent, history: [...(previousReview?.history || []), reviewEvent] },
      },
    },
    field,
    blocked, noteRequired: false,
  };
}

export function recordCustomerClarification(ticket, { fieldName, correctedInformation, customerClarification, subfields = {}, source, at }) {
  if (!P1_FIELDS.includes(fieldName)) throw new Error('A customer clarification must reference a locked intake field.');
  if (!present(correctedInformation) || !present(customerClarification)) throw new Error('Corrected information and customer clarification text are required.');
  const evidence = {
    source: source || 'Customer clarification', at,
    explanation: String(customerClarification).trim(), isClarification: true,
    facts: { [fieldName]: { value: String(correctedInformation).trim(), subfields } },
  };
  return appendP1Evidence(ticket, evidence);
}

export function allFieldsValidated(fields) {
  return P1_FIELDS.every((name) => fields.some((field) => field.name === name && field.state === 'validated'));
}

export function canCreateRequest(interaction) {
  return interaction.status !== 'Submitted' && allFieldsValidated(interaction.fields);
}

export function bookingFromSubmittedRequest(request) {
  const fields = extractP1Fields(request.sourceRecords);
  if (!allFieldsValidated(fields)) throw new Error('Booking cannot be created until all mandatory shipment requirements are valid.');
  const value = (name) => fields.find((field) => field.name === name)?.value || 'Not supplied in source records';
  const weightField = fields.find((field) => field.name === 'Weight and dimensions');
  const equipment = String(weightField?.subfields?.equipmentType || '').trim().toUpperCase();
  const quantity = Number(weightField?.subfields?.containerQuantity);
  if (!SUPPORTED_CONTAINER_TYPES.includes(equipment) || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Booking cannot be created with unknown equipment or an invalid container quantity.');
  const quantityText = value('Cargo quantity');
  const handling = value('Special handling');
  const isNonHazardous = /\bnon[-\s]?hazardous\b/i.test(handling);
  return {
    bookingId: bookingIdFor(request.requestId), requestId: request.requestId, confirmed: true,
    customer: request.customer, shipper: request.shipper, consignee: request.consignee,
    cargo: value('Cargo description'), cargoQuantity: quantityText, grossWeight: value('Weight and dimensions'), containerType: equipment, quantity,
    pickupRequirement: value('Cargo readiness'), deliveryRequirement: value('Delivery window'),
    specialHandling: /temperature/i.test(handling) ? ['Temperature controlled'] : /hazard/i.test(handling) && !isNonHazardous ? ['Hazardous'] : [],
    customerPriority: 'TBD — no contractual priority supplied', pickupUrgency: value('Cargo readiness'), pickupUrgencyRank: 1, contractualPriorityRank: 1,
    destination: value('Delivery location'), currentStatus: 'Equipment Allocation',
    history: [{ at: 'Sample event', status: 'Equipment Allocation', note: 'Booking created automatically when Support submitted the validated request' }, { at: 'Sample event', status: 'Submitted', note: 'Support submitted the validated request' }],
  };
}

export function isAllocatableBooking(booking) {
  return SUPPORTED_CONTAINER_TYPES.includes(booking?.containerType) && Number.isInteger(booking?.quantity) && booking.quantity > 0;
}

export function canSelfAssignP1(interaction, user) {
  return user?.role === 'Support' && interaction?.status === 'Pending' && !interaction?.assignedTo;
}

export function selfAssignP1(interaction, user) {
  if (!canSelfAssignP1(interaction, user)) throw new Error('Self-assignment is available only to Support for an unassigned Pending shipment request.');
  return { ...interaction, status: 'Picked Up', assignedTo: user.name };
}

export function updateCustomerContact(interaction, updates) {
  const contact = interaction.customerContact || { company: interaction.customer, email: '', phone: '' };
  const next = { ...contact, company: String(updates.company ?? contact.company).trim() };
  if (interaction.channel === 'Email') {
    next.email = contact.email;
    next.phone = String(updates.phone ?? contact.phone).trim();
  } else {
    next.phone = contact.phone;
    next.email = String(updates.email ?? contact.email).trim();
  }
  return { ...interaction, customer: next.company || interaction.customer, customerContact: next };
}

export function returnRequestToClarification(interaction) {
  if (interaction.status !== 'Ready for Submission') throw new Error('Only a Ready for Submission request can be returned to clarification.');
  return { ...interaction, status: 'For Clarification' };
}

export function p1WorkflowStageFor(interaction) {
  if (interaction.bookingId) return 'Equipment Allocation';
  return P1_WORKFLOW_STAGES.includes(interaction.status) ? interaction.status : 'Pending';
}

export function requestIdFor(firstContactReference) {
  return String(firstContactReference).startsWith('REQ-') ? firstContactReference : `REQ-${String(firstContactReference).replace('INT-', '')}`;
}

export function bookingIdFor(requestId) {
  return `BKG-${requestId.replace('REQ-', '')}`;
}


export function compatible(booking, inventory) {
  if (booking.containerType !== inventory.type) return false;
  if (booking.specialHandling.includes('Temperature controlled') && !inventory.capabilities.includes('reefer')) return false;
  if (booking.specialHandling.includes('Hazardous') && !inventory.capabilities.includes('hazmat')) return false;
  return inventory.condition === 'ready' || inventory.condition === 'expected-ready';
}

export function evaluateAllocation(plan, booking, inventory, horizon, costLimit) {
  const source = inventory.find((item) => item.id === plan.inventoryId);
  const checks = {
    confirmedBooking: Boolean(booking?.confirmed),
    singleOrigin: plan.singleOrigin === true,
    inventorySource: Boolean(source),
    equipmentType: Boolean(source) && plan.type === booking?.containerType && compatible(booking, source),
    cargoCompatibility: plan.dimensionCompatible !== false && plan.weightCompatible !== false && plan.specialHandlingCompatible !== false,
    condition: source?.condition === 'ready' || source?.condition === 'expected-ready',
    capacity: Boolean(source) && capacityFor(source, horizon) >= plan.quantity,
    vesselCapacity: plan.vesselCapacityAvailable === true,
    scheduleWithinHorizon: Number(plan.availableDay) <= horizon,
    transit: Number.isFinite(plan.syntheticTransitDays),
    depotStorage: plan.depotStorageAvailable === true,
    cost: Number(plan.repositionCostScore ?? plan.syntheticCostScore) <= costLimit,
  };
  const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  return {
    checks,
    failed,
    feasible: failed.length === 0,
    costLimitExceeded: Number(plan.repositionCostScore ?? plan.syntheticCostScore) > costLimit,
    capacity: source ? capacityFor(source, horizon) : 0,
  };
}

export function rankAllocationPlans(plans, bookings, inventory, horizon, costLimit) {
  const bookingById = new Map(bookings.map((booking) => [booking.bookingId, booking]));
  return plans.map((plan) => {
    const booking = bookingById.get(plan.affectedBookingIds[0]);
    return { ...plan, evaluation: evaluateAllocation(plan, booking, inventory, horizon, costLimit), demand: booking };
  }).sort((a, b) => {
    if (a.evaluation.feasible !== b.evaluation.feasible) return a.evaluation.feasible ? -1 : 1;
    if (a.demand.confirmed !== b.demand.confirmed) return a.demand.confirmed ? -1 : 1;
    if (a.demand.pickupUrgencyRank !== b.demand.pickupUrgencyRank) return a.demand.pickupUrgencyRank - b.demand.pickupUrgencyRank;
    if (a.demand.contractualPriorityRank !== b.demand.contractualPriorityRank) return a.demand.contractualPriorityRank - b.demand.contractualPriorityRank;
    if (a.availableDay !== b.availableDay) return a.availableDay - b.availableDay;
    return (a.repositionCostScore ?? a.syntheticCostScore) - (b.repositionCostScore ?? b.syntheticCostScore);
  });
}

export function capacityFor(inventory, horizon) {
  return inventory.ready + (horizon >= inventory.availableAfterDays ? inventory.expectedReady : 0) - inventory.reserved;
}

export function canReserve(plan, inventory, horizon, booking, costLimit = Infinity) {
  const source = inventory.find((item) => item.id === plan.inventoryId);
  if (!booking) return Boolean(source) && plan.quantity > 0 && capacityFor(source, horizon) >= plan.quantity && plan.singleOrigin === true;
  return evaluateAllocation(plan, booking, inventory, horizon, costLimit).feasible;
}

export function reservePlan(plan, inventory, horizon, booking, costLimit = Infinity) {
  if (!canReserve(plan, inventory, horizon, booking, costLimit)) throw new Error('Reservation blocked: allocation is not feasible against the locked synthetic constraints.');
  return inventory.map((item) => item.id === plan.inventoryId ? { ...item, reserved: item.reserved + plan.quantity } : item);
}

export function planFlags(plan, costLimit) {
  const flags = [];
  if (plan.syntheticCostScore > costLimit) flags.push('Above configured synthetic cost limit');
  if (plan.remainingShortage > 0) flags.push(`Remaining shortage: ${plan.remainingShortage}`);
  if (!plan.compatible) flags.push('Compatibility review required');
  return flags;
}

export function canCompleteHandoff(handoff) {
  return handoff.discrepancyResolved && handoff.physicalChecksRecorded && handoff.handlerApproved;
}

export function canApproveHandoff(handoff) {
  return handoff.discrepancyResolved && handoff.physicalChecksRecorded && !handoff.handlerApproved;
}

export function canCompleteDelivery(handoff) {
  return canCompleteHandoff(handoff) && handoff.podRecorded && handoff.deliveryConfirmed && deliveryOutstandingQuantity(handoff) === 0;
}

export function isReceivingEligible(booking) {
  return ['Arrived at Receiving Location', 'Under Validation', 'Handed Off', 'Partially Delivered', 'Delivered / Completed'].includes(booking?.currentStatus);
}

export function isAwaitingArrivalConfirmation(booking, plans) {
  return booking?.currentStatus === 'Equipment Allocation' && plans.some((plan) => plan.affectedBookingIds?.includes(booking.bookingId) && plan.status === 'Approved' && plan.executionStatus === 'Completed');
}

export function recordProofOfDelivery(handoff) {
  if (!canCompleteHandoff(handoff) || deliveryOutstandingQuantity(handoff) !== 0) throw new Error('POD cannot be recorded until receiving validation, discrepancy resolution, Receiver approval, and all delivery quantities are complete.');
  return { ...handoff, podRecorded: true, deliveryConfirmed: true, documents: handoff.documents.map((document) => document.name === 'Proof of delivery' ? { ...document, state: 'done' } : document) };
}

export function deliveryOutstandingQuantity(handoff) {
  return handoff.deliveryOutstandingQuantity ?? (handoff.deliveredQuantity === undefined ? handoff.outstandingQuantity : Math.max(0, handoff.expectedQuantity - handoff.deliveredQuantity));
}

export function recordPartialDelivery(handoff, { quantity, notes, receiverConfirmed, receiver, at }) {
  const deliveredNow = Number(quantity);
  const trimmedNotes = String(notes || '').trim();
  const remaining = deliveryOutstandingQuantity(handoff);
  if (!Number.isFinite(deliveredNow) || deliveredNow <= 0) throw new Error('Enter a positive quantity being delivered now.');
  if (!receiverConfirmed) throw new Error('Receiver confirmation is required to record a partial delivery.');
  if (!trimmedNotes) throw new Error('Receiver notes or supporting evidence are required.');
  if ((handoff.partialDeliveryEvents || []).some((event) => event.quantity === deliveredNow && event.notes === trimmedNotes)) throw new Error('This partial delivery evidence has already been recorded.');
  if (deliveredNow > remaining) throw new Error('Delivery quantity cannot exceed the remaining quantity.');
  const deliveredQuantity = (handoff.deliveredQuantity || 0) + deliveredNow;
  const event = { quantity: deliveredNow, notes: trimmedNotes, receiver, at };
  return { ...handoff, deliveredQuantity, deliveryOutstandingQuantity: Math.max(0, handoff.expectedQuantity - deliveredQuantity), partialDeliveryEvents: [...(handoff.partialDeliveryEvents || []), event] };
}

export function documentValidationLabel(document) {
  return document?.state === 'done' ? 'Done' : 'Pending';
}

export function compareReceivingEvidence(handoff) {
  const conflictingDocuments = handoff.documents.filter((document) => document.state === 'conflicting').map((document) => document.name);
  const pendingDocuments = handoff.documents.filter((document) => document.state !== 'done').map((document) => document.name);
  const missingDocuments = handoff.documents.filter((document) => document.state === 'missing').map((document) => document.name);
  return {
    expectedQuantity: handoff.expectedQuantity,
    receivedQuantity: handoff.receivedQuantity,
    outstandingQuantity: handoff.outstandingQuantity,
    quantityMismatch: handoff.expectedQuantity !== handoff.receivedQuantity,
    conflictingDocuments,
    pendingDocuments,
    missingDocuments,
  };
}

export function buildReceivingChecklist(handoff) {
  const comparison = compareReceivingEvidence(handoff);
  return [
    `Booking and manifest evidence: ${comparison.pendingDocuments.includes('Booking record') || comparison.pendingDocuments.includes('Manifest') ? 'pending review' : 'done'}`,
    `Expected versus recorded quantity: ${comparison.quantityMismatch ? 'mismatch requires human resolution' : 'reconciled'}`,
    `Document comparison: ${[...comparison.conflictingDocuments, ...comparison.pendingDocuments].join(', ') || 'all required validation is done'}`,
    `POD gate: ${comparison.pendingDocuments.includes('Proof of delivery') ? 'POD pending before delivery completion' : 'POD done'}`,
  ];
}

export function recordPhysicalValidation(handoff) {
  return { ...handoff, physicalChecksRecorded: true, documents: handoff.documents.map((document) => ['Booking record', 'Manifest'].includes(document.name) ? { ...document, state: 'done' } : document) };
}

export function resolveReceivingDiscrepancy(handoff, note) {
  if (!note?.trim()) throw new Error('Recorded evidence is required to resolve a discrepancy.');
  return { ...handoff, receivedQuantity: handoff.expectedQuantity, outstandingQuantity: 0, discrepancyResolved: true, documents: handoff.documents.map((document) => document.name === 'Receiving record' ? { ...document, state: 'done' } : document) };
}

export function createCustodyEvent({ sender, receiver, responsibleHandler, documents = [], validationOutcome, discrepancy = null, resolution = null, pod = null, at }) {
  return { sender, receiver, responsibleHandler, documents, validationOutcome, discrepancy, resolution, pod, at };
}

export function deliverySummary(booking, handoffs) {
  return {
    bookingId: booking.bookingId,
    currentStatus: booking.currentStatus,
    handoffCount: handoffs.length,
    handoffs: handoffs.map(({ sender, receiver, responsibleHandler, documents, validationOutcome, discrepancy, resolution, pod, at }) => ({ sender, receiver, responsibleHandler, documents, validationOutcome, discrepancy, resolution, pod, at })),
  };
}

export function searchAllocationHistory(entries, query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((entry) => [entry.bookingId, entry.planId, entry.type, entry.detail, entry.outcome].join(' ').toLowerCase().includes(needle));
}
