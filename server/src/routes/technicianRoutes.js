const express = require('express');
const { createTechnician, getTechnicians, getTechnician, updateTechnician } = require('../controllers/technicianController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Apply auth protection and tenant scope enforcement to all routes
router.use(protect);
router.use(enforceTenant);

router.route('/')
  .post(authorize('company_admin'), createTechnician)
  .get(authorize('company_admin', 'dispatcher'), getTechnicians);

router.route('/:id')
  .get(getTechnician)
  .put(updateTechnician);

module.exports = router;
