const express = require('express');
const router = express.Router();
const { getPublicStudent } = require('../controllers/studentController');

// Public student view (for QR scan)
router.get('/student/:id', getPublicStudent);

module.exports = router;
