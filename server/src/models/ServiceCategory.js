const mongoose = require('mongoose');

const serviceCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a category name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }
}, {
  timestamps: true
});

// Ensure categories are unique within each company tenant
serviceCategorySchema.index({ name: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('ServiceCategory', serviceCategorySchema);
