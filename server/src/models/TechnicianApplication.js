const mongoose = require('mongoose');

const technicianApplicationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  skills: {
    type: [String],
    default: []
  },
  experienceYears: {
    type: Number,
    required: [true, 'Please provide years of experience']
  },
  cvUrl: {
    type: String,
    required: [true, 'Please provide a CV / Resume link']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TechnicianApplication', technicianApplicationSchema);
