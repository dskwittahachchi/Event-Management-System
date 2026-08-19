import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp, resetStore } from '../src/app.js';

const app = createApp();

test.beforeEach(() => resetStore());

test('health endpoint reports demo mode', async () => {
  const response = await request(app).get('/api/health').expect(200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.data.mode, 'demo');
});

test('public event discovery supports search and category filters', async () => {
  const response = await request(app)
    .get('/api/events?q=summit&category=Technology')
    .expect(200);

  assert.equal(response.body.data.events.length, 1);
  assert.equal(response.body.data.events[0].title, 'Future of AI Summit');
});

test('attendee can authenticate and receive a ticket', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'attendee@gatherly.demo', password: 'demo123' })
    .expect(200);

  const response = await request(app)
    .post('/api/events/evt-004/register')
    .set('Authorization', 'Bearer ' + login.body.data.token)
    .expect(201);

  assert.match(response.body.data.ticketCode, /^GTH-/);
  assert.equal(response.body.data.status, 'confirmed');
});

test('role middleware prevents attendee access to organizer data', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'attendee@gatherly.demo', password: 'demo123' });

  await request(app)
    .get('/api/organizer/stats')
    .set('Authorization', 'Bearer ' + login.body.data.token)
    .expect(403);
});
