const express = require('express');
const router = express.Router();
const { verifyToken, adminOnly } = require('../middleware/auth');
const {
  getStats,
  getTenants,
  getTenant,
  getTenantClasses,
  getTenantLastStudent,
  getTenantStudents,
  getCardTemplates,
  getCardTemplate,
  createCardTemplate,
  updateCardTemplate,
  useCardTemplate,
  deleteCardTemplate,
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
router.get('/tenants/:id/classes', getTenantClasses);
router.get('/tenants/:id/last-student', getTenantLastStudent);
router.get('/tenants/:id/students', getTenantStudents);

// Card templates
router.get('/card-templates', getCardTemplates);
router.get('/card-templates/:id', getCardTemplate);
router.post('/card-templates', createCardTemplate);
router.put('/card-templates/:id', updateCardTemplate);
router.post('/card-templates/:id/use', useCardTemplate);
router.delete('/card-templates/:id', deleteCardTemplate);

router.post('/tenants', createTenant);
router.put('/tenants/:id', updateTenant);
router.patch('/tenants/:id/status', toggleStatus);
router.delete('/tenants/:id', deleteTenant);

module.exports = router;
