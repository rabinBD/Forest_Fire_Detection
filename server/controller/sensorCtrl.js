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

// This function will handle WebSocket data reception and broadcasting
const webSocketFeed = async (req, res, broadcast) => {
  const data = {
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    smoke: req.body.smoke,
    timestamp: new Date().toISOString(),
  };

  try {
    // Optional: store in database (e.g., Firebase, Firestore)

    console.log('Sensor Data:', data);

    //Send to WebSocket clients
    broadcast({
      type: 'sensor_update',
      data: data,
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

  const fileName = path.basename(imagePath);
  const imageUrl = ` https://a36bdfcc8298.ngrok-free.app/images/${fileName}`; // Construct URL for the image
  console.log("uploaded image URL:", fileName);


  // Run the Python script with image path as argument
  const pythonProcess = spawn('python', [
    'D:\\fireDetectionBackend\\server\\model\\predict.py',
    imagePath
  ]);

  let responseSent = false;   // Make sure we only send response once
  let result = null;          // Store Python result like "fire" or "nofire"
  let errorMessage = null;    // Store any error messages from Python

  // Helper to send a response only once
  function sendOnce(callback) {
    if (!responseSent) {
      responseSent = true;
      callback();
    }
  }

  //Get output from Python (standard output)
  pythonProcess.stdout.on('data', (data) => {
    result = data.toString().trim();  // Save prediction result
  });

  // Get errors from Python (standard error)
  pythonProcess.stderr.on('data', (err) => {
    errorMessage = err.toString();
    console.error('Python Error:', errorMessage);
  });

  // When Python script finishes
  pythonProcess.on('close', async (code) => {

    // Check if error message is serious
    if (errorMessage) {
      const seriousError = errorMessage.toLowerCase().includes('traceback') ||
        (errorMessage.toLowerCase().includes('error') &&
          !errorMessage.includes('onednn') &&
          !errorMessage.includes('cpu_feature_guard') &&
          !errorMessage.includes('tensorflow'));

      if (seriousError) {
        return sendOnce(() => res.status(500).json({ error: 'Prediction failed from Python script' }));
      }
    }

    // If result is "fire"
    if (result === 'fire') {
      try {
        await sendEmail(imageUrl);  // Send alert email
        console.log('Email sent successfully');

        return sendOnce(() => res.status(200).json({
          fire: true,
          imageUrl,
          message: '🔥 Fire detected! Email alert sent.'
        }));
      } catch (err) {
        console.error('Email sending failed:', err.message);

        return sendOnce(() => res.status(500).json({
          fire: true,
          imageUrl,
          message: 'Fire detected, but failed to send email.'
        }));
      }
    }

    // If result is "nofire"
    if (result === 'nofire') {
      return sendOnce(() => res.status(200).json({
        fire: false,
        message: 'No fire detected.'
      }));
    }

    // If something went wrong and no result was received
    if (code !== 0) {
      return sendOnce(() => res.status(500).json({ error: 'Python process ended with an error.' }));
    }

    // If no result and no error — fallback case
    return sendOnce(() => res.status(500).json({ error: 'Unexpected result from prediction script.' }));
  });
}


//export all functions
module.exports = {
  receiveData,
  getData,
  getLatestSensorData,
  getStatus,
  upload,
  predictImage,
  webSocketFeed
}
