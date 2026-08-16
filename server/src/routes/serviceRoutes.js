const express = require('express');
const { createCategory, getCategories, createService, getServices, getService, updateService } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

// Categories
router.route('/categories')
  .post(authorize('company_admin'), createCategory)
  .get(getCategories);

// Services
router.route('/')
  .post(authorize('company_admin'), createService)
  .get(getServices);

router.route('/:id')
  .get(getService)
  .put(authorize('company_admin'), updateService);

module.exports = router;
