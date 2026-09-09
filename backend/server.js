const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const verificationRoutes = require('./routes/verificationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/legal_metrology_db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api', verificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    project: 'SIH26034 - Legal Metrology Packaged Commodities Compliance Checker',
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

// Multer and general error handling middleware
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('valid image file')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'Image size exceeds 10MB limit.' });
  }
  console.error('Server error handler:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Connect to MongoDB with non-blocking fallback
async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 2000 // 2 second timeout so it doesn't hang if no local mongod
    });
    console.log('✓ Connected to MongoDB successfully.');
  } catch (dbErr) {
    console.warn('⚠️  MongoDB connection failed or not running:', dbErr.message);
    console.warn('ℹ️  Running with in-memory persistence fallback for prototype session.');
  }

  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 SIH26034 Compliance Prototype Backend`);
    console.log(`📡 Server running on http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===================================================`);
  });
}

startServer();
