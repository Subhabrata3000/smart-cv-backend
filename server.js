const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// 🚨 NEW PROXY FIX: Tell Express it is behind Render's router so it grabs the REAL IP addresses!
app.set('trust proxy', true);

// Middleware
app.use(cors());
app.use(express.json());

// This will show you in the terminal whenever a phone hits the server
app.use((req, res, next) => {
  console.log(`📡 ${req.method} request to ${req.url} from ${req.ip}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_cv')
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Route Imports
app.use('/api/auth', require('./routes/auth'));
app.use('/api/resumes', require('./routes/resumes'));

// Global Error Handler to prevent server crashes
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

// 🚨 FIX FOR RENDER: Render requires the server to listen continuously on 0.0.0.0
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});