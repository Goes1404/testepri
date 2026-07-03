const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: false, // allow frontend to load assets
  contentSecurityPolicy: false,     // frontend serves its own CSP
}));

// Rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de mensagens atingido. Aguarde 1 minuto.' },
});

app.use(globalLimiter);

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for dev/sandbox purposes
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '200kb' }));
app.use(morgan('dev'));

// Routes import
const userRoutes = require('./src/routes/user');
const bolsasRoutes = require('./src/routes/bolsas');
const homeRoutes = require('./src/routes/home');
const configRoutes = require('./src/routes/config');
const deadlinesRoutes = require('./src/routes/deadlines');
const applicationsRoutes = require('./src/routes/applications');
const alertsRoutes = require('./src/routes/alerts');
const notificationsRoutes = require('./src/routes/notifications');
const chatRoutes = require('./src/routes/chat');
const comunidadeRoutes = require('./src/routes/comunidade');
const eventosRoutes = require('./src/routes/eventos');
const conteudoRoutes = require('./src/routes/conteudo');
const planoRoutes = require('./src/routes/plano');
const universidadesRoutes = require('./src/routes/universidades');

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/comunidade', comunidadeRoutes);
app.use('/api/eventos', eventosRoutes);
app.use('/api/conteudo', conteudoRoutes);
app.use('/api/plano', planoRoutes);
app.use('/api/universidades', universidadesRoutes);

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Portal do Aluno API Server listening on port ${PORT}`);
});
