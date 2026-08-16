const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a service name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Please provide a service price'],
    min: 0
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: [true, 'Please provide an estimated duration in minutes'],
    min: 1
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  requiredSkills: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Ensure service names are unique within a company tenant
serviceSchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Service', serviceSchema);
