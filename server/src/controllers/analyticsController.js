const WorkOrder = require('../models/WorkOrder');
const ServiceRequest = require('../models/ServiceRequest');
const Invoice = require('../models/Invoice');
const Technician = require('../models/Technician');
const Service = require('../models/Service');

// @desc    Get dashboard metrics for Company Admin
// @route   GET /api/v1/analytics/dashboard
// @access  Private (Admin/Dispatcher)
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    const companyId = req.user.companyId;

    // 1. Calculate Request Status Distribution
    const statusAgg = await ServiceRequest.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const requestStatusDistribution = statusAgg.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});

    // 2. Calculate Total Revenue (Paid Invoices)
    const revenueAgg = await Invoice.aggregate([
      { $match: { companyId, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // 3. Calculate Average Completion Duration (in minutes)
    const completedOrders = await WorkOrder.find({
      companyId,
      status: 'Completed',
      startTime: { $exists: true },
      endTime: { $exists: true }
    });

    let averageCompletionTime = 0;
    if (completedOrders.length > 0) {
      const totalTime = completedOrders.reduce((sum, order) => {
        const diffMs = new Date(order.endTime) - new Date(order.startTime);
        return sum + (diffMs / 1000 / 60); // convert to minutes
      }, 0);
      averageCompletionTime = parseFloat((totalTime / completedOrders.length).toFixed(1));
    }

    // 4. Get Technician performance list
    const technicians = await Technician.find({ companyId })
      .populate('userId', 'name email')
      .sort({ 'ratings.average': -1 });

    const technicianPerformance = technicians.map(tech => ({
      technicianId: tech._id,
      name: tech.userId?.name || 'N/A',
      rating: tech.ratings.average,
      totalReviews: tech.ratings.count,
      availability: tech.availabilityStatus
    }));

    // 5. Calculate Popular Services
    const serviceAgg = await WorkOrder.aggregate([
      { $match: { companyId } },
      { $group: { _id: '$serviceId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Populate service names
    const popularServices = [];
    for (const item of serviceAgg) {
      const service = await Service.findById(item._id);
      if (service) {
        popularServices.push({
          name: service.name,
          count: item.count
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Dashboard analytics retrieved successfully',
      data: {
        metrics: {
          totalRequests: await ServiceRequest.countDocuments({ companyId }),
          completedJobs: completedOrders.length,
          totalRevenue,
          averageCompletionTime
        },
        requestStatusDistribution,
        technicianPerformance,
        popularServices
      }
    });
  } catch (error) {
    next(error);
  }
};
