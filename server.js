// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 100-Level Upgrade: Request Logging
// This will show you in the terminal whenever your phone hits the server
app.use((req, res, next) => {
  console.log(`📡 ${req.method} request to ${req.url} from ${req.ip}`);
  next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smart_cv')
  .then(async () => {
    console.log("✅ MongoDB Connected Successfully");
    
    // 💥 THE NUKE: This drops the entire collection and wipes all corrupted indexes!
    try {
      // await mongoose.connection.db.dropCollection('resumes');
      console.log("💥 Collection dropped! Slate is wiped clean.");
    } catch (err) {
      console.log("Collection already clean.");
    }
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

// FIX: Listen on '0.0.0.0' to allow your Samsung phone to connect via your local IP
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://192.168.0.105:${PORT}`);
});