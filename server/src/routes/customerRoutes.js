const express = require('express');
const { createCustomer, getCustomers, getCustomer, updateCustomer } = require('../controllers/customerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Apply auth protection and tenant scope enforcement to all routes
router.use(protect);
router.use(enforceTenant);

router.route('/')
  .post(authorize('company_admin', 'dispatcher'), createCustomer)
  .get(authorize('company_admin', 'dispatcher'), getCustomers);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer);

module.exports = router;
