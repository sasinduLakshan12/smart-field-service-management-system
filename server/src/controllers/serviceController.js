const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');

// @desc    Create a new service category
// @route   POST /api/v1/services/categories
// @access  Private (Admin)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const categoryExists = await ServiceCategory.findOne({ name, companyId: req.user.companyId });
    if (categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists under this company'
      });
    }

    const category = await ServiceCategory.create({
      name,
      description,
      companyId: req.user.companyId
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all service categories
// @route   GET /api/v1/services/categories
// @access  Private
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await ServiceCategory.find(req.tenantFilter);
    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new service
// @route   POST /api/v1/services
// @access  Private (Admin)
exports.createService = async (req, res, next) => {
  try {
    const { name, description, price, estimatedDuration, categoryId, requiredSkills } = req.body;

    // Verify category exists under same tenant
    const category = await ServiceCategory.findOne({ _id: categoryId, companyId: req.user.companyId });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or does not belong to this company'
      });
    }

    const serviceExists = await Service.findOne({ name, companyId: req.user.companyId });
    if (serviceExists) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists under this company'
      });
    }

    const service = await Service.create({
      name,
      description,
      price,
      estimatedDuration,
      categoryId,
      requiredSkills,
      companyId: req.user.companyId
    });

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all services
// @route   GET /api/v1/services
// @access  Private
exports.getServices = async (req, res, next) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }

    const services = await Service.find(filter).populate('categoryId', 'name');
    res.status(200).json({
      success: true,
      message: 'Services retrieved successfully',
      data: services
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single service details
// @route   GET /api/v1/services/:id
// @access  Private
exports.getService = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const service = await Service.findOne(filter).populate('categoryId', 'name');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service details retrieved',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update service
// @route   PUT /api/v1/services/:id
// @access  Private (Admin)
exports.updateService = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const service = await Service.findOne(filter);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const { name, description, price, estimatedDuration, categoryId, requiredSkills } = req.body;

    if (categoryId) {
      const category = await ServiceCategory.findOne({ _id: categoryId, companyId: req.user.companyId });
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found or does not belong to this company'
        });
      }
      service.categoryId = categoryId;
    }

    if (name) service.name = name;
    if (description) service.description = description;
    if (price !== undefined) service.price = price;
    if (estimatedDuration !== undefined) service.estimatedDuration = estimatedDuration;
    if (requiredSkills) service.requiredSkills = requiredSkills;

    await service.save();

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete service catalog item
// @route   DELETE /api/v1/services/:id
// @access  Private (Admin only)
exports.deleteService = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const service = await Service.findOne(filter);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await Service.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
