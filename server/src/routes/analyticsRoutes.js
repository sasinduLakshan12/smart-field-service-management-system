const express = require('express');
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

router.get('/dashboard', authorize('company_admin', 'dispatcher'), getDashboardAnalytics);

module.exports = router;
