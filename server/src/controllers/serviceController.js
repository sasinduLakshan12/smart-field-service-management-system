const Service = require('../models/Service');
const ServiceCategory = require('../models/ServiceCategory');
const fs = require('fs');
const path = require('path');

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
    const { name, description, price, estimatedDuration, duration, categoryId, requiredSkills, imageName, imageData } = req.body;

    const actualDuration = estimatedDuration || duration || 60;

    let targetCategoryId = categoryId;
    if (!targetCategoryId) {
      // Find or create default category to ensure service gets resolved
      let category = await ServiceCategory.findOne({ name: 'General Services', companyId: req.user.companyId });
      if (!category) {
        category = await ServiceCategory.create({
          name: 'General Services',
          description: 'Default category for company services',
          companyId: req.user.companyId
        });
      }
      targetCategoryId = category._id;
    } else {
      const categoryExists = await ServiceCategory.findOne({ _id: targetCategoryId, companyId: req.user.companyId });
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found or does not belong to this company'
        });
      }
    }

    const serviceExists = await Service.findOne({ name, companyId: req.user.companyId });
    if (serviceExists) {
      return res.status(400).json({
        success: false,
        message: 'Service with this name already exists under this company'
      });
    }

    // Process cover image upload if present
    let imageUrl;
    if (imageData && imageName) {
      const uploadDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const uniqueFileName = `service_${Date.now()}_${imageName.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      
      const base64Data = imageData.split(';base64,').pop();
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      imageUrl = `http://localhost:5000/uploads/${uniqueFileName}`;
    }

    const service = await Service.create({
      name,
      description,
      price,
      estimatedDuration: actualDuration,
      categoryId: targetCategoryId,
      requiredSkills,
      companyId: req.user.companyId,
      imageUrl
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

// @desc    Get all public services (no auth required)
// @route   GET /api/v1/services/public
// @access  Public
exports.getPublicServices = async (req, res, next) => {
  try {
    const services = await Service.find().populate('companyId', 'name');
    res.status(200).json({
      success: true,
      message: 'Public services retrieved successfully',
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

    const { name, description, price, estimatedDuration, duration, categoryId, requiredSkills, imageName, imageData } = req.body;

    if (name) service.name = name;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = price;
    if (estimatedDuration !== undefined || duration !== undefined) {
      service.estimatedDuration = estimatedDuration || duration;
    }
    if (requiredSkills !== undefined) service.requiredSkills = requiredSkills;

    // Process cover image upload if present
    if (imageData && imageName) {
      const uploadDir = path.join(__dirname, '../../public/uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const uniqueFileName = `service_${Date.now()}_${imageName.replace(/\s+/g, '_')}`;
      const filePath = path.join(uploadDir, uniqueFileName);
      
      const base64Data = imageData.split(';base64,').pop();
      const buffer = Buffer.from(base64Data, 'base64');
      fs.writeFileSync(filePath, buffer);
      
      service.imageUrl = `http://localhost:5000/uploads/${uniqueFileName}`;
    }

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

// @desc    Delete service
// @route   DELETE /api/v1/services/:id
// @access  Private (Admin)
exports.deleteService = async (req, res, next) => {
  try {
    const filter = { _id: req.params.id, ...req.tenantFilter };
    const service = await Service.findOneAndDelete(filter);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
