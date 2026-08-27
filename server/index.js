const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const { clerkMiddleware } = require('@clerk/express');
const { sanitizeInput } = require('./middleware/sanitizeMiddleware');


const { validateBootSecurity } = require('./utils/envValidator');

// Validate required environment variables on startup (except during tests)
validateBootSecurity();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// 1. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Supabase (DB + realtime websockets), Clerk (auth SDK + telemetry) and Google (OAuth)
        connectSrc: [
          "'self'",
          "https://*.supabase.co", "wss://*.supabase.co",
          "https://*.clerk.accounts.dev", "https://*.clerk.com", "https://clerk-telemetry.com",
          "https://accounts.google.com", "https://*.googleapis.com"
        ],
        scriptSrc: [
          "'self'", "'unsafe-inline'", "'unsafe-eval'",
          "https://*.clerk.accounts.dev", "https://*.clerk.com",
          "https://accounts.google.com", "https://apis.google.com"
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: [
          "'self'", "data:", "blob:",
          "https://*.supabase.co", "https://img.clerk.com", "https://*.googleusercontent.com"
        ],
        // Clerk uses web workers (blob:) and renders sign-in flows in frames
        workerSrc: ["'self'", "blob:"],
        frameSrc: ["'self'", "https://*.clerk.accounts.dev", "https://accounts.google.com"]
      }
    },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: 'no-referrer' },
    xssFilter: true,
    noSniff: true
  })
);

// 2. CORS setup (supporting credentials/cookies with whitelist validation)
const corsOptions = require('./config/corsConfig');
app.use(cors(corsOptions));

// 3. Rate Limiter (Brute-force / DoS Protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    try {
      const configService = require('./services/configService');
      return parseInt(configService.getSetting('rate_limit_max', 100));
    } catch (err) {
      return 100;
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

app.use(express.json());
app.use(cookieParser());
app.use(sanitizeInput);
app.use(clerkMiddleware());

// 4. Main Health Check
app.get('/api/health', async (req, res) => {
  const supabase = require('./config/supabase');
  let dbStatus = 'online';
  let dbLatency = 0;
  
  try {
    if (supabase) {
      const dbStart = Date.now();
      // Simple head check on users table to test connectivity
      const { error } = await supabase.from('users').select('id', { count: 'exact', head: true }).limit(1);
      dbLatency = Date.now() - dbStart;
      if (error) {
        dbStatus = 'degraded';
      }
    } else {
      dbStatus = 'offline';
    }
  } catch (err) {
    dbStatus = 'offline';
  }

  res.json({ 
    status: dbStatus === 'online' ? 'ok' : 'degraded', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatus,
      latencyMs: dbLatency
    },
    service: 'Digital Grievance API'
  });
});

// Import Routes
const grievanceRoutes   = require('./routes/grievanceRoutes');
const aiRoutes          = require('./routes/aiRoutes');
const authRoutes        = require('./routes/authRoutes');
const chatRoutes        = require('./routes/chatRoutes');
const adminRoutes       = require('./routes/adminRoutes');
const userRoutes        = require('./routes/userRoutes');
const sessionRoutes     = require('./routes/sessionRoutes');
const emailTestRoutes   = require('./routes/emailTestRoutes');
const publicRoutes      = require('./routes/publicRoutes');
const uploadRoutes      = require('./routes/uploadRoutes');
const messagingRoutes   = require('./routes/messagingRoutes');

// 5. Versioned API Routing
app.use('/api/v1/grievances', grievanceRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/test-email', emailTestRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/messaging', messagingRoutes);


// --- Production/Deployment: Serve frontend ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Run "npm run build" first.');
    }
  });
});

// 6. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  // Handle Multer upload errors (e.g. file size limit exceeded)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      error: err.code === 'LIMIT_FILE_SIZE' 
        ? 'File size exceeds maximum allowable limit (2MB for avatars, 5MB for attachments).' 
        : `Upload Error: ${err.message}`,
      timestamp: new Date().toISOString()
    });
  }

  const status = err.status || 500;

  // Full detail is logged server-side only, never returned to the client.
  console.error(`[Central System Error] ${req.method} ${req.originalUrl}:`, err.stack || err.message);

  // Optional file logging for debugging. Gated behind ERROR_LOG_FILE=true and written
  // asynchronously so it never blocks the event loop (and does not grow silently in prod).
  if (process.env.ERROR_LOG_FILE === 'true') {
    const fs = require('fs');
    const logPath = path.join(__dirname, '../server_errors.log');
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl}\nError: ${err.message}\nStack: ${err.stack}\n\n`;
    fs.appendFile(logPath, logMessage, (fsErr) => {
      if (fsErr) console.error('Failed to write to server_errors.log:', fsErr.message);
    });
  }

  // For unexpected 5xx errors in production, return a generic message so internal
  // details / stack traces are never leaked. User-facing 4xx messages pass through.
  const message = (status >= 500 && process.env.NODE_ENV === 'production')
    ? 'An unexpected error occurred. Please try again later.'
    : (err.message || 'Something went wrong on the server!');

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString()
  });
});

// --- Supabase Realtime Server-Side Event Bus ---
const supabaseClient = require('./config/supabase');
const notificationService = require('./services/notificationService');

let lastRealtimeStatus = null;
if (supabaseClient) {
  supabaseClient
    .channel('server-db-events')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments' }, (payload) => {
      console.log('📡 Realtime: Comment added on ticket', payload.new.grievance_id);
      notificationService.handleCommentAddedEvent(payload.new).catch(console.error);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'grievances' }, (payload) => {
      console.log('📡 Realtime: Grievance updated', payload.new.ticket_id);
      notificationService.handleGrievanceUpdatedEvent(payload.new, payload.old).catch(console.error);
    })
    .subscribe((status) => {
      if (status !== lastRealtimeStatus) {
        lastRealtimeStatus = status;
        console.log(`📡 Supabase Database Realtime Channel Status: ${status}`);
      }
    });
}

const configService = require('./services/configService');

configService.init().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Digital Grievance API v1 is online`);
    console.log(`========================================\n`);
  });
}).catch(err => {
  console.error('❌ Server failed to start due to config errors:', err);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT} (fallback mode)`);
  });
});

// Nodemon port conflict resolution trigger

