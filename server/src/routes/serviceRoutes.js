const express = require('express');
const { createCategory, getCategories, createService, getServices, getService, updateService, deleteService } = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');
const { cache, invalidateCache } = require('../middleware/cacheMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

// Middleware helper to clear cache on modifications
const clearServiceCache = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCache(req.user?.companyId?.toString(), 'services*');
    }
  });
  next();
};

// Categories
router.route('/categories')
  .post(authorize('company_admin'), clearServiceCache, createCategory)
  .get(cache(300), getCategories);

// Services
router.route('/')
  .post(authorize('company_admin'), clearServiceCache, createService)
  .get(cache(300), getServices);

router.route('/:id')
  .get(getService)
  .put(authorize('company_admin'), clearServiceCache, updateService)
  .delete(authorize('company_admin'), clearServiceCache, deleteService);

module.exports = router;
