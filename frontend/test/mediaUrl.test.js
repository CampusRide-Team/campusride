const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveMediaUrl } = require('../src/utils/mediaUrl');

test('turns a backend upload path into an absolute media URL', () => {
  assert.equal(
    resolveMediaUrl('uploads/avatar-123.jpg', 'http://192.168.1.10:5000'),
    'http://192.168.1.10:5000/uploads/avatar-123.jpg',
  );
});

test('preserves remote and device-local image URIs', () => {
  assert.equal(resolveMediaUrl('https://images.example/avatar.jpg', 'http://api.example'), 'https://images.example/avatar.jpg');
  assert.equal(resolveMediaUrl('file:///data/user/avatar.jpg', 'http://api.example'), 'file:///data/user/avatar.jpg');
  assert.equal(resolveMediaUrl('content://media/avatar/1', 'http://api.example'), 'content://media/avatar/1');
});

