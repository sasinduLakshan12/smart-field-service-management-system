const express = require('express');
const { generateInvoice, getInvoices, getInvoice, recordPayment } = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { enforceTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

router.use(protect);
router.use(enforceTenant);

// Invoices
router.route('/invoices')
  .post(authorize('company_admin', 'dispatcher'), generateInvoice)
  .get(getInvoices);

router.route('/invoices/:id')
  .get(getInvoice);

// Payments
router.route('/payments')
  .post(recordPayment);

module.exports = router;
