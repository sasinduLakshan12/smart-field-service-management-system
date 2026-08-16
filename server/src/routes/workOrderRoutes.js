const express = require('express');
const { createWorkOrder, getWorkOrders, getWorkOrder, updateWorkOrderStatus } = require('../controllers/workOrderController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

router.route('/')
  .post(authorize('company_admin', 'dispatcher'), createWorkOrder)
  .get(getWorkOrders);

router.route('/:id')
  .get(getWorkOrder);

router.patch('/:id/status', updateWorkOrderStatus);

module.exports = router;
