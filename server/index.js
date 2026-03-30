const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Main Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Operational', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'production',
    service: 'Digital Grievance API'
  });
});


const grievanceRoutes = require('./routes/grievanceRoutes');
const aiRoutes = require('./routes/aiRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/grievances', grievanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

// --- Production/Deployment: Serve frontend ---
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
  
  // Only serve index.html if it exists, otherwise return 404
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Run "npm run build" first.');
    }
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Digital Grievance API is online`);
    console.log(`========================================\n`);
});
