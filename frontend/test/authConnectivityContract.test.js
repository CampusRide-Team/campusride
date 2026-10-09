const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const readSource = (relativePath) => fs.readFileSync(path.join(__dirname, '..', relativePath), 'utf8');

test('Passenger and Driver login screens use the canonical auth service', () => {
  for (const screen of ['src/screens/auth/PassengerLogin.js', 'src/screens/auth/DriverLogin.js']) {
    const source = readSource(screen);
    assert.match(source, /authService\.login\(payload\)/);
    assert.doesNotMatch(source, /api\.post\(['"]\/auth\/login['"]/);
  }
});

test('canonical auth service maps the UI identifier to the backend email field', () => {
  const source = readSource('src/api/services/authService.js');
  assert.match(source, /email:\s*credentials\.email\s*\|\|\s*credentials\.identifier/);
  assert.match(source, /api\.post\(['"]\/auth\/login['"],\s*payload\)/);
});

test('REST and Socket.IO share the same normalized API origin', () => {
  const axiosSource = readSource('src/api/axios.js');
  const socketSource = readSource('src/api/socketHelper.js');
  assert.match(axiosSource, /EXPO_PUBLIC_API_URL/);
  assert.match(socketSource, /getApiBaseUrl\(\)/);
  assert.doesNotMatch(socketSource, /https?:\/\//);
});
