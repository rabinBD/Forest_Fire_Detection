const express = require('express');
const { receiveData, getData, getLatestSensorData, getStatus, upload, webSocketFeed, handleSensorDataAndImage, getFireDetectionHistory, getSensorHistory, deleteHistoryByDate } = require('../controller/sensorCtrl');
const auth = require('../middlewares/authMiddleware');

// Export a function that accepts broadcast and returns the router
module.exports = function (broadcast) {
  const router = express.Router();

  // router.post('/receivesensordata', (req, res) => webSocketFeed(req, res, broadcast));
  //router.post('/receivesensordata', receiveData);
  // router.get('/data', getData);// old route
  // router.get('/latest', getLatestSensorData);// old route
  // router.get('/status', getStatus);// old route
  // // router.post('/predict', upload.single('image'), predictImage);
  // router.post('/data', upload.single('image'), (req, res) => handleSensorDataAndImage(req, res, broadcast));

  //updated routes
  router.post('/data', express.raw({ type: 'image/jpeg', limit: '5mb' }), (req, res) => handleSensorDataAndImage(req, res, broadcast));

  router.get('/getDetectData', getFireDetectionHistory);

  router.get('/getSensorHistory', getSensorHistory)

  // router.delete('/deleteHistory/:date', auth, deleteHistoryByDate);

  return router;
};
