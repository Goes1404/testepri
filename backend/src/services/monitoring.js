// Observabilidade de produção (ROADMAP Fase 4): Sentry opcional no backend.
// Ativado apenas quando SENTRY_DSN estiver definido no ambiente.

let sentry = null;

function initMonitoring() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return null;

  try {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1')
    });
    sentry = Sentry;
    console.log('Sentry inicializado (backend).');
  } catch (err) {
    console.warn('Sentry não pôde ser inicializado:', err.message);
  }

  return sentry;
}

function captureError(err, context = {}) {
  if (!sentry) return;
  sentry.withScope(scope => {
    Object.entries(context).forEach(([key, value]) => scope.setTag(key, String(value)));
    sentry.captureException(err);
  });
}

module.exports = { initMonitoring, captureError };
