const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const sendEmail = require('../services/mailer');
const os = require('os');
const cloudinary = require('../config/cloudinary');
const { canSendNotification, canSendEmail, checkLongSuppression } = require('../services/pauseNotify');
require('dotenv').config();

// Centralized ngrok URL 
const NGROK_URL = process.env.NGROK_URL;

// Handle receiving new sensor data  ----->Testing
const receiveData = async (req, res) => {
  const fireDetected = req.body.flame && req.body.flame.toLowerCase() === 'detected';

  const data = {
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    fireDetected,
    timestamp: new Date().toLocaleDateString(),
  };

  await db.collection('fire_readings').add(data);

  if (fireDetected) {
    const tokensSnapshot = await db.collection('admin_tokens').get();
    tokensSnapshot.forEach(async (doc) => {
      const token = doc.data().token;
      try {
        await admin.messaging().send({
          notification: {
            title: 'Fire Alert',
            body: `Temp: ${data.temperature}°C, Flame detected!`,
          },
          token,
        });
      } catch (err) {
        console.error("Notification error:", err.message);
      }
    });
  }

  res.json({ success: true, message: 'Data received' });
};

// This function will handle WebSocket data reception and broadcasting ----->Testing
const webSocketFeed = async (req, res, broadcast) => {
  const data = {
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    // no smoke field here, as Arduino does not send it
    timestamp: new Date().toLocaleDateString(),
  };

  try {
    console.log('Sensor Data:', data);

    // Send to WebSocket clients
    broadcast({
      type: 'sensor_update',
      data,
    });

    res.status(200).json({ success: true, message: 'Sensor data received' });
  } catch (err) {
    console.error('Error processing sensor data', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Return last 100 entries  ----->Testing
const getData = async (req, res) => {
  try {
    const snapshot = await db
      .collection('fire_readings')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    const data = snapshot.docs.map((doc) => doc.data());

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get latest single sensor data (for dashboard)  ----->Testing
const getLatestSensorData = async (req, res) => {
  try {
    const snapshot = await db
      .collection('fire_readings')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(200).json({
        temperature: null,
        humidity: null,
        gas: null,
        flame: null,
        fireDetected: null,
      });
    }

    const doc = snapshot.docs[0].data();

    res.status(200).json({
      temperature: doc.temperature,
      humidity: doc.humidity,
      gas: null, // no smoke field sent by Arduino
      fireDetected: doc.fireDetected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get fire status string  ----->Testing
const getStatus = async (req, res) => {
  try {
    const snapshot = await db
      .collection('fire_readings')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    const doc = snapshot.docs[0]?.data();

    const status = doc?.fireDetected ? "Fire Detected!" : "Normal";

    res.status(200).json({ status });
  } catch (error) {
    res.status(500).json({ status: "Status unavailable" });
  }
};


// ------> date key function to create collection names based on date and CLOUDINARY SETUP <------
// const getDateKey = () => {
//   const now = new Date();
//   return now.toISOString().split('T')[0].replace(/-/g, '_'); // YYYY_MM_DD
// };

let latestSensorData = null;

const handleSensorDataAndImage = async (req, res, broadcast) => {
  try {
    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      const temperature = req.body.temperature ? parseFloat(req.body.temperature) : null;
      const humidity = req.body.humidity ? parseFloat(req.body.humidity) : null;
      const gas = req.body.gas ? parseFloat(req.body.gas) : null;
      const flameDetected = req.body.flame && req.body.flame.toLowerCase() === 'detected';

      const sensorData = {
        temperature,
        humidity,
        gas,
        flameDetected,
        timestamp: new Date().toLocaleString(),
      };

      latestSensorData = sensorData;

      if (temperature || humidity || gas ) {
        await db.collection('fire_readings_new').add(sensorData);

        broadcast({
          type: 'sensor_update',
          data: sensorData
        });

        console.log('Sensor Data:', sensorData);
      }

      return res.status(200).json({ success: true, message: 'Sensor data received' });

    } else if (contentType.includes('image/jpeg')) {
      if (!req.body || !Buffer.isBuffer(req.body)) {
        return res.status(400).json({ error: 'No image data found in request' });
      }

      const tempFilePath = path.join(os.tmpdir(), `image_${Date.now()}.jpg`);
      let result = null;
      let errorMessage = null;
      let responseSent = false;
      const sendOnce = (callback) => {
        if (!responseSent) {
          responseSent = true;
          callback();
        }
      };

      try {
        fs.writeFileSync(tempFilePath, req.body);
        console.log('Image temporarily saved:', tempFilePath);

        const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
          folder: 'fireDetection',
          resource_type: 'image',
        });
        const imageUrl = uploadResult.secure_url;

        const pythonProcess = spawn('python', [
          'D:\\fireDetectionBackend\\server\\model\\predict.py',
          tempFilePath,
        ]);

        pythonProcess.stdout.on('data', (data) => {
          result = data.toString().trim();
        });

        pythonProcess.stderr.on('data', (data) => {
          errorMessage = data.toString();
          console.error('Python Error:', errorMessage);
        });

        pythonProcess.on('close', async () => {
          fs.unlinkSync(tempFilePath);
          if (errorMessage?.toLowerCase().includes('traceback') || errorMessage?.toLowerCase().includes('error')) {
            return sendOnce(() => res.status(500).json({ error: 'Prediction script error' }));
          }

          if (result === 'fire') {
            console.log('fire detected');

            const fireRecord = {
              imageUrl,
              timestamp: new Date().toLocaleString(),
              fireDetected: true,
              temperature: latestSensorData?.temperature,
              humidity: latestSensorData?.humidity,
              gas: latestSensorData?.gas
            };

            await db.collection('fire_detection').add({ fireRecord });

            const isSuppressed = await checkLongSuppression();

            if (!isSuppressed && canSendNotification()) {
              const tokensSnapshot = await db.collection('admin_tokens').get();
              tokensSnapshot.forEach(async (doc) => {
                const token = doc.data().token;
                try {
                  await admin.messaging().send({
                    notification: {
                      title: 'Fire Alert',
                      body: `Temp: ${fireRecord.temperature}°C, humidity: ${fireRecord.humidity}, gas: ${fireRecord.gas}`,
                    },
                    token,
                  });
                } catch (err) {
                  console.error("Notification error:", err.message);
                }
              });
              console.log('Notifications sent to admins');
            }

            if (!isSuppressed && canSendEmail()) {
              await sendEmail(imageUrl, fireRecord.temperature, fireRecord.humidity, fireRecord.gas);
              console.log('Email sent successfully');
            }

            return sendOnce(() => res.status(200).json({
              fire: true,
              imageUrl,
              message: 'Fire detected! Email alert sent.',
              ...latestSensorData
            }));
          } else if (result === 'nofire') {
            console.log('No fire detected.');

            const noFireRecord = {
              imageUrl,
              timestamp: new Date().toLocaleString(),
              fireDetected: false,
              temperature: latestSensorData?.temperature,
              humidity: latestSensorData?.humidity,
              gas: latestSensorData?.gas
            };

            await db.collection('fire_detection').add({ fireRecord: noFireRecord });

            return sendOnce(() => res.status(200).json({
              fire: false,
              imageUrl,
              message: 'No fire detected in image.'
            }));
          } else {
            return sendOnce(() => res.status(500).json({ error: 'Unexpected result from prediction script' }));
          }
        });
      } catch (err) {
        console.error('Error processing image:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported content-type' });
    }
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};


// In-memory cache for total count (expires every 60s)
let sensorHistoryCountCache = { value: 0, lastFetch: 0 };
const getSensorHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Use cached total count if not expired
    let total = sensorHistoryCountCache.value;
    const now = Date.now();
    if (now - sensorHistoryCountCache.lastFetch > 60000) {
      // Only fetch count every 60s
      const totalSnapshot = await db.collection('fire_readings_new').select().get();
      total = totalSnapshot.size;
      sensorHistoryCountCache = { value: total, lastFetch: now };
    }
    const totalPages = Math.ceil(total / limit);

    // Efficient pagination: use orderBy and startAfter only if offset > 0
    let query = db.collection('fire_readings_new').orderBy('timestamp', 'desc');
    if (offset > 0) {
      // Get the last doc of the previous page
      const prevPageSnap = await query.limit(offset).get();
      const lastDoc = prevPageSnap.docs[prevPageSnap.docs.length - 1];
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }
    const snapshot = await query.limit(limit).get();
    const history = snapshot.docs.map(doc => doc.data());

    return res.status(200).json({
      success: true,
      data: history,
      total,
      page,
      totalPages
    });
  } catch (err) {
    console.error('Error fetching sensor history:', err);
    return res.status(500).json({ error: 'Failed to fetch sensor history' });
  }
};

// const getSensorHistory = async (req, res) => {
//   try {
//     const date = req.query.date || getDateKey();
//     const snapshot = await db.collection(`fire_readings_${date}`).orderBy('timestamp', 'desc').get();
//     const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     res.status(200).json({ success: true, data: history });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch sensor history' });
//   }
// };

// In-memory cache for fire detection count (expires every 60s)
let fireDetectionCountCache = { value: 0, lastFetch: 0 };
const getFireDetectionHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    // Use cached total count if not expired
    let total = fireDetectionCountCache.value;
    const now = Date.now();
    if (now - fireDetectionCountCache.lastFetch > 60000) {
      const totalSnapshot = await db.collection('fire_detection').select().get();
      total = totalSnapshot.size;
      fireDetectionCountCache = { value: total, lastFetch: now };
    }
    const totalPages = Math.ceil(total / limit);

    let query = db.collection('fire_detection').orderBy('fireRecord.timestamp', 'desc');
    if (offset > 0) {
      const prevPageSnap = await query.limit(offset).get();
      const lastDoc = prevPageSnap.docs[prevPageSnap.docs.length - 1];
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
    }
    const snapshot = await query.limit(limit).get();
    const history = snapshot.docs.map(doc => doc.data().fireRecord || {});

    return res.status(200).json({
      success: true,
      data: history,
      total,
      page,
      totalPages
    });
  } catch (err) {
    console.error('Error fetching fire detection history:', err);
    return res.status(500).json({ error: 'Failed to fetch fire detection history' });
  }
};

// const getFireDetectionHistory = async (req, res) => {
//   try {
//     const date = req.query.date || getDateKey();
//     const snapshot = await db.collection(`fire_detections_${date}`).orderBy('fireRecord.timestamp', 'desc').get();
//     const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data().fireRecord }));
//     res.status(200).json({ success: true, data: history });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to fetch fire detection history' });
//   }
// };


//delete by admin
// const deleteHistoryByDate = async (req, res) => {
//   try {
//     const { date } = req.params;

//     //checking for admin role
//     const userDoc = await db.collection('users').doc(req.user.uid).get();
//     if (!userDoc.exists || userDoc.data().role !== 'admin') {
//       return res.status(403).json({
//         message: 'Forbidden: Admin only'
//       });
//     }

//     const collectionsToDelete = [`fire_readings_${date}`, `fire_detections_${date}`];

//     for (const collectionName of collectionsToDelete) {
//       const snapshot = await db.collection(collectionName).get();
//       const batch = db.batch();

//       snapshot.docs.forEach((doc) => {
//         batch.delete(doc.ref);
//       });

//       await batch.commit();
//     }

//     res.status(200).json({ success: true, message: `History for ${date} deleted.` });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Failed to delete data for date' });
//   }
// };

// Export all functions
module.exports = {
  receiveData,
  getData,
  getLatestSensorData,
  getStatus,
  webSocketFeed,
  handleSensorDataAndImage,
  getSensorHistory,
  getFireDetectionHistory
}
