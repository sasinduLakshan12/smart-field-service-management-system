const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const customerRoutes = require('./routes/customerRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const serviceRequestRoutes = require('./routes/serviceRequestRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const chatRoutes = require('./routes/chatRoutes');
const locationRoutes = require('./routes/locationRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const path = require('path');

const app = express();

// Security and utility middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // We can restrict this in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/technicians', technicianRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/service-requests', serviceRequestRoutes);
app.use('/api/v1/work-orders', workOrderRoutes);
app.use('/api/v1/conversations', chatRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/billing', billingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Public Geocoding search proxy to bypass frontend CORS blocks
app.get('/api/v1/geocode/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(200).json([]);
  }
  
  const https = require('https');
  // Use Photon by Komoot (free, fast, no rate-limits geocoding search for OSM data)
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5`;
  
  https.get(url, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => {
      data += chunk;
    });
    apiRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        const features = parsed.features || [];
        
        // Filter strictly for Sri Lanka results (countrycode: 'LK')
        const lkFeatures = features.filter(f => f.properties?.countrycode?.toUpperCase() === 'LK');
        
        const formatted = lkFeatures.map(f => {
          const props = f.properties || {};
          const coords = f.geometry?.coordinates || [0, 0];
          
          // Compile a readable address string
          const parts = [
            props.name,
            props.street,
            props.city || props.town || props.county,
            props.state,
            props.country
          ].filter(Boolean);
          
          return {
            place_id: `${props.osm_type || 'W'}-${props.osm_id || Math.random()}`,
            display_name: parts.join(', '),
            lat: coords[1], // Latitude is second in GeoJSON coordinates array [lng, lat]
            lon: coords[0]  // Longitude is first
          };
        });
        res.status(200).json(formatted);
      } catch (e) {
        res.status(200).json([]);
      }
    });
  }).on('error', (err) => {
    console.error('Photon proxy search error:', err.message);
    res.status(200).json([]);
  });
});

// Base health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Smart Workforce & Field Service Management Platform API is running.',
    timestamp: new Date()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || []
  });
});

module.exports = app;
