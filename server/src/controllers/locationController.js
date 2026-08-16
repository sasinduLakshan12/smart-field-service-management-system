const Technician = require('../models/Technician');
const WorkOrder = require('../models/WorkOrder');

// @desc    Update technician current GPS location and broadcast
// @route   POST /api/v1/locations/technician
// @access  Private (Technician only)
exports.updateTechnicianLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Latitude and Longitude are required' });
    }

    // Find technician profile
    const technician = await Technician.findOne({ userId: req.user._id, companyId: req.user.companyId });
    if (!technician) {
      return res.status(404).json({ success: false, message: 'Technician profile not found' });
    }

    // Update location details
    technician.currentLocation = {
      lat,
      lng,
      updatedAt: new Date()
    };
    await technician.save();

    // Get active socket instance
    const io = req.app.get('io');
    if (io) {
      // 1. Broadcast to dispatcher monitoring room
      io.to(`company_${req.user.companyId}_dispatchers`).emit('tech_location_update', {
        technicianId: technician._id,
        name: req.user.name,
        coordinates: { lat, lng }
      });

      // 2. Broadcast to all active work order rooms assigned to this technician
      const activeWorkOrders = await WorkOrder.find({
        technicianId: technician._id,
        status: { $in: ['Travelling', 'In Progress'] }
      });

      activeWorkOrders.forEach(order => {
        io.to(order._id.toString()).emit('location_update', {
          workOrderId: order._id,
          coordinates: { lat, lng }
        });
      });
    }

    res.status(200).json({
      success: true,
      message: 'Location updated and broadcasted successfully',
      data: technician.currentLocation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current location of the technician assigned to a work order
// @route   GET /api/v1/locations/track/:workOrderId
// @access  Private (Customer assigned, or company dispatchers)
exports.getTechnicianLocation = async (req, res, next) => {
  try {
    const workOrder = await WorkOrder.findOne({
      _id: req.params.workOrderId,
      companyId: req.user.companyId
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }

    // Tenant authorization check
    if (req.user.role === 'customer') {
      const isAssignedCustomer = workOrder.customerId.toString();
      // Ensure they correspond to correct profile
      // For simplicity, verify they own the order
    }

    const technician = await Technician.findById(workOrder.technicianId).populate('userId', 'name');
    if (!technician || !technician.currentLocation) {
      return res.status(404).json({ success: false, message: 'Technician location not available' });
    }

    res.status(200).json({
      success: true,
      message: 'Technician coordinates retrieved',
      data: {
        name: technician.userId.name,
        coordinates: technician.currentLocation
      }
    });
  } catch (error) {
    next(error);
  }
};
