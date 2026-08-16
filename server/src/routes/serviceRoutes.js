const express = require('express');
const { 
  createCategory, 
  getCategories, 
  createService, 
  getServices, 
  getService, 
  updateService, 
  deleteService,
  getPublicServices 
} = require('../controllers/serviceController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');
const { cache } = require('../middleware/cacheMiddleware');

const router = express.Router();

// 1. PUBLIC ROUTES (No auth, no tenant filtering constraints)
router.get('/public', getPublicServices);

// Apply auth protection and tenant scope to admin/private operations
router.use(protect);
router.use(enforceTenant);

// Middleware helper to invalidate caching
const { invalidateCache } = require('../middleware/cacheMiddleware');
const clearServiceCache = (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      invalidateCache(req.user?.companyId?.toString(), 'services*');
    }
  });
  next();
};

// 2. PRIVATE / ADMIN CATEGORIES
router.route('/categories')
  .post(authorize('company_admin'), clearServiceCache, createCategory)
  .get(cache(300), getCategories);

// 3. PRIVATE / ADMIN SERVICES
router.route('/')
  .post(authorize('company_admin'), clearServiceCache, createService)
  .get(cache(300), getServices);

router.route('/:id')
  .get(getService)
  .put(authorize('company_admin'), clearServiceCache, updateService)
  .delete(authorize('company_admin'), clearServiceCache, deleteService);

module.exports = router;
