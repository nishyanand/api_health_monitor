const express = require('express');
const router = express.Router();
const { checkNow, generateReport } = require('../controllers/api.controller');
const { protect } = require('../middlewares/auth.middleware');

router.get('/check', protect, checkNow);
router.post('/report', protect, generateReport);

module.exports = router;