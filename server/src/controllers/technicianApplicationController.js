const TechnicianApplication = require('../models/TechnicianApplication');
const User = require('../models/User');
const Technician = require('../models/Technician');
const Company = require('../models/Company');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// @desc    Submit technician application (Public)
// @route   POST /api/v1/technicians/apply
// @access  Public
exports.submitApplication = async (req, res, next) => {
  try {
    const { name, email, password, skills, experienceYears, fileName, fileData, companyId } = req.body;

    // Default to first company if not provided (for seed convenience)
    let targetCompanyId = companyId;
    if (!targetCompanyId) {
      const company = await Company.findOne();
      if (!company) {
        return res.status(400).json({
          success: false,
          message: 'No active service companies found in portal'
        });
      }
      targetCompanyId = company._id;
    }

    // Check if email already registered as user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered in the system'
      });
    }

    // Check if pending application already exists
    const appExists = await TechnicianApplication.findOne({ email, status: 'pending' });
    if (appExists) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending application'
      });
    }

    // Process CV File Upload (Base64 decode)
    if (!fileData || !fileName) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your CV / Resume document'
      });
    }

    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}_${fileName.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    // Remove metadata prefix if present (e.g. data:application/pdf;base64,)
    const base64Data = fileData.split(';base64,').pop();
    const buffer = Buffer.from(base64Data, 'base64');
    
    fs.writeFileSync(filePath, buffer);
    const cvUrl = `http://localhost:5000/uploads/${uniqueFileName}`;

    const skillsArray = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills;

    const application = await TechnicianApplication.create({
      name,
      email,
      password, // Save as plain, User.create pre-save hook will hash it on approval
      skills: skillsArray || [],
      experienceYears: Number(experienceYears),
      cvUrl,
      companyId: targetCompanyId,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Application and CV submitted successfully! It is pending admin review.',
      data: application
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications (Admin only)
// @route   GET /api/v1/technicians/applications
// @access  Private (Admin)
exports.getApplications = async (req, res, next) => {
  try {
    const applications = await TechnicianApplication.find({
      companyId: req.user.companyId,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      data: applications
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review application (Approve / Reject)
// @route   PUT /api/v1/technicians/applications/:id
// @access  Private (Admin)
exports.reviewApplication = async (req, res, next) => {
  try {
    const { status } = req.body;
    const application = await TechnicianApplication.findOne({
      _id: req.params.id,
      companyId: req.user.companyId
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await application.save();

    if (status === 'approved') {
      const user = await User.create({
        name: application.name,
        email: application.email,
        password: application.password,
        role: 'technician',
        companyId: application.companyId,
        isActive: true
      });

      await Technician.create({
        userId: user._id,
        companyId: application.companyId,
        skills: application.skills,
        availabilityStatus: 'available'
      });
    }

    res.status(200).json({
      success: true,
      message: `Application has been successfully ${status}.`,
      data: application
    });
  } catch (error) {
    next(error);
  }
};
