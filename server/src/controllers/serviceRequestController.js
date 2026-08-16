const ServiceRequest = require('../models/ServiceRequest');
const Customer = require('../models/Customer');
const Service = require('../models/Service');

// @desc    Submit a service request
// @route   POST /api/v1/service-requests
// @access  Private (Customer)
exports.createRequest = async (req, res, next) => {
  try {
    const { serviceId, problemDescription, priority, preferredDate, address, additionalNotes } = req.body;

    // Get customer profile linked to the authenticated user
    let customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
    if (!customer) {
      // Auto-create a basic customer profile if they don't have one yet
      customer = await Customer.create({
        userId: req.user._id,
        companyId: req.user.companyId,
        phone: req.body.phone || '0000000000',
        addresses: [address]
      });
    }

    // Verify service belongs to company
    const service = await Service.findOne({ _id: serviceId, companyId: req.user.companyId });
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Selected service is invalid or not offered by this company'
      });
    }

    const request = await ServiceRequest.create({
      customerId: customer._id,
      companyId: req.user.companyId,
      serviceId,
      problemDescription,
      priority,
      preferredDate,
      address,
      additionalNotes
    });

    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all service requests
// @route   GET /api/v1/service-requests
// @access  Private (Customers see own, Admins/Dispatchers see all, Technicians see assigned)
exports.getRequests = async (req, res, next) => {
  try {
    const filter = { ...req.tenantFilter };

    // Enforce role-based access limits
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!customer) {
        return res.status(200).json({
          success: true,
          data: []
        });
      }
      filter.customerId = customer._id;
    }

    const requests = await ServiceRequest.find(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('serviceId', 'name price');

    res.status(200).json({
      success: true,
      message: 'Service requests retrieved successfully',
      data: requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single service request
// @route   GET /api/v1/service-requests/:id
// @access  Private
exports.getRequest = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    
    if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!customer) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
      filter.customerId = customer._id;
    }

    const request = await ServiceRequest.findOne(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('serviceId', 'name price');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service request details retrieved',
      data: request
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service request status
// @route   PATCH /api/v1/service-requests/:id/status
// @access  Private (Admin/Dispatcher)
exports.updateRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const request = await ServiceRequest.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    request.status = status;
    await request.save();

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status}`,
      data: request
    });
  } catch (error) {
    next(error);
  }
};
