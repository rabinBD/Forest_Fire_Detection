const {db} = require('../config/firebase');
const cron = require('node-cron');

async function deleteOldestSensorReadings() {
  const snapshot = await db.collection('fire_readings_new')
    .orderBy('timestamp', 'asc')
    .limit(100)
    .get();
  let deleted = 0;
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    deleted++;
  }
  console.log(`Deleted ${deleted} oldest sensor readings.`);
  return deleted;
}


// Helper to delete old docs from a collection
async function deleteOldDocs(collection, days) {
  const cutoff = Date.now() - minuutes * 60 * 1000;
  const snapshot = await db.collection(collection)
    .where('timestamp', '<', cutoff)
    .get();
  let deleted = 0;
  for (const doc of snapshot.docs) {
    await doc.ref.delete();
    deleted++;
  }
  return deleted;
}


// Run every day at 2:00 AM
// */10 * * * *
cron.schedule('*/10 * * * *', async () => {
  console.log('Auto-cleanup job started');
  try {
    const sensorDeleted = await deleteOldDocs('fire_readings_new', 1); // 1 day
    const fireDeleted = await deleteOldDocs('fire_detection', 1); // 1 week
    console.log(`Deleted ${sensorDeleted} old sensor records, ${fireDeleted} old fire records.`);
    // Also delete 1000 oldest sensor readings (FIFO)
    await deleteOldestSensorReadings();
  } catch (err) {
    console.error('Auto-cleanup error:', err);
  }
});

module.exports = {};
