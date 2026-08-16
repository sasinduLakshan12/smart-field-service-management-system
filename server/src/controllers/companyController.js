const Company = require('../models/Company');

// @desc    Create a new company tenant
// @route   POST /api/v1/companies
// @access  Private (Super Admin only)
exports.createCompany = async (req, res, next) => {
  try {
    const { name, email, phone, address, settings } = req.body;

    const companyExists = await Company.findOne({ name });
    if (companyExists) {
      return res.status(400).json({
        success: false,
        message: 'Company name is already registered'
      });
    }

    const company = await Company.create({
      name,
      email,
      phone,
      address,
      settings
    });

    res.status(201).json({
      success: true,
      message: 'Company tenant created successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all companies
// @route   GET /api/v1/companies
// @access  Private (Super Admin only, or restricted to own for Company Admins)
exports.getCompanies = async (req, res, next) => {
  try {
    let companies;

    if (req.user.role === 'super_admin') {
      companies = await Company.find();
    } else {
      // Company Admins/Dispatchers/etc. can only see their own company details
      companies = await Company.find({ _id: req.user.companyId });
    }

    res.status(200).json({
      success: true,
      message: 'Companies retrieved successfully',
      data: companies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single company by ID
// @route   GET /api/v1/companies/:id
// @access  Private (Super Admin, or Company Admin/Dispatcher of same company)
exports.getCompany = async (req, res, next) => {
  try {
    const companyId = req.params.id;

    // Tenant Check: Non-super_admins can only fetch their own company
    if (req.user.role !== 'super_admin' && req.user.companyId.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view this company details'
      });
    }

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Company details retrieved',
      data: company
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update company details
// @route   PUT /api/v1/companies/:id
// @access  Private (Super Admin, or Company Admin of same company)
exports.updateCompany = async (req, res, next) => {
  try {
    const companyId = req.params.id;

    // Tenant Check: Only Super Admin or own Company Admin can update company info
    if (req.user.role !== 'super_admin') {
      if (req.user.role !== 'company_admin' || req.user.companyId.toString() !== companyId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You are not authorized to update this company details'
        });
      }
    }

    const { name, email, phone, address, settings, subscriptionStatus, isActive } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Restrict subscription status and activation status updates to Super Admin only
    if (req.user.role !== 'super_admin') {
      if (subscriptionStatus !== undefined || isActive !== undefined) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Only Super Admin can change subscription or activation states'
        });
      }
    }

    // Apply updates
    if (name) company.name = name;
    if (email) company.email = email;
    if (phone) company.phone = phone;
    if (address) company.address = address;
    if (settings) company.settings = { ...company.settings, ...settings };
    if (req.user.role === 'super_admin') {
      if (subscriptionStatus) company.subscriptionStatus = subscriptionStatus;
      if (isActive !== undefined) company.isActive = isActive;
    }

    await company.save();

    res.status(200).json({
      success: true,
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    next(error);
  }
};
