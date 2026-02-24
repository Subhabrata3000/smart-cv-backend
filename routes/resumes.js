const express = require('express');
const router = express.Router();
const Resume = require('../models/Resume');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI with production settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * @route   POST /api/resumes/save
 * @desc    Save or Update a resume (Supports Multiple Resumes!)
 */
router.post('/save', async (req, res) => {
  try {
    // We extract _id (or id) to check if this is an existing resume
    const { userId, _id, id, ...resumeData } = req.body;
    const resumeId = _id || id; 

    if (!userId) {
      return res.status(400).json({ error: "userId is required for syncing" });
    }

    let resume;

    if (resumeId) {
      // 1. UPDATE EXISTING: If an ID is provided, update that specific resume
      resume = await Resume.findByIdAndUpdate(
        resumeId, 
        { 
          $set: { 
            ...resumeData, 
            lastSynced: Date.now() 
          } 
        },
        { new: true, runValidators: true }
      );
    } else {
      // 2. CREATE NEW: If no ID exists, create a brand new resume document
      resume = new Resume({
        userId: userId,
        ...resumeData,
        lastSynced: Date.now()
      });
      await resume.save();
    }

    res.status(200).json({
      success: true,
      message: "Resume synced successfully",
      data: resume
    });
  } catch (err) {
    console.error("📂 Save/Sync Error:", err);
    res.status(500).json({ error: "Internal Server Error during sync" });
  }
});

/**
 * @route   POST /api/resumes/ai-suggest
 * @desc    Use Gemini AI to polish resume sections
 */
router.post('/ai-suggest', async (req, res) => {
  try {
    const { section, content, industry } = req.body;
    
    if (!content || content.length < 5) {
      return res.status(400).json({ error: "Content too short for AI polishing" });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are a senior HR recruiter and ATS expert. Your output must be professional, direct, and contain NO conversational filler."
    });

    const prompt = `
      Industry Focus: ${industry || 'General'}
      Resume Section: ${section}
      Original Content: "${content}"

      Task: 
      1. Rewrite the content to be high-impact using strong action verbs (e.g., 'Spearheaded', 'Engineered').
      2. Ensure it is optimized for ATS keywords related to ${industry}.
      3. Use a clear, bulleted format if the section is 'Experience'.
      4. STRICT INSTRUCTION: Return ONLY the improved text.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ 
      success: true,
      suggestion: text.trim().replace(/^"(.*)"$/, '$1') 
    });
  } catch (error) {
    console.error("🤖 AI Error:", error);
    res.status(500).json({ error: "Gemini AI is currently unavailable." });
  }
});

/**
 * @route   GET /api/resumes/all/:userId
 * @desc    Fetch ALL resumes for the "My Resumes" list screen
 * @note    MUST be placed above the single GET route to prevent routing conflicts!
 */
router.get('/all/:userId', async (req, res) => {
  try {
    // Find all resumes matching the user, sorted newest to oldest
    const resumes = await Resume.find({ userId: req.params.userId }).sort({ updatedAt: -1 });
    
    res.status(200).json({ success: true, data: resumes });
  } catch (err) {
    console.error("Fetch All Error:", err);
    res.status(500).json({ error: "Failed to fetch your resumes" });
  }
});

/**
 * @route   GET /api/resumes/:userId
 * @desc    Fetch the single most recently updated resume (For the Home Screen Dashboard)
 */
router.get('/:userId', async (req, res) => {
  try {
    // Sort by updatedAt descending (-1) to get the most recent one
    const resume = await Resume.findOne({ userId: req.params.userId }).sort({ updatedAt: -1 });
    
    if (!resume) {
      return res.status(404).json({ message: "No draft found for this user" });
    }
    
    res.json({ success: true, data: resume });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch resume data" });
  }
});

// ════════════════════════════════════════════════════════════════════════
// 🚨 NEW ROUTES: 3-DOT CONTEXT MENU ACTIONS (DELETE, RENAME, DUPLICATE)
// ════════════════════════════════════════════════════════════════════════

/**
 * @route   DELETE /api/resumes/:id
 * @desc    Delete a specific resume entry
 */
router.delete('/:id', async (req, res) => {
  try {
    await Resume.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Resume deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Deletion failed" });
  }
});

/**
 * @route   PUT /api/resumes/:id/rename
 * @desc    Rename a specific resume
 */
router.put('/:id/rename', async (req, res) => {
  try {
    const updatedResume = await Resume.findByIdAndUpdate(
      req.params.id, 
      { resumeTitle: req.body.newTitle }, 
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedResume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @route   POST /api/resumes/:id/duplicate
 * @desc    Duplicate an existing resume
 */
router.post('/:id/duplicate', async (req, res) => {
  try {
    const originalResume = await Resume.findById(req.params.id);
    if (!originalResume) return res.status(404).json({ error: 'Resume not found' });

    // Convert mongoose document to plain JS object and strip exact identifiers
    const resumeData = originalResume.toObject();
    delete resumeData._id;
    delete resumeData.createdAt;
    delete resumeData.updatedAt;
    
    // Append (Copy) to the title
    resumeData.resumeTitle = `${resumeData.resumeTitle} (Copy)`;

    // Save as brand new document
    const duplicatedResume = new Resume(resumeData);
    await duplicatedResume.save();
    
    res.status(201).json({ success: true, data: duplicatedResume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;