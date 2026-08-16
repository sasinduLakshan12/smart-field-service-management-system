const Review = require('../models/Review');
const WorkOrder = require('../models/WorkOrder');
const Technician = require('../models/Technician');
const Customer = require('../models/Customer');

// @desc    Submit a review for a completed work order
// @route   POST /api/v1/reviews
// @access  Private (Customer only)
exports.createReview = async (req, res, next) => {
  try {
    const { workOrderId, rating, comment } = req.body;

    // Verify customer profile
    const customer = await Customer.findOne({ userId: req.user._id, companyId: req.user.companyId });
    if (!customer) {
      return res.status(403).json({ success: false, message: 'Access denied: Customer profile not found' });
    }

    // Verify work order
    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      customerId: customer._id,
      companyId: req.user.companyId
    });

    if (!workOrder) {
      return res.status(404).json({ success: false, message: 'Work order not found' });
    }

    if (workOrder.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Reviews are only allowed after job completion' });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ workOrderId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this work order' });
    }

    // Create Review
    const review = await Review.create({
      companyId: req.user.companyId,
      workOrderId,
      customerId: customer._id,
      technicianId: workOrder.technicianId,
      rating,
      comment
    });

    // Recalculate technician rating metrics
    const reviews = await Review.find({ technicianId: workOrder.technicianId });
    const count = reviews.length;
    const average = reviews.reduce((sum, r) => sum + r.rating, 0) / count;

    await Technician.findByIdAndUpdate(workOrder.technicianId, {
      'ratings.average': parseFloat(average.toFixed(1)),
      'ratings.count': count
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (optional filter by technicianId)
// @route   GET /api/v1/reviews
// @access  Private
exports.getReviews = async (req, res, next) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.technicianId) {
      filter.technicianId = req.query.technicianId;
    }

    const reviews = await Review.find(filter)
      .populate({
        path: 'customerId',
        populate: { path: 'userId', select: 'name' }
      })
      .populate({
        path: 'technicianId',
        populate: { path: 'userId', select: 'name' }
      })
      .populate('workOrderId', 'notes')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};
