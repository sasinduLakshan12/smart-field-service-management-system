const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
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
  phone: {
    type: String,
    required: [true, 'Phone number is required']
  },
  addresses: [{
    label: { type: String, default: 'Default' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
