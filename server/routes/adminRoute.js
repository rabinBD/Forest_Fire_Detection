const express = require('express');
const router = express.Router();
const { deleteAllSuppressionLogs } = require('../controller/adminDeleteCtrl');
const authMiddleware = require('../middlewares/authMiddleware');

// Admin-only: delete all suppression logs
router.delete('/delete-logs', authMiddleware, deleteAllSuppressionLogs);

module.exports = router;
