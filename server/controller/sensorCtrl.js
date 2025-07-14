const { db } = require('../config/firebase');
const admin = require('firebase-admin');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { spawn } = require('child_process');

// Handle receiving new sensor data
const receiveData = async (req, res) => {
  const data = {
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    smoke: req.body.smoke,
    fireDetected: req.body.fireDetected,
    timestamp: new Date().toISOString(),
  };

  // Store sensor data
  await db.collection('fire_readings').add(data);

  // If fire detected, notify all admins
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

// ✅ Get latest single sensor data (for dashboard)
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
        fireDetected: null,
      });
    }

    const doc = snapshot.docs[0].data();

    res.status(200).json({
      temperature: doc.temperature,
      humidity: doc.humidity,
      gas: doc.smoke,
      fireDetected: doc.fireDetected,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get fire status string
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
  fs.mkdirSync(uploadDir); // Create the folder if it doesn't exist
}

//Set up Multer to store uploaded images
const storage = multer.diskStorage({
  destination: uploadDir, // Save images to 'uploadIMG' folder
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

  const imagePath = path.resolve(req.file.path); // Get full path to image
  console.log("Uploaded image path:", req.file.path);
  console.log("image path sent to Python:", imagePath);

  // Run the Python script with image path as argument
  const pythonProcess = spawn('python', [
    'D:\\fireDetectionBackend\\server\\model\\predict.py',
    imagePath
  ]);

  let responseSent = false;

  // When Python sends output (like "fire" or "nofire")
  pythonProcess.stdout.on('data', (data) => {
    const result = data.toString().trim(); // Convert Buffer to string
    console.log("Python response:", result);

    if (!responseSent) {
      if (result === 'fire') {
        res.json({ fire: true });
        responseSent = true;
      } else if (result === 'nofire') {
        res.json({ fire: false });
        responseSent = true;
      }
    }
  });

  // If Python sends error output
  pythonProcess.stderr.on('data', (error) => {
    const errMessage = error.toString();
    console.error('PYTHON STDERR:', errMessage);

    // Ignore harmless TensorFlow warnings
    const isRealError =
      errMessage.toLowerCase().includes('traceback') ||
      (errMessage.toLowerCase().includes('error') &&
        !errMessage.includes('onednn') &&
        !errMessage.includes('cpu_feature_guard') &&
        !errMessage.includes('tensorflow'));

    if (isRealError && !responseSent) {
      res.status(500).json({ error: 'Prediction failed' });
      responseSent = true;
    }
  });

  // When Python process ends
  pythonProcess.on('close', (code) => {
    console.log("Python exited with code:", code);

    if (!responseSent) {
      if (code !== 0) {
        res.status(500).json({ error: 'Prediction process exited with error' });
      } else {
        res.status(500).json({ error: 'Unexpected prediction result' });
      }
    }
  });
};

//export all functions
module.exports = {
  receiveData,
  getData,
  getLatestSensorData,
  getStatus,
  upload,
  predictImage
};
