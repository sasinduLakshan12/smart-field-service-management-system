const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  availabilityStatus: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'offline'
  },
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  homeAddress: {
    type: String,
    trim: true
  },
  ratings: {
    average: { type: Number, default: 5.0 },
    count: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Technician', technicianSchema);
