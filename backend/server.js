const http = require('node:http');
const { randomUUID } = require('node:crypto');

const users = [];
const trips = [];

/* ── Fare estimation (naira) ── */
const FARES = {
  ride:     { min: 700, max: 1000 },
  dispatch: { min: 800, max: 1200 }
};
const estimateFare = (service) => {
  const { min, max } = FARES[service] || FARES.ride;
  return { min, max, currency: 'NGN' };
};

const send = (response, status, payload) => {
  response.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  response.end(JSON.stringify(payload));
};

const readBody = (request) => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => { body += chunk; });
  request.on('end', () => {
    try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON body')); }
  });
});

const server = http.createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {});
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/health') return send(response, 200, { status: 'ok', service: 'marago-api' });
  try {
    /* ── Users ── */
    if (request.method === 'POST' && url.pathname === '/users') {
      const { name, phone, role } = await readBody(request);
      if (!name || !phone || !['customer', 'rider'].includes(role)) return send(response, 400, { error: 'name, phone, and a valid role are required' });
      const user = { id: randomUUID(), name, phone, role, createdAt: new Date().toISOString() };
      users.push(user);
      return send(response, 201, user);
    }

    /* ── Fare estimate ── */
    if (request.method === 'GET' && url.pathname === '/fare') {
      const service = url.searchParams.get('service');
      if (!['ride', 'dispatch'].includes(service)) return send(response, 400, { error: 'service query param must be ride or dispatch' });
      return send(response, 200, estimateFare(service));
    }

    /* ── Create trip ── */
    if (request.method === 'POST' && url.pathname === '/trips') {
      const { customerId, service, pickup, destination } = await readBody(request);
      if (!customerId || !pickup || !destination || !['ride', 'dispatch'].includes(service)) return send(response, 400, { error: 'customerId, service, pickup, and destination are required' });
      const fare = estimateFare(service);
      const trip = { id: randomUUID(), customerId, service, pickup, destination, fare, status: 'searching', riderId: null, createdAt: new Date().toISOString() };
      trips.push(trip);
      return send(response, 201, trip);
    }

    /* ── List trips (with optional filters) ── */
    if (request.method === 'GET' && url.pathname === '/trips') {
      const status = url.searchParams.get('status');
      const customerId = url.searchParams.get('customerId');
      const riderId = url.searchParams.get('riderId');
      let result = trips;
      if (status) result = result.filter((t) => t.status === status);
      if (customerId) result = result.filter((t) => t.customerId === customerId);
      if (riderId) result = result.filter((t) => t.riderId === riderId);
      return send(response, 200, result);
    }

    /* ── Single trip by ID ── */
    const tripById = url.pathname.match(/^\/trips\/([^/]+)$/);
    if (request.method === 'GET' && tripById) {
      const trip = trips.find((item) => item.id === tripById[1]);
      return trip ? send(response, 200, trip) : send(response, 404, { error: 'Trip not found' });
    }

    /* ── Accept trip (searching → rider_assigned) ── */
    const acceptMatch = url.pathname.match(/^\/trips\/([^/]+)\/accept$/);
    if (request.method === 'POST' && acceptMatch) {
      const { riderId } = await readBody(request);
      const trip = trips.find((item) => item.id === acceptMatch[1]);
      if (!trip) return send(response, 404, { error: 'Trip not found' });
      if (!riderId || trip.status !== 'searching') return send(response, 409, { error: 'Trip is no longer available' });
      trip.riderId = riderId;
      trip.status = 'rider_assigned';
      return send(response, 200, trip);
    }

    /* ── Start trip (rider_assigned → in_progress) ── */
    const startMatch = url.pathname.match(/^\/trips\/([^/]+)\/start$/);
    if (request.method === 'POST' && startMatch) {
      const trip = trips.find((item) => item.id === startMatch[1]);
      if (!trip) return send(response, 404, { error: 'Trip not found' });
      if (trip.status !== 'rider_assigned') return send(response, 409, { error: 'Trip must be accepted before it can start' });
      trip.status = 'in_progress';
      trip.startedAt = new Date().toISOString();
      return send(response, 200, trip);
    }

    /* ── Complete trip (in_progress → completed) ── */
    const completeMatch = url.pathname.match(/^\/trips\/([^/]+)\/complete$/);
    if (request.method === 'POST' && completeMatch) {
      const trip = trips.find((item) => item.id === completeMatch[1]);
      if (!trip) return send(response, 404, { error: 'Trip not found' });
      if (trip.status !== 'in_progress') return send(response, 409, { error: 'Trip must be in progress before it can be completed' });
      trip.status = 'completed';
      trip.completedAt = new Date().toISOString();
      return send(response, 200, trip);
    }

    /* ── Cancel trip (searching | rider_assigned → cancelled) ── */
    const cancelMatch = url.pathname.match(/^\/trips\/([^/]+)\/cancel$/);
    if (request.method === 'POST' && cancelMatch) {
      const trip = trips.find((item) => item.id === cancelMatch[1]);
      if (!trip) return send(response, 404, { error: 'Trip not found' });
      if (!['searching', 'rider_assigned'].includes(trip.status)) return send(response, 409, { error: 'Trip cannot be cancelled at this stage' });
      trip.status = 'cancelled';
      trip.cancelledAt = new Date().toISOString();
      return send(response, 200, trip);
    }

    return send(response, 404, { error: 'Route not found' });
  } catch (error) { return send(response, 400, { error: error.message }); }
});

if (require.main === module) server.listen(process.env.PORT || 4000, () => console.log('MaraGo API listening on port 4000'));
module.exports = { server, users, trips };
