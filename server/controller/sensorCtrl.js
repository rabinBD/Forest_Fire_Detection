const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');
const sendEmail = require('../services/mailer');

// Handle receiving new sensor data
const receiveData = async (req, res) => {
  const data = {
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    smoke: req.body.smoke,
    flame: req.body.flame === true || req.body.flame === 'true',
    fireDetected: req.body.fireDetected,
    timestamp: new Date().toISOString(),
  };

  await db.collection('fire_readings').add(data);

  if (data.fireDetected) {
    const tokensSnapshot = await db.collection('admin_tokens').get();
    tokensSnapshot.forEach(async (doc) => {
      const token = doc.data().token;
      try {
        await admin.messaging().send({
          notification: {
            title: 'Fire Alert',
            body: `Temp: ${data.temperature}°C, Smoke: ${data.smoke}`,
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

// WebSocket broadcast with flame data
const webSocketFeed = async (req, res, broadcast) => {
  const data = {
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    smoke: req.body.smoke,
    flame: req.body.flame === true || req.body.flame === 'true',
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('Sensor Data:', data);

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

// Return last 100 entries
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

// Get latest single sensor data
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
      gas: doc.smoke,
      flame: doc.flame,
      fireDetected: doc.fireDetected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fire status string
const getStatus = async (req, res) => {
  try {
    const snapshot = await db
      .collection('fire_readings')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    const doc = snapshot.docs[0]?.data();
    const status = doc?.fireDetected ? "🔥 Fire Detected!" : "✅ Normal";

    res.status(200).json({ status });
  } catch (error) {
    res.status(500).json({ status: "❌ Status unavailable" });
  }
};

// Setup for multer to store uploaded image
const uploadDir = path.join(__dirname, '..', 'uploadIMG');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// Controller function to handle prediction
const predictImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const imagePath = path.resolve(req.file.path);
  const fileName = path.basename(imagePath);
  const imageUrl = `https://a36bdfcc8298.ngrok-free.app/images/${fileName}`;

  const pythonProcess = spawn('python', [
    'D:\\fireDetectionBackend\\server\\model\\predict.py',
    imagePath
  ]);

  let responseSent = false;
  let result = null;
  let errorMessage = null;

  function sendOnce(callback) {
    if (!responseSent) {
      responseSent = true;
      callback();
    }
  }

  pythonProcess.stdout.on('data', (data) => {
    result = data.toString().trim();
  });

  pythonProcess.stderr.on('data', (err) => {
    errorMessage = err.toString();
    console.error('Python Error:', errorMessage);
  });

  pythonProcess.on('close', async (code) => {
    if (errorMessage && errorMessage.toLowerCase().includes('traceback')) {
      return sendOnce(() => res.status(500).json({ error: 'Prediction failed' }));
    }

    if (result === 'fire') {
      try {
        await sendEmail(imageUrl);
        return sendOnce(() => res.status(200).json({
          fire: true,
          imageUrl,
          message: '🔥 Fire detected! Email alert sent.'
        }));
      } catch (err) {
        return sendOnce(() => res.status(500).json({
          fire: true,
          imageUrl,
          message: 'Fire detected, but email failed.'
        }));
      }
    }

    if (result === 'nofire') {
      return sendOnce(() => res.status(200).json({
        fire: false,
        message: 'No fire detected.'
      }));
    }

    return sendOnce(() => res.status(500).json({ error: 'Unexpected result' }));
  });
};

// Unified handler
const handleSensorDataAndImage = async (req, res, broadcast) => {
  try {
    const sensorData = {
      temperature: req.body.temperature ? parseFloat(req.body.temperature) : null,
      humidity: req.body.humidity ? parseFloat(req.body.humidity) : null,
      smoke: req.body.smoke ? parseFloat(req.body.smoke) : null,
      flame: req.body.flame === true || req.body.flame === 'true',
      timestamp: new Date().toISOString(),
    };

    let responseData = { success: true, message: 'Data processed' };

    if (sensorData.temperature || sensorData.humidity || sensorData.smoke || sensorData.flame !== null) {
      await db.collection('fire_readings').add(sensorData);
      broadcast({ type: 'sensor_update', data: sensorData });
      console.log('Sensor Data:', sensorData);
      responseData.message = 'Sensor data received';
    }

    if (req.file) {
      const imagePath = path.resolve(req.file.path);
      const fileName = path.basename(imagePath);
      const imageUrl = `https://8ae2ab392250.ngrok-free.app/images/${fileName}`;

      const pythonProcess = spawn('python', [
        'D:\\fireDetectionBackend\\server\\model\\predict.py',
        imagePath
      ]);

      let responseSent = false;
      let result = null;
      let errorMessage = null;

      const sendOnce = (callback) => {
        if (!responseSent) {
          responseSent = true;
          callback();
        }
      };

      pythonProcess.stdout.on('data', (data) => {
        result = data.toString().trim();
      });

      pythonProcess.stderr.on('data', (err) => {
        errorMessage = err.toString();
        console.error('Python Error:', errorMessage);
      });

      pythonProcess.on('close', async (code) => {
        if (errorMessage && errorMessage.toLowerCase().includes('traceback')) {
          return sendOnce(() =>
            res.status(500).json({ error: 'Prediction failed from Python script' })
          );
        }

        if (result === 'fire') {
          try {
            await db.collection('fire_readings').add({
              ...sensorData,
              fireDetected: true,
              imageUrl,
              timestamp: new Date().toISOString(),
            });

            await sendEmail(imageUrl);
            responseData.fire = true;
            responseData.imageUrl = imageUrl;
            responseData.message += ' | 🔥 Fire detected via image!';
            return sendOnce(() => res.status(200).json(responseData));
          } catch (err) {
            responseData.fire = true;
            responseData.imageUrl = imageUrl;
            responseData.message += ' | Fire detected but failed to send email.';
            return sendOnce(() => res.status(500).json(responseData));
          }
        } else if (result === 'nofire') {
          responseData.fire = false;
          responseData.imageUrl = imageUrl;
          responseData.message += ' | No fire detected in image.';
          return sendOnce(() => res.status(200).json(responseData));
        } else {
          return sendOnce(() =>
            res.status(500).json({ error: 'Unexpected result from prediction script' })
          );
        }
      });
    } else {
      return res.status(200).json(responseData);
    }
  } catch (err) {
    console.error('Error processing request:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  receiveData,
  getData,
  getLatestSensorData,
  getStatus,
  upload,
  predictImage,
  webSocketFeed,
  handleSensorDataAndImage
};
