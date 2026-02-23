const mongoose = require('mongoose');

// --- SUB-SCHEMAS FOR COMPLEX OBJECTS ---

const PersonalDetailsSchema = new mongoose.Schema({
  fullName: { type: String, default: "" },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  profileImageUrl: { type: String, default: "" }
});

const EducationSchema = new mongoose.Schema({
  school: { type: String, default: "" },
  degree: { type: String, default: "" },
  year: { type: String, default: "" }
});

const ExperienceSchema = new mongoose.Schema({
  company: { type: String, default: "" },
  role: { type: String, default: "" },
  duration: { type: String, default: "" },
  // Adding description for AI-polished content
  description: { type: String, default: "" },
  // ✅ FIX 1: Added type field ('fulltime' | 'internship')
  type: { type: String, default: 'fulltime' }
});

// ✅ FIX 2: Added Project Schema
const ProjectSchema = new mongoose.Schema({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  hostedLink: { type: String, default: "" }
});

// ✅ FIX 3: Added Certification Schema
const CertificationSchema = new mongoose.Schema({
  name: { type: String, default: "" },
  description: { type: String, default: "" },
  imageUrl: { type: String, default: "" }
});


// --- MAIN RESUME SCHEMA ---

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resumeTitle: { 
    type: String, 
    default: "My Professional Resume" 
  },

  // Nested Object
  personalDetails: {
    type: PersonalDetailsSchema,
    default: () => ({})
  },

  // Arrays of Sub-documents
  education: { type: [EducationSchema], default: [] },
  experience: { type: [ExperienceSchema], default: [] },
  projects: { type: [ProjectSchema], default: [] },             // ✅ Added projects
  certifications: { type: [CertificationSchema], default: [] }, // ✅ Added certifications

  // Simple Arrays
  skills: {
    type: [String],
    default: []
  },
  languages: {
    type: [String],
    default: []
  },

  // Tracking progress for the Strength Meter in Flutter
  completionPercentage: {
    type: Number,
    default: 0.0
  },

  // Production best practice: Track timestamps
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Resume', ResumeSchema);