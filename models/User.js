// models/User.js
const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  industry: { type: String, default: "" }, // From Screen 4
  experienceLevel: { type: String, default: "" }, // From Screen 5
  joinedDate: { type: Date, default: Date.now }
});
module.exports = mongoose.model('User', UserSchema);