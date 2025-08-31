const { db } = require('../config/firebase');

// Get suppression logs with pagination
const getSuppressionLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Get total count
    const totalSnapshot = await db.collection('suppression_logs').get();
    const total = totalSnapshot.size;
    const totalPages = Math.ceil(total / limit);

    const logs = [];
    let query = db.collection('suppression_logs').orderBy('timestamp', 'desc');
    if (offset > 0) {
      const offsetSnapshot = await query.limit(offset).get();
      const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.limit(limit).get();
    snapshot.docs.forEach(doc => logs.push(doc.data()));

    return res.status(200).json({
      success: true,
      data: logs,
      total,
      page,
      totalPages
    });
  } catch (err) {
    console.error('Error fetching suppression logs:', err);
    return res.status(500).json({ error: 'Failed to fetch suppression logs' });
  }
};

module.exports = { getSuppressionLogs };
