const test = require('node:test');
const assert = require('node:assert/strict');
const { server, users, trips } = require('./server');

let port;
const request = (path, body) => fetch(`http://127.0.0.1:${port}${path}`, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
const json = async (path, body) => { const r = await request(path, body); return { status: r.status, data: await r.json() }; };

test.before(async () => {
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
});

test.afterEach(() => { users.length = 0; trips.length = 0; });

test.after(async () => { await new Promise((resolve) => server.close(resolve)); });

test('health check', async () => {
  const { status, data } = await json('/health');
  assert.equal(status, 200);
  assert.equal(data.status, 'ok');
});

test('fare estimate', async () => {
  const ride = await json('/fare?service=ride');
  assert.equal(ride.status, 200);
  assert.equal(ride.data.min, 700);
  assert.equal(ride.data.max, 1000);
  const dispatch = await json('/fare?service=dispatch');
  assert.equal(dispatch.data.min, 800);
  const bad = await json('/fare?service=invalid');
  assert.equal(bad.status, 400);
});

test('full lifecycle: create → accept → start → complete', async () => {
  const customer = (await json('/users', { name: 'Amina Okafor', phone: '08000000000', role: 'customer' })).data;
  const rider = (await json('/users', { name: 'Ibrahim Musa', phone: '08000000001', role: 'rider' })).data;

  // Create trip
  const created = await json('/trips', { customerId: customer.id, service: 'ride', pickup: 'Mararaba Park', destination: 'Nyanya Junction' });
  assert.equal(created.status, 201);
  assert.equal(created.data.status, 'searching');
  assert.ok(created.data.fare);
  const tripId = created.data.id;

  // Accept
  const accepted = await json(`/trips/${tripId}/accept`, { riderId: rider.id });
  assert.equal(accepted.status, 200);
  assert.equal(accepted.data.status, 'rider_assigned');
  assert.equal(accepted.data.riderId, rider.id);

  // Start
  const started = await json(`/trips/${tripId}/start`, {});
  assert.equal(started.status, 200);
  assert.equal(started.data.status, 'in_progress');
  assert.ok(started.data.startedAt);

  // Complete
  const completed = await json(`/trips/${tripId}/complete`, {});
  assert.equal(completed.status, 200);
  assert.equal(completed.data.status, 'completed');
  assert.ok(completed.data.completedAt);
});

test('cancel a trip in searching state', async () => {
  const customer = (await json('/users', { name: 'Amina', phone: '080', role: 'customer' })).data;
  const trip = (await json('/trips', { customerId: customer.id, service: 'dispatch', pickup: 'A', destination: 'B' })).data;

  const cancelled = await json(`/trips/${trip.id}/cancel`, {});
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.status, 'cancelled');
  assert.ok(cancelled.data.cancelledAt);
});

test('cancel a trip after rider assigned', async () => {
  const customer = (await json('/users', { name: 'Amina', phone: '080', role: 'customer' })).data;
  const rider = (await json('/users', { name: 'Ibrahim', phone: '081', role: 'rider' })).data;
  const trip = (await json('/trips', { customerId: customer.id, service: 'ride', pickup: 'A', destination: 'B' })).data;
  await json(`/trips/${trip.id}/accept`, { riderId: rider.id });

  const cancelled = await json(`/trips/${trip.id}/cancel`, {});
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.status, 'cancelled');
});

test('cannot cancel an in-progress trip', async () => {
  const customer = (await json('/users', { name: 'Amina', phone: '080', role: 'customer' })).data;
  const rider = (await json('/users', { name: 'Ibrahim', phone: '081', role: 'rider' })).data;
  const trip = (await json('/trips', { customerId: customer.id, service: 'ride', pickup: 'A', destination: 'B' })).data;
  await json(`/trips/${trip.id}/accept`, { riderId: rider.id });
  await json(`/trips/${trip.id}/start`, {});

  const result = await json(`/trips/${trip.id}/cancel`, {});
  assert.equal(result.status, 409);
});

test('cannot accept an already accepted trip', async () => {
  const customer = (await json('/users', { name: 'Amina', phone: '080', role: 'customer' })).data;
  const rider1 = (await json('/users', { name: 'Ibrahim', phone: '081', role: 'rider' })).data;
  const rider2 = (await json('/users', { name: 'Musa', phone: '082', role: 'rider' })).data;
  const trip = (await json('/trips', { customerId: customer.id, service: 'ride', pickup: 'A', destination: 'B' })).data;
  await json(`/trips/${trip.id}/accept`, { riderId: rider1.id });

  const result = await json(`/trips/${trip.id}/accept`, { riderId: rider2.id });
  assert.equal(result.status, 409);
});

test('cannot start a trip that has not been accepted', async () => {
  const customer = (await json('/users', { name: 'Amina', phone: '080', role: 'customer' })).data;
  const trip = (await json('/trips', { customerId: customer.id, service: 'ride', pickup: 'A', destination: 'B' })).data;

  const result = await json(`/trips/${trip.id}/start`, {});
  assert.equal(result.status, 409);
});

test('cannot complete a trip that has not started', async () => {
  const customer = (await json('/users', { name: 'Amina', phone: '080', role: 'customer' })).data;
  const rider = (await json('/users', { name: 'Ibrahim', phone: '081', role: 'rider' })).data;
  const trip = (await json('/trips', { customerId: customer.id, service: 'ride', pickup: 'A', destination: 'B' })).data;
  await json(`/trips/${trip.id}/accept`, { riderId: rider.id });

  const result = await json(`/trips/${trip.id}/complete`, {});
  assert.equal(result.status, 409);
});

test('filter trips by customerId and riderId', async () => {
  const c1 = (await json('/users', { name: 'A', phone: '080', role: 'customer' })).data;
  const c2 = (await json('/users', { name: 'B', phone: '081', role: 'customer' })).data;
  const rider = (await json('/users', { name: 'R', phone: '082', role: 'rider' })).data;
  await json('/trips', { customerId: c1.id, service: 'ride', pickup: 'X', destination: 'Y' });
  const t2 = (await json('/trips', { customerId: c2.id, service: 'dispatch', pickup: 'X', destination: 'Z' })).data;
  await json(`/trips/${t2.id}/accept`, { riderId: rider.id });

  const byC1 = (await json(`/trips?customerId=${c1.id}`)).data;
  assert.equal(byC1.length, 1);
  const byRider = (await json(`/trips?riderId=${rider.id}`)).data;
  assert.equal(byRider.length, 1);
  assert.equal(byRider[0].id, t2.id);
});
