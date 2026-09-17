// Build the whitelist dynamically from ALLOWED_ORIGINS plus known deployed frontend URL(s).
const getAllowedOrigins = () => {
  return [
    ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : []),
    process.env.VITE_FRONTEND_URL,
    process.env.FRONTEND_URL,
    process.env.RENDER_EXTERNAL_URL
  ]
    .map((o) => (o || '').trim().replace(/\/$/, ''))
    .filter(Boolean);
};

const isOriginAllowed = (origin) => {
  if (!origin) return true;

  const normalized = origin.trim().replace(/\/$/, '');

  // 1. In development/test, allow all localhost and 127.0.0.1 origins
  if (process.env.NODE_ENV !== 'production') {
    if (
      normalized.startsWith('http://localhost:') ||
      normalized.startsWith('http://127.0.0.1:') ||
      normalized.startsWith('https://localhost:') ||
      normalized.startsWith('https://127.0.0.1:')
    ) {
      return true;
    }
  }

  // 2. Explicit whitelist match from environment variables
  const allowed = getAllowedOrigins();
  if (allowed.includes(normalized)) {
    return true;
  }

  // 3. Render deployments (e.g., https://digitalgrievanceredressalsystem.onrender.com)
  if (/^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(normalized)) {
    return true;
  }

  // 4. Vercel preview & production deployments
  if (/^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(normalized)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    } else {
      // In CORS standards, an unpermitted origin simply does not receive
      // Access-Control-Allow-Origin headers. We return callback(null, false)
      // instead of callback(new Error(...)) which would crash the Express pipeline
      // with a 500 error on static assets and API requests.
      return callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

module.exports = corsOptions;

