const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || '*')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
const rateLimitStore = new Map();
const metrics = {
  startedAt: new Date().toISOString(),
  requests: 0,
  errors5xx: 0,
  byRoute: {},
  latenciesMs: []
};

function percentile(values, pct) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((pct / 100) * sorted.length) - 1);
  return sorted[index];
}

async function notifySlack(message) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || typeof fetch !== 'function') return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });
  } catch (err) {
    console.error('Slack notification failed:', err.message);
  }
}

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS.'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '15mb' }));
app.use(morgan('dev'));
app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    const routeKey = `${req.method} ${req.route?.path || req.path}`;
    metrics.requests += 1;
    metrics.latenciesMs.push(duration);
    if (metrics.latenciesMs.length > 1000) metrics.latenciesMs.shift();

    if (!metrics.byRoute[routeKey]) {
      metrics.byRoute[routeKey] = { count: 0, errors5xx: 0, totalLatencyMs: 0 };
    }
    metrics.byRoute[routeKey].count += 1;
    metrics.byRoute[routeKey].totalLatencyMs += duration;

    if (res.statusCode >= 500) {
      metrics.errors5xx += 1;
      metrics.byRoute[routeKey].errors5xx += 1;
      notifySlack(`Portal do Aluno API error ${res.statusCode} on ${routeKey}`).catch(() => {});
    }
  });
  next();
});
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(), microphone=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'unsafe-inline';");
  }
  next();
});
app.use((req, res, next) => {
  const now = Date.now();
  const key = `${req.ip}:${req.path}`;
  const current = rateLimitStore.get(key);

  if (!current || now - current.startedAt > rateLimitWindowMs) {
    rateLimitStore.set(key, { count: 1, startedAt: now });
    return next();
  }

  current.count += 1;
  if (current.count > rateLimitMax) {
    return res.status(429).json({ error: 'Too many requests. Please try again soon.' });
  }

  next();
});

// Routes import
const userRoutes = require('./src/routes/user');
const bolsasRoutes = require('./src/routes/bolsas');
const homeRoutes = require('./src/routes/home');
const configRoutes = require('./src/routes/config');
const deadlinesRoutes = require('./src/routes/deadlines');
const applicationsRoutes = require('./src/routes/applications');
const { router: alertsRoutes, syncAlerts } = require('./src/routes/alerts');
const notificationsRoutes = require('./src/routes/notifications');
const faqRoutes = require('./src/routes/faq');
const comparatorRoutes = require('./src/routes/comparator');
const aiRoutes = require('./src/routes/ai');
const vocationalRoutes = require('./src/routes/vocational');
const quizRoutes = require('./src/routes/quiz');
const communityRoutes = require('./src/routes/community');
const eventsRoutes = require('./src/routes/events');
const contentRoutes = require('./src/routes/content');
const achievementsRoutes = require('./src/routes/achievements');
const activityRoutes = require('./src/routes/activity');
const renewalRoutes = require('./src/routes/renewal');
const universitiesRoutes = require('./src/routes/universities');
const telemetryRoutes = require('./src/routes/telemetry');
const integrationsRoutes = require('./src/routes/integrations');
const npsRoutes = require('./src/routes/nps');

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/metrics', (req, res) => {
  const routeStats = Object.fromEntries(
    Object.entries(metrics.byRoute).map(([route, value]) => [
      route,
      {
        ...value,
        avgLatencyMs: value.count ? Math.round(value.totalLatencyMs / value.count) : 0
      }
    ])
  );

  res.json({
    startedAt: metrics.startedAt,
    uptime: process.uptime(),
    requests: metrics.requests,
    errors5xx: metrics.errors5xx,
    errorRate: metrics.requests ? metrics.errors5xx / metrics.requests : 0,
    latency: {
      p50Ms: percentile(metrics.latenciesMs, 50),
      p95Ms: percentile(metrics.latenciesMs, 95),
      p99Ms: percentile(metrics.latenciesMs, 99)
    },
    routes: routeStats
  });
});

// Mount routers
app.use('/api/user', userRoutes);
app.use('/api/bolsas', bolsasRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/config', configRoutes);
app.use('/api/deadlines', deadlinesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/faq', faqRoutes);
app.use('/api/comparator', comparatorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/vocational', vocationalRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/renewal', renewalRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/integrations', integrationsRoutes);
app.use('/api/nps', npsRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

function startServer() {
  return app.listen(PORT, () => {
  console.log(`Portal do Aluno API Server listening on port ${PORT}`);
  
  // Start the background sync alerts job (every 5 minutes)
  setInterval(() => {
    syncAlerts().catch(err => console.error('Background syncAlerts error:', err));
  }, 5 * 60 * 1000);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
