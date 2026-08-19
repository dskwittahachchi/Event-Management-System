import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'gatherly-local-demo-secret-change-me';

const demoUsers = [
  { id: 'usr-attendee', name: 'Maya Chen', email: 'attendee@gatherly.demo', role: 'attendee', avatar: 'MC' },
  { id: 'usr-organizer', name: 'Alex Morgan', email: 'organizer@gatherly.demo', role: 'organizer', avatar: 'AM' },
  { id: 'usr-admin', name: 'Jordan Ellis', email: 'admin@gatherly.demo', role: 'admin', avatar: 'JE' }
];

const demoEvents = [
  {
    id: 'evt-001',
    organizerId: 'usr-organizer',
    organizerName: 'Gatherly Studio',
    title: 'Future of AI Summit',
    description: 'A full-day gathering for product leaders, researchers, and builders exploring responsible AI, agents, and the next wave of human-computer collaboration.',
    category: 'Technology',
    venue: 'Harbor Convention Hall',
    city: 'Colombo',
    startAt: '2026-09-12T09:00:00.000Z',
    endAt: '2026-09-12T18:00:00.000Z',
    capacity: 450,
    price: 79,
    status: 'published',
    imageTone: 'electric',
    featured: true
  },
  {
    id: 'evt-002',
    organizerId: 'usr-organizer',
    organizerName: 'Gatherly Studio',
    title: 'Afterglow Rooftop Sessions',
    description: 'An intimate sunset-to-midnight music experience with live electronic sets, chef-led small plates, and panoramic city views.',
    category: 'Music',
    venue: 'The Skyline Terrace',
    city: 'Colombo',
    startAt: '2026-09-19T12:30:00.000Z',
    endAt: '2026-09-19T18:30:00.000Z',
    capacity: 180,
    price: 42,
    status: 'published',
    imageTone: 'coral',
    featured: true
  },
  {
    id: 'evt-003',
    organizerId: 'usr-organizer',
    organizerName: 'Form & Function',
    title: 'Designing for Belonging',
    description: 'Hands-on talks and workshops about designing inclusive products, spaces, and communities that people genuinely want to return to.',
    category: 'Design',
    venue: 'Foundry House',
    city: 'Galle',
    startAt: '2026-10-03T04:30:00.000Z',
    endAt: '2026-10-03T11:00:00.000Z',
    capacity: 120,
    price: 35,
    status: 'published',
    imageTone: 'mint',
    featured: false
  },
  {
    id: 'evt-004',
    organizerId: 'usr-organizer',
    organizerName: 'Reset Collective',
    title: 'Sunday Reset Club',
    description: 'A calm morning of guided movement, breathwork, good coffee, and unhurried conversation in a light-filled garden studio.',
    category: 'Wellness',
    venue: 'The Garden Room',
    city: 'Kandy',
    startAt: '2026-09-27T01:30:00.000Z',
    endAt: '2026-09-27T05:30:00.000Z',
    capacity: 75,
    price: 18,
    status: 'published',
    imageTone: 'sun',
    featured: false
  },
  {
    id: 'evt-005',
    organizerId: 'usr-organizer',
    organizerName: 'Open Table',
    title: 'Makers & Neighbors',
    description: 'A free community market celebrating independent makers, local food, repair culture, and the stories behind the things we love.',
    category: 'Community',
    venue: 'Railway Warehouse',
    city: 'Colombo',
    startAt: '2026-10-11T05:00:00.000Z',
    endAt: '2026-10-11T12:30:00.000Z',
    capacity: 600,
    price: 0,
    status: 'published',
    imageTone: 'blue',
    featured: false
  },
  {
    id: 'evt-006',
    organizerId: 'usr-organizer',
    organizerName: 'Gatherly Studio',
    title: 'Creative Leadership Lab',
    description: 'A small-group working session for people building ambitious teams and healthier creative cultures.',
    category: 'Business',
    venue: 'Studio Nine',
    city: 'Colombo',
    startAt: '2026-10-22T03:30:00.000Z',
    endAt: '2026-10-22T10:30:00.000Z',
    capacity: 40,
    price: 120,
    status: 'draft',
    imageTone: 'violet',
    featured: false
  }
];

const demoRegistrations = [
  { id: 'reg-001', eventId: 'evt-001', attendeeId: 'usr-attendee', ticketCode: 'GTH-AI26-MAYA', status: 'confirmed', registeredAt: '2026-08-12T09:12:00.000Z' },
  { id: 'reg-002', eventId: 'evt-002', attendeeId: 'usr-demo-2', ticketCode: 'GTH-ROOF-220', status: 'checked-in', registeredAt: '2026-08-10T10:20:00.000Z' },
  { id: 'reg-003', eventId: 'evt-002', attendeeId: 'usr-demo-3', ticketCode: 'GTH-ROOF-241', status: 'confirmed', registeredAt: '2026-08-11T14:00:00.000Z' },
  { id: 'reg-004', eventId: 'evt-003', attendeeId: 'usr-demo-4', ticketCode: 'GTH-DESN-092', status: 'cancelled', registeredAt: '2026-08-09T08:30:00.000Z' }
];

let store;

function seedStore() {
  const passwordHash = bcrypt.hashSync('demo123', 10);
  store = {
    users: demoUsers.map((user) => ({ ...user, passwordHash })),
    events: structuredClone(demoEvents),
    registrations: structuredClone(demoRegistrations),
    checkIns: [{ id: 'chk-001', registrationId: 'reg-002', checkedInAt: '2026-08-19T10:04:00.000Z', checkedInBy: 'usr-organizer' }]
  };
}

seedStore();

export function resetStore() {
  seedStore();
}

function cleanUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function send(res, data, message = 'Operation completed', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function apiError(status, message, errors = []) {
  const error = new Error(message);
  error.status = status;
  error.details = errors;
  return error;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
}

function authMiddleware(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(apiError(401, 'Authentication required'));

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = store.users.find((candidate) => candidate.id === payload.sub);
    if (!user) return next(apiError(401, 'Your session is no longer valid'));
    req.user = user;
    return next();
  } catch {
    return next(apiError(401, 'Your session is invalid or expired'));
  }
}

function allowRoles(...roles) {
  return (req, _res, next) => {
    if (!roles.includes(req.user.role)) return next(apiError(403, 'You do not have permission to perform this action'));
    return next();
  };
}

function eventView(event) {
  const active = store.registrations.filter((registration) => registration.eventId === event.id && !['cancelled', 'waitlisted'].includes(registration.status));
  return {
    ...event,
    registeredCount: active.length,
    seatsLeft: Math.max(event.capacity - active.length, 0)
  };
}

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6)
});

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(72)
});

const eventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(20).max(2000),
  category: z.string().trim().min(2).max(40),
  venue: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  startAt: z.iso.datetime(),
  endAt: z.iso.datetime(),
  capacity: z.coerce.number().int().positive().max(100000),
  price: z.coerce.number().nonnegative().max(100000),
  status: z.enum(['draft', 'published', 'sold-out', 'completed', 'cancelled']).default('draft'),
  imageTone: z.enum(['electric', 'coral', 'mint', 'sun', 'blue', 'violet']).default('violet'),
  featured: z.boolean().default(false)
}).refine((data) => new Date(data.endAt) > new Date(data.startAt), {
  message: 'End time must be after start time',
  path: ['endAt']
});

export function createApp() {
  const app = express();
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: process.env.NODE_ENV === 'production' ? clientUrl : true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false });

  app.get('/api/health', (_req, res) => send(res, { status: 'healthy', mode: 'demo', timestamp: new Date().toISOString() }, 'Gatherly API is healthy'));

  app.post('/api/auth/login', authLimiter, async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const user = store.users.find((candidate) => candidate.email === input.email.toLowerCase());
      if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw apiError(401, 'Email or password is incorrect');
      return send(res, { token: signToken(user), user: cleanUser(user) }, 'Welcome back');
    } catch (error) {
      return next(error);
    }
  });

  app.post('/api/auth/register', authLimiter, async (req, res, next) => {
    try {
      const input = registerSchema.parse(req.body);
      if (store.users.some((user) => user.email === input.email.toLowerCase())) throw apiError(409, 'An account already exists for this email');
      const user = {
        id: 'usr-' + randomUUID(),
        name: input.name,
        email: input.email.toLowerCase(),
        role: 'attendee',
        avatar: input.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase(),
        passwordHash: await bcrypt.hash(input.password, 10)
      };
      store.users.push(user);
      return send(res, { token: signToken(user), user: cleanUser(user) }, 'Your Gatherly account is ready', 201);
    } catch (error) {
      return next(error);
    }
  });

  app.get('/api/auth/me', authMiddleware, (req, res) => send(res, { user: cleanUser(req.user) }));

  app.get('/api/events', (req, res) => {
    const query = String(req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || 'All');
    const city = String(req.query.city || 'All');
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);

    const filtered = store.events
      .filter((event) => ['published', 'sold-out'].includes(event.status))
      .filter((event) => category === 'All' || event.category === category)
      .filter((event) => city === 'All' || event.city === city)
      .filter((event) => !query || [event.title, event.description, event.venue, event.city, event.category].join(' ').toLowerCase().includes(query))
      .sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(a.startAt) - new Date(b.startAt));

    const start = (page - 1) * limit;
    return send(res, {
      events: filtered.slice(start, start + limit).map(eventView),
      pagination: { page, limit, total: filtered.length, pages: Math.max(Math.ceil(filtered.length / limit), 1) },
      categories: ['All', ...new Set(store.events.filter((event) => event.status === 'published').map((event) => event.category))],
      cities: ['All', ...new Set(store.events.filter((event) => event.status === 'published').map((event) => event.city))]
    });
  });

  app.get('/api/events/:id', (req, res, next) => {
    const event = store.events.find((candidate) => candidate.id === req.params.id && candidate.status !== 'draft');
    if (!event) return next(apiError(404, 'Event not found'));
    return send(res, eventView(event));
  });

  app.post('/api/events/:id/register', authMiddleware, allowRoles('attendee'), (req, res, next) => {
    const event = store.events.find((candidate) => candidate.id === req.params.id);
    if (!event || event.status === 'draft') return next(apiError(404, 'Event not found'));
    if (['cancelled', 'completed'].includes(event.status)) return next(apiError(409, 'Registration is closed for this event'));

    const existing = store.registrations.find((registration) => registration.eventId === event.id && registration.attendeeId === req.user.id && registration.status !== 'cancelled');
    if (existing) return next(apiError(409, 'You are already registered for this event'));

    const confirmedCount = store.registrations.filter((registration) => registration.eventId === event.id && ['confirmed', 'checked-in'].includes(registration.status)).length;
    const status = confirmedCount >= event.capacity ? 'waitlisted' : 'confirmed';
    const registration = {
      id: 'reg-' + randomUUID(),
      eventId: event.id,
      attendeeId: req.user.id,
      ticketCode: 'GTH-' + randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase(),
      status,
      registeredAt: new Date().toISOString()
    };

    store.registrations.push(registration);
    if (status === 'waitlisted') event.status = 'sold-out';
    return send(res, registration, status === 'waitlisted' ? 'The event is full, so you have joined the waitlist' : 'Your ticket is confirmed', 201);
  });

  app.delete('/api/events/:id/register', authMiddleware, allowRoles('attendee'), (req, res, next) => {
    const registration = store.registrations.find((candidate) => candidate.eventId === req.params.id && candidate.attendeeId === req.user.id && candidate.status !== 'cancelled');
    if (!registration) return next(apiError(404, 'Active registration not found'));
    if (registration.status === 'checked-in') return next(apiError(409, 'A checked-in ticket cannot be cancelled'));

    const previousStatus = registration.status;
    registration.status = 'cancelled';
    if (previousStatus === 'confirmed') {
      const nextWaitlisted = store.registrations.find((candidate) => candidate.eventId === req.params.id && candidate.status === 'waitlisted');
      if (nextWaitlisted) nextWaitlisted.status = 'confirmed';
    }
    return send(res, { registrationId: registration.id }, 'Registration cancelled');
  });

  app.get('/api/me/registrations', authMiddleware, allowRoles('attendee'), (req, res) => {
    const registrations = store.registrations
      .filter((registration) => registration.attendeeId === req.user.id)
      .map((registration) => ({ ...registration, event: eventView(store.events.find((event) => event.id === registration.eventId)) }))
      .sort((a, b) => new Date(a.event.startAt) - new Date(b.event.startAt));
    return send(res, { registrations });
  });

  app.get('/api/organizer/stats', authMiddleware, allowRoles('organizer'), (req, res) => {
    const events = store.events.filter((event) => event.organizerId === req.user.id);
    const eventIds = new Set(events.map((event) => event.id));
    const registrations = store.registrations.filter((registration) => eventIds.has(registration.eventId));
    const active = registrations.filter((registration) => registration.status !== 'cancelled');
    const revenue = active.filter((registration) => registration.status !== 'waitlisted').reduce((sum, registration) => {
      const event = events.find((candidate) => candidate.id === registration.eventId);
      return sum + (event?.price || 0);
    }, 0);

    return send(res, {
      totals: {
        events: events.length,
        registrations: active.length,
        checkedIn: active.filter((registration) => registration.status === 'checked-in').length,
        revenue
      },
      attendanceRate: active.length ? Math.round((active.filter((registration) => registration.status === 'checked-in').length / active.length) * 100) : 0,
      events: events.map(eventView)
    });
  });

  app.get('/api/organizer/events/:id/registrations', authMiddleware, allowRoles('organizer'), (req, res, next) => {
    const event = store.events.find((candidate) => candidate.id === req.params.id);
    if (!event || event.organizerId !== req.user.id) return next(apiError(404, 'Event not found'));
    const registrations = store.registrations
      .filter((registration) => registration.eventId === event.id)
      .map((registration) => {
        const attendee = store.users.find((user) => user.id === registration.attendeeId);
        return { ...registration, attendee: attendee ? cleanUser(attendee) : { name: 'Guest attendee', email: 'guest@gatherly.demo', avatar: 'GA' } };
      });
    return send(res, { event: eventView(event), registrations });
  });

  app.post('/api/organizer/events', authMiddleware, allowRoles('organizer'), (req, res, next) => {
    try {
      const input = eventSchema.parse(req.body);
      const event = { id: 'evt-' + randomUUID(), organizerId: req.user.id, organizerName: req.user.name, ...input };
      store.events.push(event);
      return send(res, eventView(event), 'Event created', 201);
    } catch (error) {
      return next(error);
    }
  });

  app.put('/api/organizer/events/:id', authMiddleware, allowRoles('organizer'), (req, res, next) => {
    try {
      const event = store.events.find((candidate) => candidate.id === req.params.id);
      if (!event || event.organizerId !== req.user.id) throw apiError(404, 'Event not found');
      Object.assign(event, eventSchema.parse(req.body));
      return send(res, eventView(event), 'Event updated');
    } catch (error) {
      return next(error);
    }
  });

  function checkIn(req, res, next) {
    const registration = store.registrations.find((candidate) => candidate.id === req.params.id || candidate.ticketCode.toLowerCase() === String(req.body.ticketCode || '').toLowerCase());
    if (!registration) return next(apiError(404, 'Ticket not found'));
    const event = store.events.find((candidate) => candidate.id === registration.eventId);
    if (req.user.role !== 'admin' && event?.organizerId !== req.user.id) return next(apiError(403, 'This ticket belongs to another organizer'));
    if (registration.status === 'checked-in') return next(apiError(409, 'This ticket has already been checked in'));
    if (registration.status !== 'confirmed') return next(apiError(409, 'Only confirmed tickets can be checked in'));

    registration.status = 'checked-in';
    const record = { id: 'chk-' + randomUUID(), registrationId: registration.id, checkedInAt: new Date().toISOString(), checkedInBy: req.user.id };
    store.checkIns.push(record);
    return send(res, { registration, event, checkIn: record }, 'Guest checked in');
  }

  app.post('/api/registrations/:id/checkin', authMiddleware, allowRoles('organizer', 'admin'), checkIn);
  app.post('/api/registrations/checkin', authMiddleware, allowRoles('organizer', 'admin'), checkIn);

  app.get('/api/admin/overview', authMiddleware, allowRoles('admin'), (_req, res) => {
    const activeRegistrations = store.registrations.filter((registration) => registration.status !== 'cancelled');
    return send(res, {
      totals: {
        users: store.users.length,
        organizers: store.users.filter((user) => user.role === 'organizer').length,
        events: store.events.length,
        registrations: activeRegistrations.length
      },
      events: store.events.map(eventView),
      users: store.users.map(cleanUser),
      activity: [
        { id: 'act-1', label: 'Future of AI Summit was published', time: '12 minutes ago', tone: 'success' },
        { id: 'act-2', label: 'New organizer verification pending', time: '48 minutes ago', tone: 'warning' },
        { id: 'act-3', label: 'Afterglow reached 80% capacity', time: '2 hours ago', tone: 'info' }
      ]
    });
  });

  app.patch('/api/admin/events/:id/status', authMiddleware, allowRoles('admin'), (req, res, next) => {
    const statusSchema = z.object({ status: z.enum(['draft', 'published', 'sold-out', 'completed', 'cancelled']) });
    try {
      const { status } = statusSchema.parse(req.body);
      const event = store.events.find((candidate) => candidate.id === req.params.id);
      if (!event) throw apiError(404, 'Event not found');
      event.status = status;
      return send(res, eventView(event), 'Event status updated');
    } catch (error) {
      return next(error);
    }
  });

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const clientDist = path.resolve(currentDir, '../../client/dist');
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  app.use((req, _res, next) => next(apiError(404, 'Route not found')));
  app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Please review the highlighted fields',
        errors: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
      });
    }

    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: status === 500 && process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
      errors: error.details || []
    });
  });

  return app;
}
