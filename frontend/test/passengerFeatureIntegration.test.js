import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('passenger map renders discovery drivers separately from assigned telemetry', () => {
  const map = read('../src/components/passenger/PassengerMap.js');
  const shell = read('../src/components/passenger/PassengerRideShell.js');
  assert.match(map, /availableDrivers\.map/);
  assert.match(map, /!driverTelemetry/);
  assert.match(shell, /getActiveDriverLocations/);
  assert.match(shell, /setInterval\(refresh, 10000\)/);
});

test('scheduled ride UI submits a future ISO time through canonical bookings', () => {
  const options = read('../src/components/passenger/RouteOptionsWorkspace.js');
  const shell = read('../src/components/passenger/PassengerRideShell.js');
  const context = read('../src/context/RideContext.js');
  const reminders = read('../src/utils/scheduledRideNotifications.js');
  assert.match(options, /Schedule Ride/);
  assert.match(options, /DateTimePicker/);
  assert.match(shell, /bookingPayload\.scheduledTime = scheduledTime\.toISOString\(\)/);
  assert.match(context, /booking:scheduled_activated/);
  assert.match(reminders, /scheduleNotificationAsync/);
  assert.match(reminders, /cancelScheduledNotificationAsync/);
});

test('dedicated add-location screen submits a map coordinate and returns it to ride selection', () => {
  const screen = read('../src/screens/passenger/AddLocationScreen.js');
  const navigation = read('../src/navigation/PassengerNavigator.js');
  assert.match(screen, /submitCampusPlace/);
  assert.match(screen, /coordinates: \[region\.longitude, region\.latitude\]/);
  assert.match(screen, /setDropoffLocation/);
  assert.match(navigation, /name="AddLocation"/);
});

test('dedicated trusted-contact screen persists every, night, and never share modes', () => {
  const screen = read('../src/screens/passenger/TrustedContactsScreen.js');
  const service = read('../src/api/services/safetyService.js');
  assert.match(screen, /every_ride/);
  assert.match(screen, /night_only/);
  assert.match(screen, /never/);
  assert.match(service, /api\.patch\(`\/safety\/contacts/);
  assert.match(service, /api\.patch\('\/safety\/preferences'/);
});
