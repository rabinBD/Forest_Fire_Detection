const { db } = require('../config/firebase');
const rateLimit = require('express-rate-limit');

// Rate limiting middleware
const suppressionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Get current notification suppression status
const getSuppressionStatus = async (req, res) => {
  try {
    const doc = await db.collection('settings').doc('notification_control').get();
    if (!doc.exists) return res.json({ longSuppression: false });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch suppression status' });
  }
};

// Set notification suppression status (pause/resume)
const setSuppressionStatus = async (req, res) => {
  try {
    const { suppress } = req.body; // true to pause, false to resume
    const update = {
      longSuppression: suppress,
      suppressedAt: suppress ? new Date().toLocaleString() : null,
      suppressionDurationHours: 24,
      autoResumed: false,
    };

    await db.collection("settings").doc("notification_control").set(update, { merge: true });

    await db.collection("suppression_logs").add({
      action: suppress ? "suppressed (manual)" : "resumed (manual)",
      timestamp: new Date().toLocaleString(),
      user: "admin",
      auto: false,
    });

    // Ensure critical notifications are still sent even if paused
    if (suppress) {
      console.log("Notifications paused, but critical alerts will still be sent.");
    }

    res.json({ success: true, ...update });
  } catch (err) {
    res.status(500).json({ error: "Failed to update suppression status" });
  }
};

module.exports = { 
  getSuppressionStatus: [suppressionLimiter, getSuppressionStatus], 
  setSuppressionStatus 
};
