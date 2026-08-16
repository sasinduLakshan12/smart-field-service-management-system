const express = require('express');
const { createCompany, getCompanies, getCompany, updateCompany } = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
  .post(protect, authorize('super_admin'), createCompany)
  .get(protect, getCompanies);

router.route('/:id')
  .get(protect, getCompany)
  .put(protect, updateCompany);

module.exports = router;
