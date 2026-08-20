const express = require('express');
const { createWorkOrder, getWorkOrders, getWorkOrder, updateWorkOrderStatus, acceptJob } = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

router.post('/accept/:requestId', authorize('technician'), acceptJob);

router.route('/')
  .post(authorize('company_admin', 'dispatcher'), createWorkOrder)
  .get(getWorkOrders);

router.route('/:id')
  .get(getWorkOrder);

router.patch('/:id/status', updateWorkOrderStatus);

module.exports = router;
