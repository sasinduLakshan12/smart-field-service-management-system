import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Vite-native Leaflet CSS import to fix black map tiles bug
import { Briefcase, Shield, Clock, ArrowRight, Star, ClipboardList, MapPin, Calendar, CheckCircle, AlertCircle, X, LogOut, Check, ChevronRight, Phone, Navigation, Eye } from 'lucide-react';

// Fix Leaflet Default Icon path resolution issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Home() {
  const { user, accessToken, logout } = useAuthStore();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  
  // Modals & History State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  // Live Tracking Modal State
  const [showTracking, setShowTracking] = useState(false);
  const [trackingBooking, setTrackingBooking] = useState(null);
  const [trackingEta, setTrackingEta] = useState(12); // minutes
  const [trackingDistance, setTrackingDistance] = useState(3.4); // km

  // Booking Form State (Simplified)
  const [problemDescription, setProblemDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState({ lat: 6.9271, lng: 79.8612 }); // Default Colombo
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Map references
  const bookingMapRef = useRef(null);
  const bookingMarkerRef = useRef(null);
  const trackingMapRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  // Fetch public services catalogue
  const fetchServices = () => {
    axios.get('http://localhost:5000/api/v1/services/public')
      .then(res => {
        if (res.data.success) {
          setServices(res.data.data);
        }
      })
      .catch(err => {
        console.error('Failed to load public services catalog', err);
      });
  };

  // Fetch current customer's requests history
  const fetchMyBookings = () => {
    if (!user || user.role !== 'customer') return;
    axios.get('http://localhost:5000/api/v1/service-requests', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (res.data.success) {
          setMyBookings(res.data.data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch customer bookings', err);
      });
  };

  useEffect(() => {
    fetchServices();
    if (user && user.role === 'customer') {
      fetchMyBookings();
    }
  }, [accessToken, user]);

  // Initialize interactive map for booking selector
  useEffect(() => {
    if (showBookModal && selectedService) {
      setTimeout(() => {
        if (bookingMapRef.current) {
          bookingMapRef.current.remove();
          bookingMapRef.current = null;
        }

        const initialLat = coordinates.lat || 6.9271;
        const initialLng = coordinates.lng || 79.8612;

        const map = L.map('booking-map-container').setView([initialLat, initialLng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
        marker.bindPopup("Your Job Site Pin Location").openPopup();

        bookingMapRef.current = map;
        bookingMarkerRef.current = marker;

        marker.on('dragend', () => {
          const position = marker.getLatLng();
          setCoordinates({ lat: position.lat, lng: position.lng });
          setAddress(`Galle Road, Colombo (GPS Locked)`);
        });

        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setCoordinates({ lat, lng });
          setAddress(`Main Street, Colombo (GPS Locked)`);
        });
      }, 300);
    }
  }, [showBookModal]);

  // Real-time technician tracking simulator map
  useEffect(() => {
    if (showTracking && trackingBooking) {
      setTimeout(() => {
        if (trackingMapRef.current) {
          trackingMapRef.current.remove();
          trackingMapRef.current = null;
        }

        const customerLat = trackingBooking.coordinates?.lat || 6.9271;
        const customerLng = trackingBooking.coordinates?.lng || 79.8612;

        let techLat = customerLat + 0.012;
        let techLng = customerLng + 0.012;

        const map = L.map('tracking-map-container').setView([customerLat, customerLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const customerIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619034.png',
          iconSize: [35, 35],
          iconAnchor: [17, 34],
        });

        const techIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995470.png',
          iconSize: [35, 35],
          iconAnchor: [17, 17],
        });

        const customerMarker = L.marker([customerLat, customerLng], { icon: customerIcon }).addTo(map);
        customerMarker.bindPopup("Your Home Location (Destination)").openPopup();

        const techMarker = L.marker([techLat, techLng], { icon: techIcon }).addTo(map);
        techMarker.bindPopup("Technician: En route").openPopup();

        const routeLine = L.polyline([[techLat, techLng], [customerLat, customerLng]], { color: '#00a896', weight: 4 }).addTo(map);

        trackingMapRef.current = map;

        let step = 0;
        const totalSteps = 20;

        trackingIntervalRef.current = setInterval(() => {
          step++;
          const progress = step / totalSteps;

          const currentLat = techLat + (customerLat - techLat) * progress;
          const currentLng = techLng + (customerLng - techLng) * progress;

          techMarker.setLatLng([currentLat, currentLng]);
          routeLine.setLatLngs([[currentLat, currentLng], [customerLat, customerLng]]);

          const remainingDistance = (3.4 * (1 - progress)).toFixed(2);
          const remainingEta = Math.ceil(12 * (1 - progress));

          setTrackingDistance(parseFloat(remainingDistance));
          setTrackingEta(remainingEta);

          if (step >= totalSteps) {
            clearInterval(trackingIntervalRef.current);
            techMarker.bindPopup("Technician has arrived at your location!").openPopup();
            setTrackingDistance(0);
            setTrackingEta(0);
          }
        }, 3000);

      }, 300);
    }

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [showTracking, trackingBooking]);

  const handleOpenBookModal = (service) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'customer') {
      setFeedback({ success: false, message: 'Only customer accounts can book service assignments.' });
      return;
    }
    setSelectedService(service);
    setProblemDescription('');
    setPreferredDate('');
    setAddress('');
    setPhone('');
    setFeedback(null);
    setShowBookModal(true);
  };

  const handleOpenTracking = (booking) => {
    setTrackingBooking(booking);
    setTrackingDistance(3.4);
    setTrackingEta(12);
    setShowTracking(true);
  };

  // Auto-detect user coordinates and pre-fill address fields
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setFeedback({ success: false, message: 'Geolocation is not supported by your browser' });
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });

        if (bookingMarkerRef.current && bookingMapRef.current) {
          bookingMarkerRef.current.setLatLng([lat, lng]);
          bookingMapRef.current.setView([lat, lng], 14);
        }

        setAddress('Galle Road, Colombo (GPS Auto-Locked)');
        setDetectingLocation(false);
        setFeedback({ success: true, message: `GPS coordinates locked successfully! (${lat.toFixed(4)}, ${lng.toFixed(4)})` });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setAddress('Colombo, Sri Lanka');
        setDetectingLocation(false);
        setFeedback({ success: true, message: 'GPS access denied. Applied default location coordinates.' });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFeedback(null);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/service-requests', {
        serviceId: selectedService._id,
        problemDescription,
        priority: 'medium', // Default to medium
        preferredDate,
        address,
        phone,
        coordinates
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.data.success) {
        setFeedback({ success: true, message: 'Service requested successfully! Our team will assign a technician shortly.' });
        fetchMyBookings();
        setTimeout(() => {
          setShowBookModal(false);
          setFeedback(null);
        }, 2000);
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Booking submission failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Map category/skills to stock images for high-end aesthetic (Robust matching)
  const getServiceImage = (service) => {
    if (service.imageUrl) return service.imageUrl;

    const name = service.name?.toLowerCase() || '';
    const desc = service.description?.toLowerCase() || '';
    const skills = service.requiredSkills?.map(s => s.toLowerCase()) || [];

    const matches = (keyword) => 
      name.includes(keyword) || 
      desc.includes(keyword) || 
      skills.some(s => s.includes(keyword));

    if (matches('ac') || matches('air') || matches('cooling') || matches('condition')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80';
    }
    if (matches('plumb') || matches('pipe') || matches('water') || matches('leak') || matches('pump')) {
      return 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80';
    }
    if (matches('elect') || matches('wire') || matches('power') || matches('light') || matches('volt') || matches('circuit')) {
      return 'https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=600&q=80';
    }
    if (matches('gener') || matches('engine') || matches('motor')) {
      return 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80';
    }
    if (matches('applian') || matches('wash') || matches('fridge') || matches('dryer') || matches('oven') || matches('machine')) {
      return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80';
    }
    return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80';
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative text-slate-100 transition-colors duration-200 overflow-x-hidden font-sans"
      style={{ backgroundImage: "url('/landing_bg.jpg')" }}
    >
      {/* Heavy dark mask overlay for high readability contrast */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[3px] z-0"></div>

      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        
        {/* Sticky Floating Glass Navbar with high contrast */}
        <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-md border-b border-slate-900/80 transition-all shadow-lg">
          <div className="max-w-6xl mx-auto px-6 h-20 flex justify-between items-center">
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 select-none">
              <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-black text-sm shadow-[0_0_12px_rgba(0,168,150,0.5)]">
                F
              </div>
              FieldFlow
            </h1>
            
            {/* Brightened Nav links for perfect readability */}
            <nav className="hidden md:flex items-center gap-8 text-xs font-extrabold text-slate-200">
              <a href="#home" className="hover:text-brand transition-colors">Home</a>
              <a href="#services" className="hover:text-brand transition-colors">Services</a>
              <a href="#features" className="hover:text-brand transition-colors">Platform</a>
              <Link to="/apply" className="hover:text-brand transition-colors">Apply as Tech</Link>
            </nav>
            
            <div className="flex items-center gap-4">
              {user ? (
                user.role === 'customer' ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-white font-extrabold hidden sm:inline">
                      Hello, {user.name}
                    </span>
                    <button
                      onClick={() => {
                        fetchMyBookings();
                        setShowMyBookings(true);
                      }}
                      className="bg-slate-900 hover:bg-slate-855 text-white text-xs font-bold py-2 px-4 rounded-xl border border-slate-800 transition-all flex items-center gap-1.5 shadow-md"
                    >
                      <ClipboardList size={14} className="text-brand" /> My Bookings
                    </button>
                    <button
                      onClick={logout}
                      title="Sign Out"
                      className="p-2.5 rounded-xl bg-red-955/40 hover:bg-red-955/60 text-red-400 border border-red-900/40 transition-all"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/dashboard"
                      className="bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all flex items-center gap-1.5"
                    >
                      Go to Console <ArrowRight size={14} />
                    </Link>
                    <button
                      onClick={logout}
                      title="Sign Out"
                      className="p-2.5 rounded-xl bg-red-955/40 hover:bg-red-955/60 text-red-400 border border-red-900/40 transition-all"
                    >
                      <LogOut size={14} />
                    </button>
                  </div>
                )
              ) : (
                <Link
                  to="/login"
                  className="bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main id="home" className="max-w-6xl w-full mx-auto px-6 pt-12 pb-20 space-y-24">
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-brand-light text-brand border border-brand/20 uppercase tracking-widest backdrop-blur-md">
              Next-Gen Workforce Hub
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Smart Field Service <br />
              <span className="text-brand">Management Platform</span>
            </h2>
            <p className="text-slate-205 text-xs md:text-sm leading-relaxed max-w-xl mx-auto font-semibold">
              Optimize your mobile workforce, assign jobs instantly with skill-matching algorithms, track technicians live on maps, and automate billing on task resolution.
            </p>

            <div className="flex justify-center gap-4 pt-2">
              {user ? (
                user.role === 'customer' ? (
                  <a
                    href="#services"
                    className="bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_8px_20px_rgba(0,168,150,0.4)] transition-all flex items-center gap-2 text-xs cursor-pointer animate-bounce"
                  >
                    Book a Service Now <ArrowRight size={16} />
                  </a>
                ) : (
                  <Link
                    to="/dashboard"
                    className="bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_8px_20px_rgba(0,168,150,0.4)] transition-all flex items-center gap-2 text-xs"
                  >
                    Access Console Dashboard <ArrowRight size={16} />
                  </Link>
                )
              ) : (
                <>
                  <Link
                    to="/login"
                    className="bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_8px_20px_rgba(0,168,150,0.4)] transition-all flex items-center gap-2 text-xs"
                  >
                    Get Started <ArrowRight size={16} />
                  </Link>
                  <Link
                    to="/apply"
                    className="bg-slate-900 hover:bg-slate-950 text-slate-200 font-bold py-3.5 px-8 rounded-2xl border border-slate-800 transition-all flex items-center gap-2 text-xs shadow-md"
                  >
                    Join as Technician
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* DYNAMIC CUSTOMER SERVICES SECTION */}
          <div id="services" className="space-y-8 pt-6">
            <div className="text-center space-y-1">
              <h3 className="text-2xl font-black text-white">Our Field Services</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Book professional experts for your household & business needs</p>
            </div>

            {services.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-semibold bg-slate-900/40 rounded-3xl border border-slate-800/60 max-w-lg mx-auto">
                No active services are registered at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {services.map((service) => (
                  <div 
                    key={service._id} 
                    className="bg-slate-900/90 backdrop-blur-md rounded-[32px] overflow-hidden border border-slate-800 shadow-2xl flex flex-col justify-between hover:scale-[1.015] hover:border-brand/50 hover:shadow-[0_12px_40px_rgba(0,168,150,0.2)] transition-all duration-200 group"
                  >
                    {/* Header Image */}
                    <div className="h-44 w-full overflow-hidden relative">
                      <img 
                        src={getServiceImage(service)} 
                        alt={service.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent"></div>
                    </div>

                    {/* Content Body with clear readable colors */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-2">
                        {/* High Contrast Bright Price Label */}
                        <div className="text-lg font-black text-brand tracking-tight">
                          LKR {service.price?.toLocaleString()}
                        </div>
                        <h4 className="font-extrabold text-white text-sm tracking-tight">{service.name}</h4>
                        <p className="text-xs text-slate-200 font-medium leading-relaxed line-clamp-3">
                          {service.description || 'Professional field solution completed by our certified service provider.'}
                        </p>
                      </div>

                      {/* Footer values */}
                      <div className="flex justify-between items-center pt-4 border-t border-slate-800/80 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5 text-slate-355">
                          <Clock size={13} className="text-slate-450" />
                          <span>{service.estimatedDuration || service.duration || 60} Mins</span>
                        </div>
                        <button
                          onClick={() => handleOpenBookModal(service)}
                          className="flex items-center gap-1 bg-brand text-white font-extrabold px-3.5 py-2 rounded-xl hover:bg-brand-hover hover:scale-[1.02] shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all cursor-pointer"
                        >
                          <span>Book Now</span> <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feature Grid */}
          <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-800">
            <div className="bg-slate-900/70 backdrop-blur-md p-6 rounded-3xl border border-slate-800/60 shadow-lg text-left space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-light text-brand flex items-center justify-center border border-brand/20">
                <Briefcase size={20} />
              </div>
              <h4 className="font-bold text-white text-sm">Smart Dispatching</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Intelligent scheduler filters availability and technician skills automatically matching customer requirements.
              </p>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-md p-6 rounded-3xl border border-slate-800/60 shadow-lg text-left space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/30 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Shield size={20} />
              </div>
              <h4 className="font-bold text-white text-sm">Tenant Boundaries</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Multi-tenant architecture automatically isolates customer directories, orders, catalog and billing ledgers securely.
              </p>
            </div>

            <div className="bg-slate-900/70 backdrop-blur-md p-6 rounded-3xl border border-slate-800/60 shadow-lg text-left space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-950/30 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-white text-sm">Auto-Billing Ledger</h4>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                Calculates task labor and parts costs dynamically generating PDF-ready invoices on status completed callback.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-14 border-t border-slate-900/40 flex items-center justify-center text-[10px] text-slate-500 font-bold tracking-wider">
          © {new Date().getFullYear()} FieldFlow Inc. All Rights Reserved.
        </footer>

      </div>

      {/* 1. BOOK SERVICE SIMPLIFIED PREMIUM GLASS MODAL */}
      {showBookModal && selectedService && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="max-w-md w-full bg-slate-900/95 backdrop-blur-md rounded-[32px] shadow-2xl border border-slate-800 overflow-hidden text-slate-200 relative">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-brand">
                <ClipboardList size={20} />
                <h3 className="font-extrabold text-white text-sm">Book: {selectedService.name}</h3>
              </div>
              <button 
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-white p-1 bg-slate-950 rounded-lg border border-slate-800 hover:bg-slate-900 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
              {feedback && (
                <div className={`p-4 rounded-2xl text-xs border flex items-center gap-2 ${
                  feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
                }`}>
                  {feedback.success ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span className="font-medium">{feedback.message}</span>
                </div>
              )}

              {/* 1. Describe Your Problem */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Describe Your Problem
                </label>
                <textarea
                  required
                  rows="2"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand/45 focus:border-brand/45 transition-all"
                  placeholder="Describe what needs repair/service..."
                ></textarea>
              </div>

              {/* 2. Date & Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand/45"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone size={10} className="text-brand" /> Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-950/60 border border-slate-805 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand/45"
                    placeholder="e.g. 0771234567"
                  />
                </div>
              </div>

              {/* 3. Interactive Map Pin Drop (Tiles issue fixed) */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Location (Drag marker pin)
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="text-[9px] font-bold text-brand hover:text-brand-hover flex items-center gap-1 bg-brand/10 border border-brand/20 px-2 py-1 rounded-lg cursor-pointer"
                  >
                    <Navigation size={10} className={detectingLocation ? 'animate-spin' : ''} />
                    Use Current GPS
                  </button>
                </div>
                <div 
                  id="booking-map-container" 
                  className="h-44 w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden z-10 relative shadow-inner"
                ></div>
              </div>

              {/* 4. Combined Single Address text field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Service Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/60 border border-slate-805 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-brand/45"
                  placeholder="Street and City (Autofills on map pin drop)"
                />
              </div>

              {/* Submit / Cancel Actions */}
              <div className="flex gap-3 justify-end pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-5 py-2.5 border border-slate-800 rounded-xl text-xs font-semibold text-slate-450 hover:bg-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-[0_8px_16px_rgba(0,168,150,0.3)] hover:shadow-lg transition-all"
                >
                  {submitLoading ? 'Requesting...' : 'Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER BOOKINGS HISTORY PREMIUM GLASS MODAL */}
      {showMyBookings && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-2xl w-full bg-slate-900/95 backdrop-blur-md rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-800 overflow-hidden text-slate-200 relative">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-brand">
                <ClipboardList size={20} />
                <h3 className="font-extrabold text-white text-sm">My Booked Services</h3>
              </div>
              <button 
                onClick={() => setShowMyBookings(false)}
                className="text-slate-400 hover:text-white p-1 bg-slate-900/50 rounded-lg border border-slate-800 hover:bg-slate-900 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[58vh] space-y-4">
              {myBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-550 font-semibold">
                  You have not submitted any service bookings yet.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {myBookings.map((booking) => (
                    <div 
                      key={booking._id} 
                      className="bg-slate-950/50 border border-slate-850 p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs shadow-lg"
                    >
                      <div className="space-y-1.5">
                        <div className="font-extrabold text-white text-sm tracking-tight flex items-center gap-2">
                          <span>{booking.serviceId?.name || 'Service Requested'}</span>
                        </div>
                        <div className="text-slate-250 font-semibold flex items-center gap-1.5">
                          <MapPin size={13} className="text-brand shrink-0" /> {booking.address}
                        </div>
                        <div className="text-[9px] text-slate-450 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                          <Calendar size={13} className="text-slate-500" /> Pref. Date: {new Date(booking.preferredDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold border capitalize ${
                          booking.status === 'Completed'
                            ? 'bg-brand-light text-brand border-brand/20'
                            : booking.status === 'Assigned'
                            ? 'bg-sky-950/20 text-sky-400 border-sky-500/20'
                            : 'bg-slate-950/30 text-slate-400 border-slate-500/20'
                        }`}>
                          {booking.status}
                        </span>
                        
                        {booking.status === 'Assigned' && (
                          <button
                            onClick={() => handleOpenTracking(booking)}
                            className="bg-brand text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 hover:bg-brand-hover transition-colors cursor-pointer text-[10px] shadow-sm"
                          >
                            <Eye size={12} /> Track Live
                          </button>
                        )}

                        {booking.serviceId?.price && (
                          <div className="font-black text-white text-sm">
                            LKR {booking.serviceId.price?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-950/35 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowMyBookings(false)}
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REAL-TIME LIVE DISPATCH TRACKING MODAL */}
      {showTracking && trackingBooking && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-xl w-full bg-slate-900/95 backdrop-blur-md rounded-[32px] shadow-2xl border border-slate-800 overflow-hidden text-slate-200 relative">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-brand animate-pulse" />
                <h3 className="font-extrabold text-white text-sm">Tracking Technician Dispatch</h3>
              </div>
              <button 
                onClick={() => setShowTracking(false)}
                className="text-slate-400 hover:text-white p-1 bg-slate-950 rounded-lg border border-slate-800 hover:bg-slate-900 transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 text-center">
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Status</p>
                  <p className="text-xs font-bold text-brand mt-0.5 animate-pulse">En Route</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Distance</p>
                  <p className="text-xs font-black text-white mt-0.5">{trackingDistance} km</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ETA</p>
                  <p className="text-xs font-black text-white mt-0.5">{trackingEta} mins</p>
                </div>
              </div>

              <div 
                id="tracking-map-container" 
                className="h-64 w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden z-10 relative shadow-inner"
              ></div>

              <div className="text-[10px] text-slate-350 font-semibold leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex items-center gap-2">
                <CheckCircle size={14} className="text-brand shrink-0" />
                <span>Simulating live GPS telemetry updates from the technician's mobile console device towards Galle Road destination.</span>
              </div>
            </div>

            <div className="p-5 bg-slate-950/35 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowTracking(false)}
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-200 rounded-xl text-xs font-bold transition-all"
              >
                Dismiss Tracking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
