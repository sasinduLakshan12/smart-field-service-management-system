const express = require('express');
const { updateTechnicianLocation, getTechnicianLocation } = require('../controllers/locationController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

router.post('/technician', authorize('technician'), updateTechnicianLocation);
router.get('/track/:workOrderId', getTechnicianLocation);

module.exports = router;
