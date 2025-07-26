const express = require('express');
const { getSuppressionStatus, setSuppressionStatus } = require('../controller/notifySuppressionCtrl');
const router = express.Router();

// Get suppression status
router.get('/suppression', getSuppressionStatus);
// Set suppression status (pause/resume)
router.post('/suppression', setSuppressionStatus);

module.exports = router;
