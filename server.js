require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { getDb, dbGet, initSchema } = require('./database/db');

// Route modules
const authRoutes = require('./server/routes/auth');
const chatRoutes = require('./server/routes/chat');
const studentRoutes = require('./server/routes/student');
const facultyRoutes = require('./server/routes/faculty');
const adminRoutes = require('./server/routes/admin');
const analyticsRoutes = require('./server/routes/analytics');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve frontend static assets
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'UniMate AI',
    version: '2.4.0',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Express Server locally. Vercel imports and exports the app as a function.
async function startServer() {
  try {
    getDb();
    await initSchema();
    const userCount = await dbGet('SELECT COUNT(*) AS count FROM users');
    if (userCount.count === 0) {
      const { seedDatabase } = require('./database/seed');
      await seedDatabase();
    }

    console.log('✅ SQLite Database connected.');

    app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🚀 UniMate AI Server running at http://localhost:${PORT}`);
      console.log('🎓 Ready for PromptWars Hackathon Evaluation');
      console.log('Demo Logins:');
      console.log('  Student : student@unimate.ai  | password123');
      console.log('  Faculty : faculty@unimate.ai  | password123');
      console.log('  Admin   : admin@unimate.ai    | password123');
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Failed to start UniMate AI server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = app;
