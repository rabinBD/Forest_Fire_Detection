const admin = require('firebase-admin');
const {db} = admin.firestore();


// Check admin status via Firestore 'admins' collection using Firebase UID
async function isAdmin(user) {
  if (!user || !user.uid) return false;
  const adminDoc = await db.collection('admins').doc(user.uid).get();
  return adminDoc.exists && adminDoc.data().role === 'admin';
}

exports.deleteAllSuppressionLogs = async (req, res) => {
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

// All delete-related modules have been removed as requested.
