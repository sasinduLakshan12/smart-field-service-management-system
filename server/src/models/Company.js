const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a company name'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide a company email'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'suspended', 'trial'],
    default: 'trial'
  },
  settings: {
    currency: { type: String, default: 'LKR' },
    taxRate: { type: Number, default: 0 }, // percentage
    themeColor: { type: String, default: '#0ea5e9' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Company', companySchema);
