const express = require('express');
const router = express.Router();
const { login, verifyToken: verifyTokenController } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Unified Login - Single endpoint for both admin and tenant
router.post('/login', login);

// Verify Token
router.get('/verify', verifyToken, verifyTokenController);

module.exports = router;
