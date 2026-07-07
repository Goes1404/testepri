const express = require('express');
const { z } = require('zod');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const telemetryEvents = [];
const telemetryErrors = [];

const eventSchema = z.object({
  event: z.string().min(1).max(120),
  properties: z.record(z.any()).optional().default({})
});

const errorSchema = z.object({
  message: z.string().min(1).max(500),
  stack: z.string().max(5000).optional(),
  source: z.string().max(120).optional(),
  properties: z.record(z.any()).optional().default({})
});

async function forwardToPostHog(userId, event, properties = {}) {
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || 'https://app.posthog.com';

  if (!apiKey || typeof fetch !== 'function') return;

  try {
    await fetch(`${host.replace(/\/$/, '')}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: userId || 'anonymous',
        properties
      })
    });
  } catch (err) {
    console.error('PostHog forwarding failed:', err.message);
  }
}

function keepBounded(list, item, max = 1000) {
  list.push(item);
  if (list.length > max) list.shift();
}

// POST /api/telemetry/event
router.post('/event', requireAuth, async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid telemetry event.', details: parsed.error.errors });
  }

  const payload = {
    user_id: req.user.id,
    event: parsed.data.event,
    properties: parsed.data.properties,
    created_at: new Date().toISOString()
  };

  keepBounded(telemetryEvents, payload);
  await forwardToPostHog(req.user.id, parsed.data.event, parsed.data.properties);

  res.json({ success: true });
});

// POST /api/telemetry/error
router.post('/error', async (req, res) => {
  const parsed = errorSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid telemetry error.', details: parsed.error.errors });
  }

  const payload = {
    ...parsed.data,
    created_at: new Date().toISOString()
  };

  keepBounded(telemetryErrors, payload);
  await forwardToPostHog('frontend-error', 'frontend_error', parsed.data);

  res.json({ success: true });
});

// GET /api/telemetry/summary
router.get('/summary', requireAuth, (req, res) => {
  const eventsByName = telemetryEvents.reduce((acc, item) => {
    acc[item.event] = (acc[item.event] || 0) + 1;
    return acc;
  }, {});

  res.json({
    events: telemetryEvents.length,
    errors: telemetryErrors.length,
    eventsByName,
    recentErrors: telemetryErrors.slice(-10).reverse()
  });
});

module.exports = router;
