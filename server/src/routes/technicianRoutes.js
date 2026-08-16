const express = require('express');
const { 
  createTechnician, 
  getTechnicians, 
  getTechnician, 
  updateTechnician, 
  deleteTechnician 
} = require('../controllers/technicianController');

const { 
  submitApplication, 
  getApplications, 
  reviewApplication 
} = require('../controllers/technicianApplicationController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

// 1. PUBLIC ROUTE: Submit job application (No auth required)
router.post('/apply', submitApplication);

// Apply auth protection and tenant scope enforcement to all subsequent routes
router.use(protect);
router.use(enforceTenant);

// 2. ADMIN ROUTES: Manage job requests
router.route('/applications')
  .get(authorize('company_admin'), getApplications);

router.route('/applications/:id')
  .put(authorize('company_admin'), reviewApplication);

// 3. CORE TECHNICIANS OPERATIONS
router.route('/')
  .post(authorize('company_admin'), createTechnician)
  .get(authorize('company_admin', 'dispatcher'), getTechnicians);

router.route('/:id')
  .get(getTechnician)
  .put(updateTechnician)
  .delete(authorize('company_admin'), deleteTechnician);

module.exports = router;
