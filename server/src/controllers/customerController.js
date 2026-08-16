const Customer = require('../models/Customer');
const User = require('../models/User');

// @desc    Create a customer profile (often called during admin onboarding)
// @route   POST /api/v1/customers
// @access  Private (Admin/Dispatcher)
exports.createCustomer = async (req, res, next) => {
  try {
    const { name, email, phone, addresses, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // If user doesn't exist, create one
      user = await User.create({
        name,
        email,
        password: password || '123456', // default password if not provided
        role: 'customer',
        companyId: req.user.companyId
      });
    }

    // Check if customer profile already exists for this tenant
    let customer = await Customer.findOne({ userId: user._id, companyId: req.user.companyId });
    if (customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer profile already exists for this tenant'
      });
    }

    // Create profile
    customer = await Customer.create({
      userId: user._id,
      companyId: req.user.companyId,
      phone,
      addresses
    });

    res.status(201).json({
      success: true,
      message: 'Customer profile created successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all customers under current company tenant
// @route   GET /api/v1/customers
// @access  Private (Admin/Dispatcher)
exports.getCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.find(req.tenantFilter).populate('userId', 'name email isActive');
    res.status(200).json({
      success: true,
      message: 'Customers retrieved successfully',
      data: customers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer profile
// @route   GET /api/v1/customers/:id
// @access  Private (Admin/Dispatcher/Customer themselves)
exports.getCustomer = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const customer = await Customer.findOne(filter).populate('userId', 'name email isActive');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Customer details retrieved',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer profile
// @route   PUT /api/v1/customers/:id
// @access  Private (Admin/Dispatcher/Customer themselves)
exports.updateCustomer = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const customer = await Customer.findOne(filter);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer profile not found'
      });
    }

    const { phone, addresses } = req.body;
    if (phone) customer.phone = phone;
    if (addresses) customer.addresses = addresses;

    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    next(error);
  }
};
