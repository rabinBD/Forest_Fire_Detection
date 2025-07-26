const express = require('express');
const router = express.Router();
const { getSuppressionLogs } = require('../controller/notifyLogsCtrl');

// GET /api/notify/logs?limit=10&page=1
router.get('/logs', getSuppressionLogs);

module.exports = router;
