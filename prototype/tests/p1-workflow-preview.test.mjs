import test from 'node:test';
import assert from 'node:assert/strict';
import { P1_WORKFLOW_STAGES, p1WorkflowStageFor } from '../src/rules.mjs';

test('P1 workflow preview maps the simplified Request-to-Booking handoff without changing the request', () => {
  const stages = ['Pending', 'Picked Up', 'For Clarification', 'Ready for Submission', 'Submitted'];
  assert.deepEqual(P1_WORKFLOW_STAGES, [...stages, 'Equipment Allocation']);
  for (const status of stages) {
    const ticket = { status, bookingId: null };
    assert.equal(p1WorkflowStageFor(ticket), status);
    assert.deepEqual(ticket, { status, bookingId: null });
  }
  assert.equal(p1WorkflowStageFor({ status: 'Submitted', bookingId: 'BKG-SYN-001' }), 'Equipment Allocation');
});
