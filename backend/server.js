const http = require('node:http');
const { randomUUID } = require('node:crypto');

const users = [];
const trips = [];

const send = (response, status, payload) => {
  response.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
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
    if (request.method === 'POST' && url.pathname === '/users') {
      const { name, phone, role } = await readBody(request);
      if (!name || !phone || !['customer', 'rider'].includes(role)) return send(response, 400, { error: 'name, phone, and a valid role are required' });
      const user = { id: randomUUID(), name, phone, role, createdAt: new Date().toISOString() };
      users.push(user);
      return send(response, 201, user);
    }
    if (request.method === 'POST' && url.pathname === '/trips') {
      const { customerId, service, pickup, destination } = await readBody(request);
      if (!customerId || !pickup || !destination || !['ride', 'dispatch'].includes(service)) return send(response, 400, { error: 'customerId, service, pickup, and destination are required' });
      const trip = { id: randomUUID(), customerId, service, pickup, destination, status: 'searching', riderId: null, createdAt: new Date().toISOString() };
      trips.push(trip);
      return send(response, 201, trip);
    }
    if (request.method === 'GET' && url.pathname === '/trips') return send(response, 200, trips);
    const match = url.pathname.match(/^\/trips\/([^/]+)\/accept$/);
    if (request.method === 'POST' && match) {
      const { riderId } = await readBody(request);
      const trip = trips.find((item) => item.id === match[1]);
      if (!trip) return send(response, 404, { error: 'Trip not found' });
      if (!riderId || trip.status !== 'searching') return send(response, 409, { error: 'Trip is no longer available' });
      trip.riderId = riderId;
      trip.status = 'rider_assigned';
      return send(response, 200, trip);
    }
    return send(response, 404, { error: 'Route not found' });
  } catch (error) { return send(response, 400, { error: error.message }); }
});

if (require.main === module) server.listen(process.env.PORT || 4000, () => console.log('MaraGo API listening on port 4000'));
module.exports = { server, users, trips };
