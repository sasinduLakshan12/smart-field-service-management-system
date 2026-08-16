const Technician = require('../models/Technician');
const User = require('../models/User');

// @desc    Create a technician profile (Admin only)
// @route   POST /api/v1/technicians
// @access  Private (Admin)
exports.createTechnician = async (req, res, next) => {
  try {
    const { name, email, skills, password } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create user
      user = await User.create({
        name,
        email,
        password: password || '123456',
        role: 'technician',
        companyId: req.user.companyId
      });
    }

    // Check if technician profile already exists for this tenant
    let technician = await Technician.findOne({ userId: user._id, companyId: req.user.companyId });
    if (technician) {
      return res.status(400).json({
        success: false,
        message: 'Technician profile already exists for this tenant'
      });
    }

    // Create profile
    technician = await Technician.create({
      userId: user._id,
      companyId: req.user.companyId,
      skills: skills || [],
      availabilityStatus: 'offline'
    });

    res.status(201).json({
      success: true,
      message: 'Technician profile created successfully',
      data: technician
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all technicians under current company tenant
// @route   GET /api/v1/technicians
// @access  Private (Admin/Dispatcher)
exports.getTechnicians = async (req, res, next) => {
  try {
    const { status, skill } = req.query;
    const filter = { ...req.tenantFilter };

    if (status) {
      filter.availabilityStatus = status;
    }
    if (skill) {
      filter.skills = { $in: [skill] };
    }

    const technicians = await Technician.find(filter).populate('userId', 'name email isActive');
    res.status(200).json({
      success: true,
      message: 'Technicians retrieved successfully',
      data: technicians
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single technician profile
// @route   GET /api/v1/technicians/:id
// @access  Private (Admin/Dispatcher/Technician themselves)
exports.getTechnician = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const technician = await Technician.findOne(filter).populate('userId', 'name email isActive');

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Technician details retrieved',
      data: technician
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update technician profile / status
// @route   PUT /api/v1/technicians/:id
// @access  Private (Admin/Technician themselves)
exports.updateTechnician = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const technician = await Technician.findOne(filter);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician profile not found'
      });
    }

    const { skills, availabilityStatus, currentLocation } = req.body;

    if (skills) technician.skills = skills;
    if (availabilityStatus) technician.availabilityStatus = availabilityStatus;
    if (currentLocation) {
      technician.currentLocation = {
        ...currentLocation,
        updatedAt: new Date()
      };
    }

    await technician.save();

    res.status(200).json({
      success: true,
      message: 'Technician updated successfully',
      data: technician
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete technician profile and their User login record
// @route   DELETE /api/v1/technicians/:id
// @access  Private (Admin only)
exports.deleteTechnician = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const technician = await Technician.findOne(filter);

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician profile not found'
      });
    }

    // Delete User login credential first
    await User.findByIdAndDelete(technician.userId);
    // Delete profile
    await Technician.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Technician deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
