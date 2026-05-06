const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow no-origin requests (Postman, curl, mobile)
    if (!origin) return callback(null, true);

    const allowed = [
      'http://localhost:5173',
      'http://localhost:4173',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow exact match
    if (allowed.includes(origin)) return callback(null, true);

    // Allow any *.pages.dev subdomain (Cloudflare Pages)
    if (origin.endsWith('.pages.dev')) return callback(null, true);

    // Allow any *.onrender.com (Render previews)
    if (origin.endsWith('.onrender.com')) return callback(null, true);

    // Allow all in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    console.warn('CORS blocked origin:', origin);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle ALL preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OTMS Backend is running', env: process.env.NODE_ENV });
});

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'OTMS API Server', version: '1.0.0', health: '/api/health' });
});

// 404 handler — shows which URL was not found
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    method: req.method,
    path: req.originalUrl,
    hint: 'All API routes start with /api/'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;
// Prevent Render free tier sleep
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    require('https').get(
      process.env.RENDER_EXTERNAL_URL + '/api/health',
      () => {}
    );
  }, 14 * 60 * 1000); // ping every 14 minutes
}

app.listen(PORT, () => {
  console.log(`OTMS Backend running on port ${PORT}`);
});
