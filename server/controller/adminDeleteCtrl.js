const {db,admin} = require('../config/firebase');

// Check admin status from Firestore 'users' collection
async function isAdmin(user) {
  if (!user || !user.uid) return false;
  const adminDoc = await db.collection('users').doc(user.uid).get();
  return adminDoc.exists && adminDoc.data().role === 'admin';
}

const deleteAllSuppressionLogs = async (req, res) => {
  if (!(await isAdmin(req.user))) return res.status(403).json({ success: false, message: 'Admin only.' });
  try {
    const snapshot = await db.collection('suppression_logs').get();
    let deleted = 0;
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
      deleted++;
    }
    res.json({ success: true, deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { deleteAllSuppressionLogs };

// All delete-related modules have been removed as requested.
