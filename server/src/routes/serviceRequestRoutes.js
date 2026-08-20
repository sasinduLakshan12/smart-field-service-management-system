const express = require('express');
const { createRequest, getRequests, getRequest, updateRequestStatus, expressInterest } = require('../controllers/serviceRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

router.post('/:id/interest', authorize('technician'), expressInterest);

router.route('/')
  .post(authorize('customer'), createRequest)
  .get(getRequests);

router.route('/:id')
  .get(getRequest);

router.patch('/:id/status', authorize('company_admin', 'dispatcher'), updateRequestStatus);

module.exports = router;
