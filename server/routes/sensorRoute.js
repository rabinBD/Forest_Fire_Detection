const express = require('express');
const { receiveData, getData, getLatestSensorData, getStatus, upload, predictImage } = require('../controller/sensorCtrl');

const router = express.Router();

router.post('/receive', receiveData);
router.get('/data', getData);
// router.get('/sensor-data', getLatestSensorData);
router.get('/status', getStatus);
router.get('/latest', getLatestSensorData);

router.post('/predict', upload.single('image'), predictImage)

module.exports = router;
