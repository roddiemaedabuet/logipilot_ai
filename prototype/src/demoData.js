export const accounts = [
  { id: 'admin', name: 'Alex Admin', role: 'Administrator', permissions: ['P1', 'P2', 'P3'], firstLogin: true },
  { id: 'support', name: 'Sam Support', role: 'Support', permissions: ['P1'], firstLogin: true },
  { id: 'operations', name: 'Owen Operations', role: 'Operations', permissions: ['P1'], firstLogin: true },
  { id: 'manager', name: 'Morgan Equipment Manager', role: 'Equipment Manager', permissions: ['P2'], firstLogin: true },
  { id: 'receiver', name: 'Harper Receiver', role: 'Receiver', permissions: ['P3'], firstLogin: true }
];

const evidenceFact = (value, subfields, implausible = false) => ({ value, subfields, implausible });
const partyFact = (shipper, consignee) => evidenceFact(`${shipper} / ${consignee}`, {
  shipperCompany: shipper, shipperContact: `${shipper} contact`, shipperEmail: `${shipper.replaceAll(' ', '.')}@example.invalid`, shipperPhone: 'Recorded shipper phone', shipperAddress: 'Recorded shipper address', shipperCountry: 'Recorded shipper country',
  consigneeCompany: consignee, consigneeContact: `${consignee} contact`, consigneeEmail: `${consignee.replaceAll(' ', '.')}@example.invalid`, consigneePhone: 'Recorded consignee phone', consigneeAddress: 'Recorded consignee address', consigneeCountry: 'Recorded consignee country'
});

export const initialInteraction = {
  requestId: 'REQ-SYN-001', channel: 'Email', customer: 'Refrigerated Food Exporter', shipper: 'Refrigerated Food Exporter', consignee: 'Refrigerated Food Consignee', status: 'Pending', assignedTo: null, bookingId: null, lastUpdated: 'Sample event 01',
  customerContact: { company: 'Refrigerated Food Exporter', email: 'orders@refrigerated-food.example.invalid', phone: 'Recorded customer phone' },
  conversation: [
    { source: 'Customer Email', text: 'Please arrange two temperature-controlled containers. Each container is 15 tonnes. Cargo ready after the documented pickup date.', at: 'Sample event 01' },
    { source: 'Packing List', text: 'Total declared gross weight: 40 tonnes.', at: 'Sample event 01' }
  ],
  summary: 'An ocean FCL request includes temperature-controlled cargo. Weight sources conflict: two containers at 15 tonnes versus 40 tonnes total.',
  followUp: 'Please confirm the correct gross weight and container requirement before Support validates the request.',
  customerClarificationTemplates: {
    'Weight and dimensions': {
      correctedInformation: '30 tonnes total across two 15-tonne 40RF containers.',
      customerClarification: 'Customer reply: the packing-list total of 40 tonnes was incorrect. The confirmed total shipment gross weight is 30 tonnes across two 15-tonne containers.',
      source: 'Customer Clarification Email',
      subfields: { grossWeight: '30 tonnes total', dimensions: '12.19 m × 2.44 m × 2.59 m', equipmentType: '40RF', containerQuantity: '2' },
    },
  },
  documents: ['Customer Email', 'Packing List'],
  shipmentRequirements: 'Ocean FCL request for temperature-controlled cargo; weight discrepancy requires clarification.',
  sourceRecords: [
    { source: 'Customer Email', at: 'Sample event 01', facts: {
      'Shipper and receiver': partyFact('Refrigerated Food Exporter', 'Refrigerated Food Consignee'),
      'Pickup location': evidenceFact('Refrigerated origin warehouse and origin port', { pickupAddress: 'Refrigerated origin warehouse', originPort: 'Origin port' }),
      'Delivery location': evidenceFact('Refrigerated destination warehouse and destination port', { deliveryAddress: 'Refrigerated destination warehouse', destinationPort: 'Destination port' }),
      'Cargo description': evidenceFact('Temperature-controlled food cargo', { commodity: 'Temperature-controlled food cargo' }),
      'Cargo quantity': evidenceFact('Two 40RF containers', { quantity: 'Two containers' }),
      'Weight and dimensions': evidenceFact('Two 40RF containers at 15 tonnes each; dimensions 12.19 m × 2.44 m × 2.59 m', { grossWeight: '15 tonnes per container', dimensions: '12.19 m × 2.44 m × 2.59 m', equipmentType: '40RF', containerQuantity: '2' }),
      'Ocean freight service': evidenceFact('FCL, door-to-door with inland leg', { service: 'FCL, door-to-door with inland leg' }),
      'Cargo readiness': evidenceFact('Preferred pickup date recorded', { readinessDate: 'Preferred pickup date' }),
      'Delivery window': evidenceFact('Delivery window recorded', { deliveryWindow: 'Delivery window' }),
      'Special handling': evidenceFact('Temperature controlled', { handling: 'Temperature controlled' })
    } },
    { source: 'Packing List', at: 'Sample event 01', facts: {
      'Weight and dimensions': evidenceFact('40 tonnes total; 40RF equipment', { grossWeight: '40 tonnes total', dimensions: '12.19 m × 2.44 m × 2.59 m', equipmentType: '40RF', containerQuantity: '2' })
    } }
  ],
  audit: [{ at: 'Sample event 01', actor: 'System', action: 'Request ID issued at first customer contact' }]
};

export const initialInteractions = [
  initialInteraction,
  {
    requestId: 'REQ-SYN-002', channel: 'Email', customer: 'Dry Goods Exporter', shipper: 'Dry Goods Exporter', consignee: 'Dry Goods Consignee', status: 'Pending', assignedTo: null, bookingId: null, lastUpdated: 'Sample event 02', customerContact: { company: 'Dry Goods Exporter', email: 'bookings@dry-goods.example.invalid', phone: 'Recorded customer phone' },
    conversation: [
      { source: 'Customer Email', text: 'We need an LCL ocean-freight shipment for 180 bags of coffee beans from the stated origin location. Cargo will be ready after the stated collection date.', at: 'Sample event 02' },
      { source: 'Commercial Note', text: 'Commodity and party details supplied. Gross weight, dimensions, and required delivery window are not included.', at: 'Sample event 02' }
    ],
    documents: ['Customer Email', 'Commercial Note'],
    customerClarificationTemplates: {
      'Weight and dimensions': {
        correctedInformation: 'Gross weight 3,600 kg; package dimensions 0.60 m × 0.40 m × 0.30 m; 20DV suitable for LCL consolidation.',
        customerClarification: 'Customer clarification: the 180 bags of coffee beans have a gross weight of 3,600 kg and the recorded package dimensions. A 20DV container type is suitable for the LCL consolidation.',
        source: 'Customer Clarification Email',
        subfields: { grossWeight: '3,600 kg', dimensions: '0.60 m × 0.40 m × 0.30 m', equipmentType: '20DV', containerQuantity: '1' },
      },
      'Delivery window': {
        correctedInformation: 'Required delivery window: 14–16 September.',
        customerClarification: 'Customer clarification: please deliver the coffee shipment within the required delivery window of 14–16 September.',
        source: 'Customer Clarification Email',
        subfields: { deliveryWindow: '14–16 September' },
      },
    },
    shipmentRequirements: 'LCL ocean freight request with missing weight/dimensions and delivery-window information.',
    sourceRecords: [
      { source: 'Customer Email', at: 'Sample event 02', facts: {
        'Pickup location': evidenceFact('Coastal warehouse and origin port', { pickupAddress: 'Coastal warehouse', originPort: 'Origin port' }),
        'Delivery location': evidenceFact('Inland destination and destination port', { deliveryAddress: 'Inland destination', destinationPort: 'Destination port' }),
        'Cargo description': evidenceFact('Bagged coffee beans, non-hazardous', { commodity: 'Bagged coffee beans, non-hazardous' }),
        'Cargo quantity': evidenceFact('180 bags; container requirement not supplied', { quantity: '180 bags' }),
        'Ocean freight service': evidenceFact('LCL, port-to-port', { service: 'LCL, port-to-port' }),
        'Cargo readiness': evidenceFact('Stated collection date', { readinessDate: 'Stated collection date' }),
        'Special handling': evidenceFact('No special handling requested', { handling: 'No special handling requested' })
      } },
      { source: 'Commercial Note', at: 'Sample event 02', facts: {
        'Shipper and receiver': partyFact('Dry Goods Exporter', 'Dry Goods Consignee')
      } }
    ],
    summary: 'An LCL ocean-freight request has party, route, commodity, quantity, service, and readiness information. Weight/dimensions and delivery window are absent from the supplied records.',
    followUp: 'Please provide the gross weight, package dimensions, and required delivery date or window.',
    audit: [{ at: 'Sample event 02', actor: 'System', action: 'Request ID issued at first email contact' }]
  },
  {
    requestId: 'REQ-SYN-003', channel: 'Phone', customer: 'Machinery Exporter', shipper: 'Machinery Exporter', consignee: 'Machinery Consignee', status: 'Picked Up', assignedTo: 'Sam Support', bookingId: null, lastUpdated: 'Sample event 03', customerContact: { company: 'Machinery Exporter', email: 'operations@machinery.example.invalid', phone: 'Recorded customer phone' },
    conversation: [
      { source: 'Outbound Call Transcript', text: 'Support confirmed six crates of precision machine components, requested 40HC equipment, the stated collection date, and the stated delivery window. Cargo is non-hazardous and must be kept dry.', at: 'Sample event 03' },
      { source: 'Support Call Note', text: 'Shipper, consignee, origin, destination, gross weight, crate dimensions, ocean service, and inland delivery leg were recorded during the active call.', at: 'Sample event 03' }
    ],
    documents: ['Outbound Call Transcript', 'Support Call Note'],
    shipmentRequirements: 'FCL ocean freight request for crated machinery components with a port-to-door inland leg.',
    sourceRecords: [
      { source: 'Outbound Call Transcript', at: 'Sample event 03', facts: {
        'Shipper and receiver': partyFact('Machinery Exporter', 'Machinery Consignee'),
        'Pickup location': evidenceFact('Inland plant and origin port', { pickupAddress: 'Inland plant', originPort: 'Origin port' }),
        'Delivery location': evidenceFact('Receiving facility and destination port', { deliveryAddress: 'Receiving facility', destinationPort: 'Destination port' }),
        'Cargo description': evidenceFact('Precision machine components in crated cargo', { commodity: 'Precision machine components in crated cargo' }),
        'Cargo quantity': evidenceFact('Six crates', { quantity: 'Six crates' }),
        'Weight and dimensions': evidenceFact('18 tonnes; crate dimensions 12.03 m × 2.35 m × 2.39 m for one 40HC container', { grossWeight: '18 tonnes', dimensions: '12.03 m × 2.35 m × 2.39 m', equipmentType: '40HC', containerQuantity: '1' }),
        'Ocean freight service': evidenceFact('FCL, port-to-door with inland leg', { service: 'FCL, port-to-door with inland leg' }),
        'Cargo readiness': evidenceFact('Stated readiness date', { readinessDate: 'Stated readiness date' }),
        'Delivery window': evidenceFact('Stated delivery window', { deliveryWindow: 'Stated delivery window' }),
        'Special handling': evidenceFact('Keep dry; non-hazardous', { handling: 'Keep dry; non-hazardous' })
      } },
      { source: 'Support Call Note', at: 'Sample event 03', facts: {} }
    ],
    summary: 'Active outbound phone interaction is assigned to Support. The call records complete available shipment information for crated machinery components.',
    followUp: 'Support should review the recorded call evidence before human validation.',
    audit: [{ at: 'Sample event 03', actor: 'System', action: 'Phone Request ID issued and automatically assigned to Support' }]
  }
];

export const initialInventory = [
  { id: 'INV-SIN-40RF', source: 'Singapore Depot', country: 'International location', type: '40RF', ready: 3, expectedReady: 2, availableAfterDays: 7, reserved: 0, inTransit: 1, maintenance: 0, condition: 'ready', capabilities: ['reefer'], freshness: 'Current sample feed update' },
  { id: 'INV-PKG-40RF', source: 'Port Klang Depot', country: 'International location', type: '40RF', ready: 2, expectedReady: 0, availableAfterDays: 0, reserved: 0, inTransit: 0, maintenance: 1, condition: 'ready', capabilities: ['reefer'], freshness: 'Current sample feed update' },
  { id: 'INV-SIN-20DV', source: 'Singapore Depot', country: 'International location', type: '20DV', ready: 8, expectedReady: 2, availableAfterDays: 7, reserved: 0, inTransit: 1, maintenance: 1, condition: 'ready', capabilities: [], freshness: 'Current sample feed update' },
  { id: 'INV-RTM-40HC', source: 'Rotterdam Depot', country: 'International location', type: '40HC', ready: 5, expectedReady: 1, availableAfterDays: 14, reserved: 0, inTransit: 2, maintenance: 0, condition: 'ready', capabilities: [], freshness: 'Current sample feed update' },
  { id: 'INV-SIN-45PW', source: 'Singapore Depot', country: 'International location', type: '45PW', ready: 1, expectedReady: 0, availableAfterDays: 0, reserved: 0, inTransit: 0, maintenance: 0, condition: 'ready', capabilities: ['oversize'], freshness: 'Current sample feed update' }
];

export const seedBooking = {
  bookingId: 'BKG-SYN-204', requestId: 'REQ-SYN-204', interactionId: 'INT-SYN-204', currentStatus: 'Arrived at Receiving Location',
  confirmed: true, pickupUrgencyRank: 1, contractualPriorityRank: 1, customerPriority: 'Sample contractual priority', pickupUrgency: 'Sample earliest pickup deadline',
  containerType: '40RF', quantity: 4, specialHandling: ['Temperature controlled'], destination: 'Receiving location',
  history: [
    { at: 'Sample event 10', status: 'Equipment Allocation', note: 'Equipment planning started' },
    { at: 'Sample event 12', status: 'Ocean Transit', note: 'Operational record' },
    { at: 'Sample event 13', status: 'Arrived at Receiving Location', note: 'Receiving validation starts' }
  ]
};

export const initialDemand = [
  { bookingId: 'BKG-SYN-204', confirmed: true, pickupUrgencyRank: 1, contractualPriorityRank: 1, label: 'Sample confirmed demand A' },
  { bookingId: 'BKG-SYN-205', confirmed: true, pickupUrgencyRank: 2, contractualPriorityRank: 2, label: 'Sample confirmed demand B' }
];

export const initialPlans = [
  { id: 'PLAN-SYN-A', title: 'Option A: complete allocation', inventoryId: 'INV-SIN-40RF', source: 'Singapore Depot', destination: 'Receiving location', quantity: 4, type: '40RF', singleOrigin: true, compatible: true, syntheticCostScore: 48, repositionCostScore: 48, availableDay: 7, vesselCapacityAvailable: true, depotStorageAvailable: true, dimensionCompatible: true, weightCompatible: true, specialHandlingCompatible: true, syntheticTransitDays: 18, vesselCapacity: 'Capacity available', storage: 'Depot space available', remainingShortage: 0, status: 'Pending Approval', rationale: 'Complete compatible single-origin option. Expected-ready units require recorded readiness checks.', risks: 'Revalidate if the schedule or inspection record changes.', affectedBookingIds: ['BKG-SYN-204'] },
  { id: 'PLAN-SYN-B', title: 'Option B: compatible partial alternative', inventoryId: 'INV-PKG-40RF', source: 'Port Klang Depot', destination: 'Receiving location', quantity: 2, type: '40RF', singleOrigin: true, compatible: true, substituteFor: 'Requested 40RF equipment', syntheticCostScore: 36, repositionCostScore: 36, availableDay: 0, vesselCapacityAvailable: true, depotStorageAvailable: true, dimensionCompatible: true, weightCompatible: true, specialHandlingCompatible: true, syntheticTransitDays: 14, vesselCapacity: 'Capacity available', storage: 'Depot space available', remainingShortage: 2, status: 'Draft', rationale: 'Compatible alternative source with partial fulfilment from one source.', risks: 'Shortage remains. No external leasing in core.', affectedBookingIds: ['BKG-SYN-204'] }
];

export const initialHandoff = {
  bookingId: 'BKG-SYN-204', expectedQuantity: 4, receivedQuantity: 3, outstandingQuantity: 1,
  documents: [
    { name: 'Booking record', state: 'pending' }, { name: 'Manifest', state: 'pending' }, { name: 'Receiving record', state: 'pending' }, { name: 'Proof of delivery', state: 'pending' }
  ],
  physicalChecksRecorded: false, discrepancyResolved: false, handlerApproved: false, podRecorded: false, deliveryConfirmed: false, deliveredQuantity: 0, deliveryOutstandingQuantity: 4, partialDeliveryEvents: [],
  checklist: ['Booking and manifest available', 'Expected versus recorded quantity compared', 'Container, seal, and condition require human recorded check', 'POD required before delivery completion'],
  events: [
    { at: 'Sample event 13', sender: 'Origin handler', receiver: 'Receiving team', responsibleHandler: 'Origin handler', documents: ['Booking record', 'Manifest'], validationOutcome: 'Arrival recorded', discrepancy: null, resolution: null, pod: null },
    { at: 'Sample event 14', sender: 'Origin handler', receiver: 'Receiving team', responsibleHandler: 'Origin handler', documents: ['Receiving record'], validationOutcome: 'Discrepancy detected', discrepancy: 'Expected quantity 4 versus recorded quantity 3', resolution: null, pod: null }
  ]
};

export const createInitialHandoff = (booking) => ({
  bookingId: booking.bookingId,
  expectedQuantity: booking.quantity,
  receivedQuantity: Math.max(0, booking.quantity - 1),
  outstandingQuantity: Math.min(1, booking.quantity),
  documents: [{ name: 'Booking record', state: 'pending' }, { name: 'Manifest', state: 'pending' }, { name: 'Receiving record', state: 'pending' }, { name: 'Proof of delivery', state: 'pending' }],
  physicalChecksRecorded: false, discrepancyResolved: false, handlerApproved: false, podRecorded: false, deliveryConfirmed: false, deliveredQuantity: 0, deliveryOutstandingQuantity: booking.quantity, partialDeliveryEvents: [],
  checklist: ['Booking and manifest available', 'Expected versus recorded quantity compared', 'Container, seal, and condition require human recorded check', 'POD required before delivery completion'],
  events: [{ at: 'Sample event', sender: 'Origin handler', receiver: 'Receiving team', responsibleHandler: 'Origin handler', documents: ['Booking record', 'Manifest'], validationOutcome: 'Arrival recorded', discrepancy: null, resolution: null, pod: null }]
});

const copy = (value) => JSON.parse(JSON.stringify(value));

export const createDemoBaseline = () => ({
  interactions: copy(initialInteractions),
  selectedRequestId: initialInteractions[0].requestId,
  bookings: [],
  inventory: copy(initialInventory).map((item) => ({ ...item, reserved: 0 })),
  plans: [],
  allocationHistory: [],
  handoffs: {}
});
