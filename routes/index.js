const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const tenantRoutes = require('./tenantRoutes');
const publicRoutes = require('./publicRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/tenant', tenantRoutes);
router.use('/public', publicRoutes);

module.exports = router;
