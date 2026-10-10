const test = require('node:test');
const assert = require('node:assert/strict');

// Model a state transition validator representing mobile safety state machine contracts
function evaluateSafetyState({ event, overlayDismissed = false }) {
  if (!event) {
    return {
      isEmergencyActive: false,
      showActiveOverlay: false,
      showMinimizedBanner: false,
      timelineStatus: 'idle',
      canDismiss: true,
      authoritativelyClosed: true,
    };
  }

  const isPassengerSafe = event.passengerResolutionIntent?.intent === 'safe';
  const isPassengerCancelled = event.passengerResolutionIntent?.intent === 'false_alarm';
  const isOperatorResolved = event.status === 'resolved';
  const isOperatorAcknowledged = Boolean(
    event.acknowledgement?.acknowledgedAt ||
    event.status === 'acknowledged' ||
    event.status === 'responding' ||
    isOperatorResolved
  );

  // Overlay visibility logic
  let showActiveOverlay = false;
  let showMinimizedBanner = false;

  if (isOperatorResolved) {
    // Event is fully resolved authoritatively by operator
    showActiveOverlay = !overlayDismissed;
    showMinimizedBanner = false;
  } else if (isPassengerSafe || isPassengerCancelled) {
    // Passenger reported safe/accidental - can dismiss overlay; banner suppressed
    showActiveOverlay = !overlayDismissed;
    showMinimizedBanner = false;
  } else {
    // Active emergency in progress
    showActiveOverlay = !overlayDismissed;
    showMinimizedBanner = overlayDismissed;
  }

  return {
    isEmergencyActive: !isOperatorResolved,
    showActiveOverlay,
    showMinimizedBanner,
    isOperatorAcknowledged,
    isPassengerSafe,
    isOperatorResolved,
    canDismiss: isPassengerSafe || isPassengerCancelled || isOperatorResolved,
    authoritativelyClosed: isOperatorResolved,
    headline: isOperatorResolved
      ? 'Case Resolved by Security'
      : isPassengerSafe
      ? 'Passenger Reported Safe'
      : 'SOS Active',
  };
}

test('Safety State: Initial SOS trigger creates active state with mandatory banner', () => {
  const event = {
    _id: 'evt_001',
    status: 'active',
    createdAt: new Date().toISOString(),
    timeline: [{ type: 'created' }],
  };

  const state = evaluateSafetyState({ event, overlayDismissed: false });
  assert.equal(state.isEmergencyActive, true);
  assert.equal(state.showActiveOverlay, true);
  assert.equal(state.showMinimizedBanner, false);
  assert.equal(state.isOperatorAcknowledged, false);
  assert.equal(state.headline, 'SOS Active');
  assert.equal(state.authoritativelyClosed, false);
});

test('Safety State: Minimizing active SOS shows persistent top banner', () => {
  const event = {
    _id: 'evt_001',
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const state = evaluateSafetyState({ event, overlayDismissed: true });
  assert.equal(state.isEmergencyActive, true);
  assert.equal(state.showActiveOverlay, false);
  assert.equal(state.showMinimizedBanner, true);
});

test('Safety State: Operator acknowledgment records milestone while keeping SOS active', () => {
  const event = {
    _id: 'evt_001',
    status: 'acknowledged',
    acknowledgement: {
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: 'Campus Security Operator 01',
    },
  };

  const state = evaluateSafetyState({ event, overlayDismissed: false });
  assert.equal(state.isOperatorAcknowledged, true);
  assert.equal(state.isEmergencyActive, true);
  assert.equal(state.authoritativelyClosed, false);
});

test('Safety State: Reporting "I am Safe" records safe intent without falsely claiming authoritative closure', () => {
  const event = {
    _id: 'evt_001',
    status: 'acknowledged', // Backend keeps status active/acknowledged
    acknowledgement: { acknowledgedAt: new Date().toISOString() },
    passengerResolutionIntent: {
      intent: 'safe',
      notes: 'Passenger confirmed safe via Safety Center',
      reportedAt: new Date().toISOString(),
    },
  };

  const state = evaluateSafetyState({ event, overlayDismissed: false });
  assert.equal(state.isPassengerSafe, true);
  assert.equal(state.authoritativelyClosed, false); // Crucial: NOT closed yet
  assert.equal(state.canDismiss, true);
  assert.equal(state.headline, 'Passenger Reported Safe');
});

test('Safety State: Dismissing overlay after reporting safe suppresses intrusive banner', () => {
  const event = {
    _id: 'evt_001',
    status: 'acknowledged',
    passengerResolutionIntent: {
      intent: 'safe',
      reportedAt: new Date().toISOString(),
    },
  };

  const state = evaluateSafetyState({ event, overlayDismissed: true });
  assert.equal(state.showActiveOverlay, false);
  assert.equal(state.showMinimizedBanner, false); // Suppressed so user is not stuck with flashing banner
  assert.equal(state.isPassengerSafe, true);
  assert.equal(state.authoritativelyClosed, false);
});

test('Safety State: Operator resolution finalizes incident authoritatively', () => {
  const event = {
    _id: 'evt_001',
    status: 'resolved',
    resolvedAt: new Date().toISOString(),
    resolvedBy: 'Campus Security Lead',
    passengerResolutionIntent: {
      intent: 'safe',
    },
  };

  const state = evaluateSafetyState({ event, overlayDismissed: true });
  assert.equal(state.isOperatorResolved, true);
  assert.equal(state.authoritativelyClosed, true);
  assert.equal(state.headline, 'Case Resolved by Security');
  assert.equal(state.showMinimizedBanner, false);
});
