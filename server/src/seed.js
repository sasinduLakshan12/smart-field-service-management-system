require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('./models/Company');
const User = require('./models/User');
const Customer = require('./models/Customer');
const Technician = require('./models/Technician');

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await Company.deleteMany({});
    await User.deleteMany({});
    await Customer.deleteMany({});
    await Technician.deleteMany({});

    console.log('Cleared existing collections.');

    // 1. Create a Company Tenant
    const company = await Company.create({
      name: 'Lanka Service Co.',
      email: 'info@lankaservice.com',
      phone: '0112345678',
      address: 'No. 12, Galle Road, Colombo',
      subscriptionStatus: 'active',
      settings: {
        currency: 'LKR',
        taxRate: 8,
        themeColor: '#0ea5e9'
      }
    });
    console.log('Created Company Tenant:', company.name);

    // 2. Create Company Admin User
    const adminUser = await User.create({
      name: 'Sasindu Admin',
      email: 'admin@lankaservice.com',
      password: 'password123',
      role: 'company_admin',
      companyId: company._id,
      isActive: true,
      isEmailVerified: true
    });
    console.log('Created Admin User:', adminUser.email);

    // 3. Create Technician User & Profile
    const techUser = await User.create({
      name: 'Kamal Tech',
      email: 'tech@lankaservice.com',
      password: 'password123',
      role: 'technician',
      companyId: company._id,
      isActive: true,
      isEmailVerified: true
    });

    const technician = await Technician.create({
      userId: techUser._id,
      companyId: company._id,
      skills: ['AC Repair', 'Electrical'],
      availabilityStatus: 'available'
    });
    console.log('Created Technician:', techUser.email);

    // 4. Create Customer User & Profile
    const customerUser = await User.create({
      name: 'Nimal Customer',
      email: 'customer@lankaservice.com',
      password: 'password123',
      role: 'customer',
      companyId: company._id,
      isActive: true,
      isEmailVerified: true
    });

    const customer = await Customer.create({
      userId: customerUser._id,
      companyId: company._id,
      phone: '0771234567',
      addresses: [{
        label: 'Home',
        street: '45, Highlevel Road',
        city: 'Nugegoda',
        coordinates: { lat: 6.874, lng: 79.888 }
      }]
    });
    console.log('Created Customer:', customerUser.email);

    console.log('Database seeded successfully! 🌱');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error.message);
    process.exit(1);
  }
};

seedDB();
