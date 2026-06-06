const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const { sanitizeInput } = require('./middleware/sanitizeMiddleware');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Security Headers (Helmet)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", "https://*.supabase.co", "wss://*.supabase.co"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.supabase.co"]
      }
    }
  })
);

// 2. CORS setup (supporting credentials/cookies)
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

// 3. Rate Limiter (Brute-force / DoS Protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

app.use(express.json());
app.use(cookieParser());
app.use(sanitizeInput);

// 4. Main Health Check
app.get('/api/health', async (req, res) => {
  const supabase = require('./config/supabase');
  let dbStatus = 'online';
  let dbLatency = 0;
  
  try {
    if (supabase) {
      const dbStart = Date.now();
      // Simple head check on profiles table to test connectivity
      const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
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
    active_sms_target: process.env.SMS_GATEWAY_URL || 'http://10.105.47.157:8080/api/v1',
    service: 'Digital Grievance API'
  });
});

app.get('/api/diag-sms', (req, res) => {
  const sms = require('./services/smsService');
  res.json({ 
    config: 'Check your server logs or smsService.js directly.',
    active: !!sms.sendOTPSMS
  });
});

// Import Routes
const grievanceRoutes = require('./routes/grievanceRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');

// 5. Versioned API Routing
app.use('/api/v1/grievances', grievanceRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/sessions', sessionRoutes);

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
  console.error('[Central System Error]:', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Something went wrong on the server!';
  res.status(status).json({ 
    error: message,
    timestamp: new Date().toISOString()
  });
});

// --- Supabase Realtime Server-Side Event Bus ---
const supabaseClient = require('./config/supabase');
const emailService = require('./services/emailService');

if (supabaseClient) {
  supabaseClient
    .channel('server-db-events')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_comments' }, (payload) => {
      console.log('📡 Realtime: Comment added on ticket', payload.new.grievance_id);
      emailService.handleCommentAddedEvent(payload.new).catch(console.error);
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'grievances' }, (payload) => {
      console.log('📡 Realtime: Grievance updated', payload.new.ticket_id);
      emailService.handleGrievanceUpdatedEvent(payload.new, payload.old).catch(console.error);
    })
    .subscribe((status) => {
      console.log(`📡 Supabase Database Realtime Channel Status: ${status}`);
    });
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Digital Grievance API v1 is online`);
    console.log(`========================================\n`);
});
