const { db } = require('../config/firebase');

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
      autoResumed: false
    };
    await db.collection('settings').doc('notification_control').set(update, { merge: true });
    await db.collection('suppression_logs').add({
      action: suppress ? 'suppressed (manual)' : 'resumed (manual)',
      timestamp: new Date().toLocaleString(),
      user: 'admin',
      auto: false
    });
    res.json({ success: true, ...update });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update suppression status' });
  }
};

module.exports = { getSuppressionStatus, setSuppressionStatus };
