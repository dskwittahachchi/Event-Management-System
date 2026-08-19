import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Compass,
  Filter,
  Heart,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Music2,
  Plus,
  QrCode,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  WandSparkles,
  X,
  Zap
} from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';

const AuthContext = createContext(null);
const ToastContext = createContext(null);

const demoAccounts = {
  attendee: { email: 'attendee@gatherly.demo', password: 'demo123', label: 'Explore as attendee', icon: Ticket },
  organizer: { email: 'organizer@gatherly.demo', password: 'demo123', label: 'Open organizer studio', icon: BarChart3 },
  admin: { email: 'admin@gatherly.demo', password: 'demo123', label: 'Review as admin', icon: ShieldCheck }
};

const categoryIcons = {
  All: Compass,
  Technology: Zap,
  Music: Music2,
  Design: WandSparkles,
  Wellness: Sparkles,
  Community: Users,
  Business: BarChart3
};

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = 'Bearer ' + options.token;

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({ success: false, message: 'The server returned an unreadable response' }));
  if (!response.ok) {
    const error = new Error(payload.message || 'Something went wrong');
    error.details = payload.errors || [];
    throw error;
  }
  return payload;
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('gatherly-session')) || null;
    } catch {
      return null;
    }
  });

  function persist(nextSession) {
    setSession(nextSession);
    if (nextSession) localStorage.setItem('gatherly-session', JSON.stringify(nextSession));
    else localStorage.removeItem('gatherly-session');
  }

  async function login(email, password) {
    const response = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    persist(response.data);
    return response.data;
  }

  async function register(input) {
    const response = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
    persist(response.data);
    return response.data;
  }

  async function demoLogin(role) {
    const account = demoAccounts[role];
    return login(account.email, account.password);
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user || null, token: session?.token || '', login, register, demoLogin, logout: () => persist(null) }}>
      {children}
    </AuthContext.Provider>
  );
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  function notify(message, tone = 'success') {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div className={'toast toast-' + toast.tone} key={toast.id}>
            {toast.tone === 'success' ? <CheckCircle2 size={18} /> : <Sparkles size={18} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

function useToast() {
  return useContext(ToastContext);
}

function Brand({ compact = false }) {
  return (
    <Link className="brand" to="/" aria-label="Gatherly home">
      <span className="brand-mark"><span /></span>
      {!compact && <span>gatherly</span>}
    </Link>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Brand />
        <nav className={open ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
          <Link to="/">Discover</Link>
          {user?.role === 'attendee' && <Link to="/my-tickets">My tickets</Link>}
          {user?.role === 'organizer' && <Link to="/organizer">Organizer studio</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin console</Link>}
          <Link to="/organizer/events/new">Create event</Link>
        </nav>
        <div className="nav-actions">
          {user ? (
            <div className="user-cluster">
              <span className="role-chip">{user.role}</span>
              <span className="avatar" title={user.name}>{user.avatar}</span>
              <button className="icon-button logout-button" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
            </div>
          ) : (
            <>
              <Link className="text-button" to="/login">Sign in</Link>
              <Link className="button button-small button-dark" to="/login?mode=register">Join Gatherly</Link>
            </>
          )}
          <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            {open ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div>
          <Brand />
          <p>Thoughtful tools for memorable gatherings.</p>
        </div>
        <div className="footer-links">
          <div><strong>Explore</strong><Link to="/">Discover</Link><Link to="/my-tickets">My tickets</Link></div>
          <div><strong>Create</strong><Link to="/organizer">Organizer studio</Link><Link to="/organizer/events/new">Host an event</Link></div>
          <div><strong>Platform</strong><Link to="/login">Demo access</Link><a href="mailto:hello@gatherly.demo">Contact</a></div>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Gatherly</span>
        <span>Built for people who bring people together.</span>
      </div>
    </footer>
  );
}

function Layout({ children, dark = false }) {
  return (
    <div className={dark ? 'app-shell app-shell-dark' : 'app-shell'}>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function StatusBadge({ status }) {
  const label = String(status || '').replace('-', ' ');
  return <span className={'status-badge status-' + status}>{label}</span>;
}

function EventArt({ event, large = false }) {
  return (
    <div className={'event-art tone-' + event.imageTone + (large ? ' event-art-large' : '')}>
      <div className="art-orb art-orb-one" />
      <div className="art-orb art-orb-two" />
      <div className="art-grid" />
      <span className="art-category">{event.category}</span>
      <span className="art-index">{String(event.title).slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

function formatMoney(value) {
  return Number(value) === 0 ? 'Free' : '$' + Number(value).toLocaleString();
}

function EventCard({ event }) {
  const [liked, setLiked] = useState(false);
  return (
    <article className="event-card">
      <Link to={'/events/' + event.id} className="event-card-art">
        <EventArt event={event} />
      </Link>
      <button className={liked ? 'heart-button heart-active' : 'heart-button'} onClick={() => setLiked((value) => !value)} aria-label={liked ? 'Remove from saved events' : 'Save event'}>
        <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <div className="event-card-body">
        <div className="event-meta-row">
          <span>{formatDate(event.startAt)}</span>
          <span className="dot" />
          <span>{formatTime(event.startAt)}</span>
        </div>
        <Link to={'/events/' + event.id}><h3>{event.title}</h3></Link>
        <p className="event-location"><MapPin size={15} /> {event.venue}, {event.city}</p>
        <div className="event-card-foot">
          <strong>{formatMoney(event.price)}</strong>
          <span>{event.seatsLeft} spots left</span>
        </div>
      </div>
    </article>
  );
}

function SkeletonCards() {
  return (
    <div className="event-grid">
      {[1, 2, 3].map((item) => <div className="event-card skeleton-card" key={item}><div className="skeleton-block" /><div className="skeleton-lines"><span /><span /><span /></div></div>)}
    </div>
  );
}

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Search size={24} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

function HomePage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [cities, setCities] = useState(['All']);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [city, setCity] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ q: query, category, city });
        const response = await api('/api/events?' + params);
        setEvents(response.data.events);
        setCategories(response.data.categories);
        setCities(response.data.cities);
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [query, category, city]);

  function scrollToEvents() {
    document.getElementById('discover')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <Layout>
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <span className="eyebrow eyebrow-light"><Sparkles size={15} /> Your next good story starts here</span>
          <h1>Make plans<br />worth <em>keeping.</em></h1>
          <p>Discover remarkable events, meet your people, and turn an ordinary week into something you will remember.</p>
          <div className="hero-actions">
            <button className="button button-coral" onClick={scrollToEvents}>Explore events <ArrowRight size={18} /></button>
            <Link className="button button-ghost-light" to="/organizer/events/new">Host your own</Link>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack"><span>MA</span><span>JK</span><span>RS</span><span>+</span></div>
            <div><strong>12,000+</strong><span>plans made this month</span></div>
          </div>
        </div>
        <div className="hero-date-card">
          <span>Sep</span>
          <strong>19</strong>
          <p>Afterglow<br />Rooftop Sessions</p>
          <ArrowRight size={18} />
        </div>
      </section>

      <section className="search-wrap">
        <div className="search-panel">
          <label className="search-main"><Search size={21} /><span><small>What</small><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, topics, venues…" /></span></label>
          <label><MapPin size={20} /><span><small>Where</small><select value={city} onChange={(event) => setCity(event.target.value)}>{cities.map((option) => <option key={option}>{option}</option>)}</select></span><ChevronDown size={16} /></label>
          <label><CalendarDays size={20} /><span><small>When</small><select aria-label="Date range"><option>Any date</option><option>This month</option><option>Next month</option></select></span><ChevronDown size={16} /></label>
          <button className="button button-dark search-submit" onClick={scrollToEvents}>Find events</button>
        </div>
      </section>

      <section className="section-shell category-section">
        <div className="category-list" aria-label="Event categories">
          {categories.map((item) => {
            const Icon = categoryIcons[item] || Sparkles;
            return (
              <button className={category === item ? 'category-pill category-active' : 'category-pill'} key={item} onClick={() => setCategory(item)}>
                <Icon size={17} /> {item}
              </button>
            );
          })}
        </div>
      </section>

      <section className="section-shell discover-section" id="discover">
        <div className="section-heading">
          <div><span className="eyebrow">Curated for curious people</span><h2>Events worth leaving<br />the house for.</h2></div>
          <div className="section-side"><p>From ambitious ideas to unforgettable nights, there is always something happening.</p><button className="filter-button"><Filter size={17} /> Filters</button></div>
        </div>

        {error && <div className="alert">{error}</div>}
        {loading ? <SkeletonCards /> : events.length ? (
          <div className="event-grid">{events.map((event) => <EventCard event={event} key={event.id} />)}</div>
        ) : (
          <EmptyState title="No events match that search" description="Try another city, category, or a broader search phrase." action={<button className="button button-dark" onClick={() => { setQuery(''); setCategory('All'); setCity('All'); }}>Clear filters</button>} />
        )}
      </section>

      <section className="host-banner">
        <div className="host-copy">
          <span className="eyebrow eyebrow-light">Built for brilliant hosts</span>
          <h2>Your event deserves<br />a full house.</h2>
          <p>Create a beautiful page, manage every guest, and understand what worked—all from one calm workspace.</p>
          <Link className="button button-cream" to="/organizer">Meet the organizer studio <ArrowRight size={18} /></Link>
        </div>
        <div className="host-dashboard-preview">
          <div className="preview-top"><span><Brand compact /> Event performance</span><small>Last 30 days</small></div>
          <div className="preview-metrics"><div><small>Registrations</small><strong>1,248</strong><em>+18.4%</em></div><div><small>Attendance</small><strong>87%</strong><em>+4.2%</em></div></div>
          <div className="preview-chart">{[38, 46, 42, 62, 58, 76, 88, 82, 96, 91, 110, 124].map((height, index) => <span key={index} style={{ height: height / 1.4 }} />)}</div>
        </div>
      </section>

      <section className="section-shell trust-strip">
        <p>Made for gatherings of every kind</p>
        <div><span>FIELD NOTES</span><span>MONO CLUB</span><span>NORTH/STAR</span><span>STUDIO NINE</span><span>COMMON GROUND</span></div>
      </section>
    </Layout>
  );
}

function EventDetailsPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api('/api/events/' + id)
      .then((response) => setEvent(response.data))
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [id, notify]);

  async function registerForEvent() {
    if (!user) return navigate('/login', { state: { from: '/events/' + id } });
    if (user.role !== 'attendee') return notify('Switch to the attendee demo to reserve a ticket', 'info');
    setSubmitting(true);
    try {
      const response = await api('/api/events/' + id + '/register', { method: 'POST', token });
      notify(response.message);
      navigate('/my-tickets');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <Layout><div className="page-loading"><span /></div></Layout>;
  if (!event) return <Layout><EmptyState title="Event not found" description="This event may have been removed or is not public yet." action={<Link className="button button-dark" to="/">Browse events</Link>} /></Layout>;

  const filled = Math.min(Math.round((event.registeredCount / event.capacity) * 100), 100);

  return (
    <Layout>
      <section className="detail-hero section-shell">
        <div className="detail-art"><EventArt event={event} large /></div>
        <div className="detail-heading">
          <span className="eyebrow">{event.category} · {event.city}</span>
          <h1>{event.title}</h1>
          <p>{event.description}</p>
          <div className="detail-organizer"><span className="avatar">GS</span><div><small>Hosted by</small><strong>{event.organizerName}</strong></div><ShieldCheck size={18} /></div>
        </div>
      </section>
      <section className="section-shell detail-layout">
        <div className="detail-content">
          <div className="content-block"><h2>About this event</h2><p>{event.description}</p><p>Come ready to learn, connect, and leave with a few new ideas—and a few new names in your contacts.</p></div>
          <div className="content-block"><h2>What to expect</h2><div className="expect-grid"><span><Sparkles /> Thoughtful programming</span><span><Users /> A welcoming crowd</span><span><Music2 /> Excellent atmosphere</span><span><CheckCircle2 /> Seamless check-in</span></div></div>
          <div className="content-block"><h2>Venue</h2><div className="venue-card"><div className="venue-map"><MapPin /></div><div><strong>{event.venue}</strong><p>{event.city}, Sri Lanka</p><a href={'https://maps.google.com/?q=' + encodeURIComponent(event.venue + ' ' + event.city)} target="_blank" rel="noreferrer">Open in maps <ArrowRight size={15} /></a></div></div></div>
        </div>
        <aside className="ticket-panel">
          <StatusBadge status={event.status} />
          <strong className="ticket-price">{formatMoney(event.price)}</strong>
          <div className="ticket-detail"><CalendarDays /><span><strong>{formatDate(event.startAt)}</strong><small>{formatTime(event.startAt)} – {formatTime(event.endAt)}</small></span></div>
          <div className="ticket-detail"><MapPin /><span><strong>{event.venue}</strong><small>{event.city}</small></span></div>
          <div className="capacity-line"><span><Users size={16} /> {event.seatsLeft} spots remaining</span><span>{filled}% filled</span></div>
          <div className="progress-track"><span style={{ width: filled + '%' }} /></div>
          <button className="button button-coral button-full" disabled={submitting} onClick={registerForEvent}>{submitting ? 'Reserving…' : 'Reserve your spot'} <ArrowRight size={18} /></button>
          <p className="secure-note"><ShieldCheck size={15} /> Secure registration · Easy cancellation</p>
        </aside>
      </section>
    </Layout>
  );
}

function LoginPage() {
  const params = new URLSearchParams(useLocation().search);
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');
  const { login, register, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading('form');
    try {
      if (mode === 'login') await login(form.email, form.password);
      else await register(form);
      navigate(location.state?.from || '/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading('');
    }
  }

  async function handleDemo(role) {
    setError('');
    setLoading(role);
    try {
      await demoLogin(role);
      navigate(role === 'organizer' ? '/organizer' : role === 'admin' ? '/admin' : '/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading('');
    }
  }

  return (
    <Layout dark>
      <section className="auth-page">
        <div className="auth-story">
          <span className="eyebrow eyebrow-light">A better way to gather</span>
          <h1>Good things happen<br />when people <em>show up.</em></h1>
          <p>One account for the events you love and the ones you are ready to create.</p>
          <div className="auth-quote"><p>“The rare event tool that feels as thoughtful as the gathering itself.”</p><span>— Mina, community director</span></div>
        </div>
        <div className="auth-card">
          <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button></div>
          <div className="auth-card-heading"><h2>{mode === 'login' ? 'Welcome back' : 'Join the gathering'}</h2><p>{mode === 'login' ? 'Pick up where you left off.' : 'Find your next plan in a few clicks.'}</p></div>
          {error && <div className="alert">{error}</div>}
          <form className="form-stack" onSubmit={handleSubmit}>
            {mode === 'register' && <label>Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Your name" /></label>}
            <label>Email address<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label>
            <label>Password<input required type="password" minLength={mode === 'register' ? 8 : 6} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="••••••••" /></label>
            <button className="button button-dark button-full" disabled={loading === 'form'}>{loading === 'form' ? 'Just a moment…' : mode === 'login' ? 'Sign in' : 'Create my account'} <ArrowRight size={18} /></button>
          </form>
          <div className="or-divider"><span>or explore the complete demo</span></div>
          <div className="demo-buttons">
            {Object.entries(demoAccounts).map(([role, account]) => {
              const Icon = account.icon;
              return <button key={role} onClick={() => handleDemo(role)} disabled={Boolean(loading)}><Icon size={18} /><span><strong>{account.label}</strong><small>{account.email}</small></span><ArrowRight size={16} /></button>;
            })}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function RoleGate({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'organizer' ? '/organizer' : '/'} replace />;
  return children;
}

function MyTicketsPage() {
  const { token } = useAuth();
  const notify = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const response = await api('/api/me/registrations', { token });
      setRegistrations(response.data.registrations);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function cancel(eventId) {
    if (!window.confirm('Cancel this registration? Your spot may be offered to someone on the waitlist.')) return;
    try {
      const response = await api('/api/events/' + eventId + '/register', { method: 'DELETE', token });
      notify(response.message);
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  return (
    <Layout>
      <section className="page-header section-shell">
        <span className="eyebrow">Your plans</span>
        <h1>Tickets & registrations</h1>
        <p>Everything you need for what is coming up.</p>
      </section>
      <section className="section-shell tickets-layout">
        {loading ? <div className="page-loading"><span /></div> : registrations.length ? registrations.map((registration) => (
          <article className="ticket-card" key={registration.id}>
            <div className="ticket-mini-art"><EventArt event={registration.event} /></div>
            <div className="ticket-card-main">
              <div><StatusBadge status={registration.status} /><span className="ticket-date">{formatDate(registration.event.startAt)}</span></div>
              <h2>{registration.event.title}</h2>
              <p><MapPin size={16} /> {registration.event.venue}, {registration.event.city}</p>
              <p><Clock3 size={16} /> {formatTime(registration.event.startAt)}</p>
              <div className="ticket-actions"><Link className="button button-dark button-small" to={'/events/' + registration.event.id}>Event details</Link>{!['cancelled', 'checked-in'].includes(registration.status) && <button className="text-button danger-text" onClick={() => cancel(registration.event.id)}>Cancel ticket</button>}</div>
            </div>
            <div className="ticket-code">
              <QrCode size={74} strokeWidth={1.3} />
              <strong>{registration.ticketCode}</strong>
              <small>Present at check-in</small>
            </div>
          </article>
        )) : <EmptyState title="No tickets yet" description="When you register for an event, your ticket will appear right here." action={<Link className="button button-dark" to="/">Find an event</Link>} />}
      </section>
    </Layout>
  );
}

function DashboardShell({ title, eyebrow, actions, children }) {
  const { user } = useAuth();
  return (
    <Layout>
      <section className="dashboard-page">
        <aside className="dashboard-sidebar">
          <Brand compact />
          <nav>
            <Link className="active" to={user.role === 'admin' ? '/admin' : '/organizer'}><LayoutDashboard /> Overview</Link>
            {user.role === 'organizer' && <><Link to="/organizer/events/new"><CalendarDays /> Events</Link><Link to="/organizer/check-in"><ScanLine /> Check-in</Link><Link to="/organizer"><Users /> Audience</Link><Link to="/organizer"><BarChart3 /> Analytics</Link></>}
            {user.role === 'admin' && <><Link to="/admin"><Users /> Users</Link><Link to="/admin"><CalendarDays /> Events</Link><Link to="/admin"><ShieldCheck /> Moderation</Link></>}
          </nav>
          <div className="sidebar-profile"><span className="avatar">{user.avatar}</span><div><strong>{user.name}</strong><small>{user.role}</small></div></div>
        </aside>
        <div className="dashboard-main">
          <div className="dashboard-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div><div>{actions}</div></div>
          {children}
        </div>
      </section>
    </Layout>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }) {
  return <article className={'metric-card metric-' + tone}><span className="metric-icon"><Icon /></span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></article>;
}

function OrganizerDashboard() {
  const { token } = useAuth();
  const notify = useToast();
  const [data, setData] = useState(null);
  const [attendees, setAttendees] = useState([]);

  useEffect(() => {
    api('/api/organizer/stats', { token })
      .then(async (response) => {
        setData(response.data);
        if (response.data.events[0]) {
          const registrations = await api('/api/organizer/events/' + response.data.events[0].id + '/registrations', { token });
          setAttendees(registrations.data.registrations);
        }
      })
      .catch((error) => notify(error.message, 'error'));
  }, [token, notify]);

  if (!data) return <DashboardShell title="Organizer studio" eyebrow="Loading your workspace"><div className="page-loading"><span /></div></DashboardShell>;

  return (
    <DashboardShell title="Good afternoon, Alex." eyebrow="Organizer studio" actions={<><Link className="button button-dark button-small" to="/organizer/events/new"><Plus size={17} /> New event</Link><Link className="button button-outline button-small" to="/organizer/check-in"><ScanLine size={17} /> Check in</Link></>}>
      <div className="metric-grid">
        <MetricCard icon={CalendarDays} label="Live events" value={data.totals.events} detail="1 draft in progress" tone="violet" />
        <MetricCard icon={Users} label="Registrations" value={data.totals.registrations.toLocaleString()} detail="+18.4% this month" tone="mint" />
        <MetricCard icon={CheckCircle2} label="Checked in" value={data.totals.checkedIn} detail={data.attendanceRate + '% attendance'} tone="blue" />
        <MetricCard icon={CircleDollarSign} label="Revenue" value={'$' + data.totals.revenue.toLocaleString()} detail="+12.8% this month" tone="coral" />
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-panel analytics-panel">
          <div className="panel-heading"><div><h2>Registration momentum</h2><p>Across all published events</p></div><select><option>Last 30 days</option></select></div>
          <div className="chart-area">
            <div className="chart-labels"><span>120</span><span>80</span><span>40</span><span>0</span></div>
            <div className="bar-chart">{[35, 48, 43, 61, 55, 74, 69, 86, 92, 83, 104, 116].map((height, index) => <span key={index} style={{ height: height + 'px' }}><i /></span>)}</div>
          </div>
          <div className="chart-months"><span>Aug 01</span><span>Aug 08</span><span>Aug 15</span><span>Aug 22</span><span>Today</span></div>
        </section>
        <section className="dashboard-panel upcoming-panel">
          <div className="panel-heading"><div><h2>Upcoming events</h2><p>Your next moments</p></div><Link to="/organizer/events/new">View all</Link></div>
          <div className="upcoming-list">{data.events.slice(0, 3).map((event) => <Link to={'/events/' + event.id} key={event.id}><span className={'event-dot tone-' + event.imageTone} /><div><strong>{event.title}</strong><small>{formatDate(event.startAt)} · {event.registeredCount}/{event.capacity}</small></div><ArrowRight size={16} /></Link>)}</div>
        </section>
      </div>
      <section className="dashboard-panel table-panel">
        <div className="panel-heading"><div><h2>Recent registrations</h2><p>For {data.events[0]?.title || 'your events'}</p></div><button className="button button-outline button-small">Export CSV</button></div>
        <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Attendee</th><th>Ticket</th><th>Registered</th><th>Status</th></tr></thead><tbody>{attendees.length ? attendees.map((registration) => <tr key={registration.id}><td><span className="table-person"><span className="avatar">{registration.attendee.avatar}</span><span><strong>{registration.attendee.name}</strong><small>{registration.attendee.email}</small></span></span></td><td className="mono">{registration.ticketCode}</td><td>{formatDate(registration.registeredAt)}</td><td><StatusBadge status={registration.status} /></td></tr>) : <tr><td colSpan="4">No registrations for this event yet.</td></tr>}</tbody></table></div>
      </section>
    </DashboardShell>
  );
}

function EventFormPage() {
  const { user, token } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Technology',
    venue: '',
    city: 'Colombo',
    startAt: '2026-10-30T09:00',
    endAt: '2026-10-30T17:00',
    capacity: 120,
    price: 0,
    status: 'draft',
    imageTone: 'violet',
    featured: false
  });

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'organizer') return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, startAt: new Date(form.startAt).toISOString(), endAt: new Date(form.endAt).toISOString(), capacity: Number(form.capacity), price: Number(form.price) };
      const response = await api('/api/organizer/events', { method: 'POST', token, body: JSON.stringify(payload) });
      notify(response.message);
      navigate('/organizer');
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <section className="form-page section-shell">
        <div className="form-page-heading"><span className="eyebrow">Organizer studio</span><h1>Create something<br />people remember.</h1><p>Start with the essentials. You can refine and publish when it feels right.</p></div>
        <form className="event-form" onSubmit={submit}>
          <div className="form-section"><span className="form-number">01</span><div><h2>The big idea</h2><p>Give people a clear reason to show up.</p></div></div>
          <label className="field-full">Event title<input required name="title" value={form.title} onChange={change} placeholder="e.g. Creative Futures Forum" /></label>
          <label className="field-full">Description<textarea required minLength="20" name="description" value={form.description} onChange={change} rows="5" placeholder="What makes this gathering special? What can guests expect?" /></label>
          <div className="field-grid"><label>Category<select name="category" value={form.category} onChange={change}>{['Technology', 'Music', 'Design', 'Wellness', 'Community', 'Business'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Visual theme<select name="imageTone" value={form.imageTone} onChange={change}>{['violet', 'electric', 'coral', 'mint', 'sun', 'blue'].map((item) => <option key={item}>{item}</option>)}</select></label></div>
          <div className="form-section"><span className="form-number">02</span><div><h2>Time & place</h2><p>Make the practical details effortless.</p></div></div>
          <div className="field-grid"><label>Starts<input required type="datetime-local" name="startAt" value={form.startAt} onChange={change} /></label><label>Ends<input required type="datetime-local" name="endAt" value={form.endAt} onChange={change} /></label></div>
          <div className="field-grid"><label>Venue<input required name="venue" value={form.venue} onChange={change} placeholder="The place or building" /></label><label>City<input required name="city" value={form.city} onChange={change} /></label></div>
          <div className="form-section"><span className="form-number">03</span><div><h2>Capacity & access</h2><p>Set the size, price, and visibility.</p></div></div>
          <div className="field-grid field-grid-three"><label>Capacity<input required type="number" min="1" name="capacity" value={form.capacity} onChange={change} /></label><label>Price (USD)<input required type="number" min="0" name="price" value={form.price} onChange={change} /></label><label>Status<select name="status" value={form.status} onChange={change}><option value="draft">Save as draft</option><option value="published">Publish now</option></select></label></div>
          <div className="form-actions"><Link className="text-button" to="/organizer">Cancel</Link><button className="button button-dark" disabled={submitting}>{submitting ? 'Creating…' : form.status === 'published' ? 'Create & publish' : 'Save draft'} <ArrowRight size={18} /></button></div>
        </form>
      </section>
    </Layout>
  );
}

function CheckInPage() {
  const { token } = useAuth();
  const notify = useToast();
  const [ticketCode, setTicketCode] = useState('GTH-ROOF-241');
  const [result, setResult] = useState(null);
  const [checking, setChecking] = useState(false);

  async function checkIn(event) {
    event.preventDefault();
    setChecking(true);
    setResult(null);
    try {
      const response = await api('/api/registrations/checkin', { method: 'POST', token, body: JSON.stringify({ ticketCode }) });
      setResult(response.data);
      notify(response.message);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setChecking(false);
    }
  }

  return (
    <DashboardShell title="Guest check-in" eyebrow="Live operations" actions={<Link className="button button-outline button-small" to="/organizer">Back to dashboard</Link>}>
      <div className="checkin-layout">
        <section className="dashboard-panel checkin-panel">
          <span className="scan-icon"><ScanLine size={36} /></span>
          <h2>Scan or enter a ticket</h2>
          <p>Use a guest’s unique Gatherly code to verify admission instantly.</p>
          <form onSubmit={checkIn}><label>Ticket code<div className="ticket-input"><QrCode size={20} /><input value={ticketCode} onChange={(event) => setTicketCode(event.target.value)} placeholder="GTH-XXXX-000" /><button className="button button-coral" disabled={checking}>{checking ? 'Checking…' : 'Check in'}</button></div></label></form>
          <small className="demo-hint">Demo code: GTH-ROOF-241</small>
        </section>
        <section className="dashboard-panel checkin-result">
          {result ? <><span className="success-ring"><Check size={34} /></span><span className="eyebrow">Admission approved</span><h2>{result.event.title}</h2><p>{result.registration.ticketCode}</p><div><CalendarDays size={17} /> Checked in at {formatTime(result.checkIn.checkedInAt)}</div></> : <><span className="empty-icon"><Ticket size={24} /></span><h2>Ready for the next guest</h2><p>A verified guest record will appear here.</p></>}
        </section>
      </div>
    </DashboardShell>
  );
}

function AdminDashboard() {
  const { token } = useAuth();
  const notify = useToast();
  const [data, setData] = useState(null);

  async function load() {
    try {
      const response = await api('/api/admin/overview', { token });
      setData(response.data);
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  useEffect(() => { load(); }, [token]);

  async function updateStatus(eventId, status) {
    try {
      const response = await api('/api/admin/events/' + eventId + '/status', { method: 'PATCH', token, body: JSON.stringify({ status }) });
      notify(response.message);
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  if (!data) return <DashboardShell title="Platform overview" eyebrow="Admin console"><div className="page-loading"><span /></div></DashboardShell>;

  return (
    <DashboardShell title="Platform overview" eyebrow="Admin console" actions={<button className="button button-dark button-small"><ShieldCheck size={17} /> Review queue</button>}>
      <div className="metric-grid">
        <MetricCard icon={Users} label="Total users" value={data.totals.users} detail="+12 this week" tone="violet" />
        <MetricCard icon={WandSparkles} label="Organizers" value={data.totals.organizers} detail="1 pending review" tone="mint" />
        <MetricCard icon={CalendarDays} label="All events" value={data.totals.events} detail="Across 4 categories" tone="blue" />
        <MetricCard icon={Ticket} label="Registrations" value={data.totals.registrations} detail="98.2% successful" tone="coral" />
      </div>
      <div className="dashboard-grid admin-grid">
        <section className="dashboard-panel table-panel">
          <div className="panel-heading"><div><h2>Event moderation</h2><p>Review publishing status and platform quality.</p></div><span className="role-chip">{data.events.length} total</span></div>
          <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Event</th><th>Organizer</th><th>Status</th><th>Action</th></tr></thead><tbody>{data.events.map((event) => <tr key={event.id}><td><strong>{event.title}</strong><small>{formatDate(event.startAt)} · {event.city}</small></td><td>{event.organizerName}</td><td><StatusBadge status={event.status} /></td><td><select aria-label={'Update ' + event.title + ' status'} value={event.status} onChange={(changeEvent) => updateStatus(event.id, changeEvent.target.value)}>{['draft', 'published', 'sold-out', 'completed', 'cancelled'].map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div>
        </section>
        <section className="dashboard-panel activity-panel">
          <div className="panel-heading"><div><h2>Platform activity</h2><p>What needs your attention</p></div></div>
          <div className="activity-list">{data.activity.map((item) => <div key={item.id}><span className={'activity-dot activity-' + item.tone} /><div><strong>{item.label}</strong><small>{item.time}</small></div></div>)}</div>
        </section>
      </div>
    </DashboardShell>
  );
}

function NotFoundPage() {
  return <Layout><section className="not-found section-shell"><strong>404</strong><h1>This plan took a detour.</h1><p>The page you are looking for is not here, but the next great event might be.</p><Link className="button button-dark" to="/">Back to discovery</Link></section></Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/my-tickets" element={<RoleGate roles={['attendee']}><MyTicketsPage /></RoleGate>} />
          <Route path="/organizer" element={<RoleGate roles={['organizer']}><OrganizerDashboard /></RoleGate>} />
          <Route path="/organizer/events/new" element={<EventFormPage />} />
          <Route path="/organizer/check-in" element={<RoleGate roles={['organizer']}><CheckInPage /></RoleGate>} />
          <Route path="/admin" element={<RoleGate roles={['admin']}><AdminDashboard /></RoleGate>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
