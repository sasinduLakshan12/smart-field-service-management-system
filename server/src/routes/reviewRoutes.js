const express = require('express');
const { createReview, getReviews } = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

router.route('/')
  .post(authorize('customer'), createReview)
  .get(getReviews);

module.exports = router;
