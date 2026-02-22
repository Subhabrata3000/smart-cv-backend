const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// --- 1. REGISTER ROUTE ---
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user already exists manually (Optional but good for UX)
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already exists" });

    // Hashing password here if not handled in UserSchema middleware
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ 
      email, 
      password: hashedPassword 
    });

    await newUser.save();
    res.status(201).json({ userId: newUser._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server Error" });
  }
});

// --- 2. LOGIN ROUTE (ADDED) ---
// This handles the sign-in request from your Flutter app
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 2. Compare Password 
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // 3. Return user data (excluding password)
    res.status(200).json({ 
      userId: user._id,
      email: user.email,
      industry: user.industry, // Useful for the Flutter smart routing logic
      experienceLevel: user.experienceLevel 
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).json({ error: "Server Error during login" });
  }
});

// --- 3. PROFILE SETUP ROUTE ---
router.put('/setup/:id', async (req, res) => {
  try {
    const { industry, experienceLevel } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id, 
      { industry, experienceLevel },
      { new: true } // Returns the updated document
    );
    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

module.exports = router;