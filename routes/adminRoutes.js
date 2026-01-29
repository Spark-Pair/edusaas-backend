const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  getStats,
  getTenants,
  getTenant,
  createTenant,
  updateTenant,
  toggleStatus,
  deleteTenant
} = require('../controllers/adminController');

// All routes require admin authentication
router.use(verifyToken, adminOnly);

// Dashboard Stats
router.get('/stats', getStats);

// Tenants CRUD
router.get('/tenants', getTenants);
router.get('/tenants/:id', getTenant);
router.post('/tenants', createTenant);
router.put('/tenants/:id', updateTenant);
router.patch('/tenants/:id/status', toggleStatus);
router.delete('/tenants/:id', deleteTenant);

module.exports = router;
