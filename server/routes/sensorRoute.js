const express = require('express');
const { receiveData, getData, getLatestSensorData, getStatus, upload, predictImage, webSocketFeed, handleSensorDataAndImage} = require('../controller/sensorCtrl');

// Export a function that accepts broadcast and returns the router
module.exports = function (broadcast) {
  const router = express.Router();

  router.post('/receivesensordata', (req, res) => webSocketFeed(req, res, broadcast));
  router.get('/data', getData);
  router.get('/latest', getLatestSensorData);
  router.get('/status', getStatus);
  router.post('/predict', upload.single('image'), predictImage);

  router.post('/data', upload.single('image'), (req, res) => handleSensorDataAndImage(req, res, broadcast));

  return router; 
};
