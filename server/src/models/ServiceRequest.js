const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  problemDescription: {
    type: String,
    required: [true, 'Please provide a problem description'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  preferredDate: {
    type: Date,
    required: [true, 'Please select a preferred date']
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  status: {
    type: String,
    enum: [
      'Pending',
      'Reviewed',
      'Assigned',
      'Accepted',
      'Travelling',
      'Arrived',
      'In Progress',
      'Paused',
      'Completed',
      'Customer Confirmed',
      'Cancelled'
    ],
    default: 'Pending'
  },
  images: [{
    type: String
  }],
  additionalNotes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
