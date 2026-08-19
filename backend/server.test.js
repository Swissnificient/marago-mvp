const test = require('node:test');
const assert = require('node:assert/strict');
const { server, users, trips } = require('./server');

test('creates a customer then a dispatch trip', async () => {
  users.length = 0; trips.length = 0;
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const request = (path, body) => fetch(`http://127.0.0.1:${port}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const customer = await (await request('/users', { name: 'Amina Okafor', phone: '08000000000', role: 'customer' })).json();
  const tripResponse = await request('/trips', { customerId: customer.id, service: 'dispatch', pickup: 'Mararaba Park', destination: 'Nyanya Junction' });
  assert.equal(tripResponse.status, 201);
  assert.equal((await tripResponse.json()).status, 'searching');
  await new Promise((resolve) => server.close(resolve));
});
