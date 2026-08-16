const WorkOrder = require('../models/WorkOrder');
const ServiceRequest = require('../models/ServiceRequest');
const Technician = require('../models/Technician');
const Customer = require('../models/Customer');

// @desc    Assign technician and create Work Order
// @route   POST /api/v1/work-orders
// @access  Private (Admin/Dispatcher)
exports.createWorkOrder = async (req, res, next) => {
  try {
    const { requestId, technicianId, scheduledDate, notes } = req.body;

    // Fetch service request details
    const serviceRequest = await ServiceRequest.findOne({ _id: requestId, companyId: req.user.companyId }).populate('serviceId');
    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: 'Service request not found'
      });
    }

    // Fetch technician details
    const technician = await Technician.findOne({ _id: technicianId, companyId: req.user.companyId });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found'
      });
    }

    // Verify technician availability
    if (technician.availabilityStatus === 'offline') {
      return res.status(400).json({
        success: false,
        message: 'Selected technician is currently offline'
      });
    }

    // Validate technician skills against required service skills
    const requiredSkills = serviceRequest.serviceId.requiredSkills || [];
    const technicianSkills = technician.skills || [];
    const hasRequiredSkills = requiredSkills.every(skill => technicianSkills.includes(skill));

    if (!hasRequiredSkills) {
      return res.status(400).json({
        success: false,
        message: 'Technician does not possess the required skills for this service'
      });
    }

    // Create Work Order
    const workOrder = await WorkOrder.create({
      requestId,
      companyId: req.user.companyId,
      customerId: serviceRequest.customerId,
      technicianId,
      serviceId: serviceRequest.serviceId._id,
      scheduledDate,
      notes
    });

    // Update ServiceRequest status
    serviceRequest.status = 'Assigned';
    await serviceRequest.save();

    res.status(201).json({
      success: true,
      message: 'Technician assigned and Work Order generated successfully',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all work orders
// @route   GET /api/v1/work-orders
// @access  Private (Admin/Dispatcher sees all, Technician sees assigned, Customer sees own)
exports.getWorkOrders = async (req, res, next) => {
  try {
    const filter = { ...req.tenantFilter };

    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!technician) {
        return res.status(200).json({ success: true, data: [] });
      }
      filter.technicianId = technician._id;
    } else if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!customer) {
        return res.status(200).json({ success: true, data: [] });
      }
      filter.customerId = customer._id;
    }

    const workOrders = await WorkOrder.find(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate({
        path: 'technicianId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate('serviceId', 'name price estimatedDuration');

    res.status(200).json({
      success: true,
      message: 'Work orders retrieved successfully',
      data: workOrders
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single work order details
// @route   GET /api/v1/work-orders/:id
// @access  Private
exports.getWorkOrder = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };

    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!technician) return res.status(403).json({ success: false, message: 'Access denied' });
      filter.technicianId = technician._id;
    } else if (req.user.role === 'customer') {
      const customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!customer) return res.status(403).json({ success: false, message: 'Access denied' });
      filter.customerId = customer._id;
    }

    const workOrder = await WorkOrder.findOne(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name email' }
      })
      .populate({
        path: 'technicianId',
        populate: { path: 'userId', select: 'name' }
      })
      .populate('serviceId', 'name price estimatedDuration');

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Work order details retrieved',
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Work Order status (Travelling, Arrived, In Progress, Completed, etc.)
// @route   PATCH /api/v1/work-orders/:id/status
// @access  Private (Technician/Admin/Dispatcher)
exports.updateWorkOrderStatus = async (req, res, next) => {
  try {
    const { status, notes, parts, laborCost, attachments } = req.body;
    const filter = { _id: req.params.id, ...req.tenantFilter };

    // If technician, ensure they are the assigned technician
    if (req.user.role === 'technician') {
      const technician = await Technician.findOne({ userId: req.user._id, companyId: req.user.companyId });
      if (!technician) {
        return res.status(403).json({ success: false, message: 'Technician profile not found' });
      }
      filter.technicianId = technician._id;
    }

    const workOrder = await WorkOrder.findOne(filter);
    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: 'Work order not found'
      });
    }

    // Apply status update
    if (status) {
      workOrder.status = status;
      
      // Auto-set timestamps based on status
      if (status === 'In Progress') {
        workOrder.startTime = new Date();
      } else if (status === 'Completed') {
        workOrder.endTime = new Date();
        
        // Handle completion data and billing calculations
        if (parts) {
          workOrder.parts = parts;
          workOrder.partsCost = parts.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        }
        if (laborCost !== undefined) {
          workOrder.laborCost = laborCost;
        }
        workOrder.totalCost = workOrder.partsCost + workOrder.laborCost;
      }
    }

    if (notes) workOrder.notes = notes;
    if (attachments) workOrder.attachments = attachments;

    await workOrder.save();

    // Sync status to the parent Service Request
    const serviceRequest = await ServiceRequest.findById(workOrder.requestId);
    if (serviceRequest) {
      serviceRequest.status = status;
      await serviceRequest.save();
    }

    res.status(200).json({
      success: true,
      message: `Work Order status updated to ${status}`,
      data: workOrder
    });
  } catch (error) {
    next(error);
  }
};

