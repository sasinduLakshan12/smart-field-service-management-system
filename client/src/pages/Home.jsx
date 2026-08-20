import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Vite-native Leaflet CSS import to fix black map tiles bug
import { Briefcase, Shield, Clock, ArrowRight, Star, ClipboardList, MapPin, Calendar, CheckCircle, AlertCircle, X, LogOut, Check, ChevronRight, Phone, Navigation, Eye, Search, Filter, Menu, ShieldAlert, Sun, Moon, User } from 'lucide-react';

// Fix Leaflet Default Icon path resolution issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Home() {
  const { user, accessToken, logout } = useAuthStore();
  const { theme, toggleTheme, initTheme } = useThemeStore();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals & History State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);

  // Mobile Drawer State
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(null); // 'privacy' | 'terms' | null

  // Profile Dropdown & Modal state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const dropdownRef = useRef(null);

  // Detail Modal State (Provider detail lookup before booking)
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);

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
  const providerMapRef = useRef(null);
  const trackingMapRef = useRef(null);
  const trackingIntervalRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    initTheme();
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

  // Initialize provider location map
  useEffect(() => {
    if (showDetailModal && selectedService) {
      setTimeout(() => {
        if (providerMapRef.current) {
          providerMapRef.current.remove();
          providerMapRef.current = null;
        }

        // Mock coordinates for technician near Colombo
        const techLat = 6.9271 + (Math.random() - 0.5) * 0.03;
        const techLng = 79.8612 + (Math.random() - 0.5) * 0.03;

        const map = L.map('provider-map-container').setView([techLat, techLng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap'
        }).addTo(map);

        const techIcon = L.icon({
          iconUrl: 'https://cdn-icons-png.flaticon.com/512/1995/1995470.png',
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        L.marker([techLat, techLng], { icon: techIcon }).addTo(map)
          .bindPopup(`<b>Provider Location</b><br/>Skill: ${selectedService.requiredSkills?.[0] || 'Technician'}`).openPopup();

        providerMapRef.current = map;
      }, 300);
    }
  }, [showDetailModal]);

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

        let techLat = trackingBooking.currentCoordinates?.lat || (customerLat + 0.012);
        let techLng = trackingBooking.currentCoordinates?.lng || (customerLng + 0.012);

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
        techMarker.bindPopup(`Technician: ${trackingBooking.status}`).openPopup();

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
          const remainingEta = Math.max(0, Math.ceil((trackingBooking.eta || 12) * (1 - progress)));

          setTrackingDistance(parseFloat(remainingDistance));
          setTrackingEta(remainingEta);

          if (step >= totalSteps) {
            clearInterval(trackingIntervalRef.current);
            techMarker.bindPopup("Technician has arrived!").openPopup();
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

  const handleOpenDetailModal = (service) => {
    setSelectedService(service);
    setSelectedProvider({
      name: `Lanka Pro ${service.requiredSkills?.[0] || 'Tech'} Provider`,
      rating: (4.5 + Math.random() * 0.4).toFixed(1),
      reviewsCount: Math.floor(45 + Math.random() * 120),
      recentFeedback: "Very professional service. Arrived on time, fixed my issue quickly, and left the workspace clean. Highly recommended!",
      phone: "+94 77 123 4567"
    });
    setShowDetailModal(true);
  };

  const handleProceedToBook = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setShowDetailModal(false);
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
    setTrackingEta(booking.eta || 12);
    setShowTracking(true);
  };

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
        priority: 'medium',
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

  const getFilteredServices = () => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = 
        categoryFilter === 'All' ||
        service.requiredSkills?.some(skill => skill.toLowerCase() === categoryFilter.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  };

  const categoryOptions = ['All', 'AC Repair', 'Plumbing', 'Electrical', 'Generator Repair', 'Appliance Repair'];

  const isDark = theme === 'dark';

  return (
    <div 
      className={`min-h-screen bg-cover bg-center bg-no-repeat relative transition-colors duration-200 overflow-x-hidden font-sans pb-10 ${
        isDark ? 'bg-slate-955 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
      style={{ backgroundImage: "url('/landing_bg.jpg')" }}
    >
      {/* Heavy dark/light mask overlay for high readability contrast */}
      <div className={`absolute inset-0 z-0 backdrop-blur-[5px] transition-all duration-200 ${
        isDark ? 'bg-slate-950/85' : 'bg-slate-50/95'
      }`}></div>

      <div className="relative z-10 flex flex-col justify-between min-h-screen">
        
        {/* Premium Sticky Floating Pill-shaped Glass Navbar */}
        <header className={`sticky top-4 z-40 max-w-6xl w-[calc(100%-2rem)] mx-auto rounded-2xl transition-all shadow-xl px-6 border ${
          isDark 
            ? 'bg-slate-955/85 border-slate-800/80 shadow-slate-950/40' 
            : 'bg-white/90 border-slate-205 shadow-slate-200/50'
        }`}>
          <div className="w-full h-16 flex justify-between items-center">
            <h1 className={`text-lg font-black tracking-tight flex items-center gap-2 select-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center text-white font-black text-xs shadow-[0_0_10px_rgba(0,168,150,0.5)]">
                F
              </div>
              FieldFlow
            </h1>
            
            {/* Nav links */}
            <nav className={`hidden md:flex items-center gap-8 text-[11px] uppercase tracking-wider font-extrabold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <a href="#home" className="hover:text-brand transition-colors relative py-1 group">
                Home
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand transition-all group-hover:w-full"></span>
              </a>
              <a href="#services" className="hover:text-brand transition-colors relative py-1 group">
                Services
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand transition-all group-hover:w-full"></span>
              </a>
              <a href="#features" className="hover:text-brand transition-colors relative py-1 group">
                Platform
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand transition-all group-hover:w-full"></span>
              </a>
              <Link to="/apply" className="hover:text-brand transition-colors relative py-1 group">
                Apply as Tech
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-brand transition-all group-hover:w-full"></span>
              </Link>
            </nav>
            
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isDark 
                    ? 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white' 
                    : 'bg-white border-slate-205 text-slate-600 hover:text-slate-955 shadow-xs'
                }`}
                title="Toggle Dark/Light Mode"
              >
                {isDark ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} />}
              </button>

              {/* Desktop Auth Section with Interactive Profile Dropdown */}
              <div className="hidden md:flex items-center gap-3 relative" ref={dropdownRef}>
                {user ? (
                  <>
                    {/* User Profile Avatar Trigger */}
                    <button
                      onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                      className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs border cursor-pointer hover:scale-[1.03] transition-all ${
                        isDark 
                          ? 'bg-brand/10 border-brand/35 text-brand shadow-[0_0_12px_rgba(0,168,150,0.25)]' 
                          : 'bg-brand/20 border-brand/40 text-brand-hover shadow-sm'
                      }`}
                    >
                      {user.name.slice(0, 2).toUpperCase()}
                    </button>

                    {/* Interactive Dropdown Menu */}
                    {showProfileDropdown && (
                      <div className={`absolute right-0 top-12 w-52 rounded-2xl border p-4 shadow-2xl space-y-2 z-50 text-xs font-medium animate-fadeIn ${
                        isDark 
                          ? 'bg-slate-900 border-slate-805 text-slate-205' 
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}>
                        <div className="border-b border-slate-800/10 pb-2">
                          <p className={`font-black text-sm truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</p>
                          <p className="text-[9px] text-brand font-extrabold uppercase tracking-wider mt-0.5 capitalize">{user.role?.replace('_', ' ')} Profile</p>
                        </div>

                        <div className="space-y-1 pt-1">
                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              setShowProfileModal(true);
                            }}
                            className="w-full flex items-center gap-2 py-2 text-left hover:text-brand transition-colors cursor-pointer font-bold"
                          >
                            <User size={14} className="text-brand" />
                            My Profile
                          </button>

                          {user.role === 'customer' && (
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                fetchMyBookings();
                                setShowMyBookings(true);
                              }}
                              className="w-full flex items-center gap-2 py-2 text-left hover:text-brand transition-colors cursor-pointer font-bold"
                            >
                              <ClipboardList size={14} className="text-brand" />
                              My Bookings
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              logout();
                            }}
                            className="w-full flex items-center gap-2 pt-2.5 border-t border-slate-800/10 text-red-500 hover:text-red-400 transition-colors text-left cursor-pointer font-extrabold"
                          >
                            <LogOut size={14} />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2 px-4 rounded-xl shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all"
                  >
                    Sign In
                  </Link>
                )}
              </div>

              {/* Hamburger Menu Toggle on mobile screens */}
              <button
                onClick={() => setShowMobileNav(!showMobileNav)}
                className={`p-2 rounded-xl border transition-all md:hidden cursor-pointer ${
                  isDark ? 'bg-slate-900/60 border-slate-800 text-slate-400' : 'bg-white border-slate-205 text-slate-650'
                }`}
              >
                <Menu size={16} />
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer with Customer Actions incorporated */}
        {showMobileNav && (
          <div className={`fixed inset-0 z-45 md:hidden flex flex-col justify-center items-center space-y-6 text-sm font-bold backdrop-blur-md ${
            isDark ? 'bg-slate-950/95 text-slate-100' : 'bg-white/95 text-slate-900'
          }`}>
            <button 
              onClick={() => setShowMobileNav(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <a href="#home" onClick={() => setShowMobileNav(false)} className="hover:text-brand">Home</a>
            <a href="#services" onClick={() => setShowMobileNav(false)} className="hover:text-brand">Services</a>
            <a href="#features" onClick={() => setShowMobileNav(false)} className="hover:text-brand">Platform</a>
            <Link to="/apply" onClick={() => setShowMobileNav(false)} className="hover:text-brand">Apply as Tech</Link>
            
            {/* Mobile Auth actions rendered inside drawer */}
            <div className="border-t border-slate-800/10 pt-6 flex flex-col items-center gap-4 w-full px-12">
              {user ? (
                user.role === 'customer' ? (
                  <>
                    <span className="text-xs font-black uppercase text-slate-500">Hi, {user.name}</span>
                    <button
                      onClick={() => {
                        setShowMobileNav(false);
                        setShowProfileModal(true);
                      }}
                      className="w-full bg-brand/10 text-brand text-xs font-bold py-3 rounded-xl border border-brand/20 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <User size={14} /> My Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileNav(false);
                        fetchMyBookings();
                        setShowMyBookings(true);
                      }}
                      className="w-full bg-brand/10 text-brand text-xs font-bold py-3 rounded-xl border border-brand/20 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <ClipboardList size={14} /> My Bookings
                    </button>
                    <button
                      onClick={() => {
                        setShowMobileNav(false);
                        logout();
                      }}
                      className="w-full py-3 bg-red-950/20 text-red-500 border border-red-900/30 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setShowMobileNav(false)}
                      className="w-full bg-brand text-white text-xs font-bold py-3 rounded-xl shadow-md text-center"
                    >
                      Go to Console
                    </Link>
                    <button
                      onClick={() => {
                        setShowMobileNav(false);
                        logout();
                      }}
                      className="w-full py-3 bg-red-950/20 text-red-500 border border-red-900/30 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </>
                )
              ) : (
                <Link
                  to="/login"
                  onClick={() => setShowMobileNav(false)}
                  className="w-full bg-brand text-white text-xs font-bold py-3 rounded-xl shadow-md text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Hero Section */}
        <main id="home" className="max-w-6xl w-full mx-auto px-6 pt-16 pb-20 space-y-24">
          <div className="text-center space-y-5 max-w-3xl mx-auto">
            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-brand-light text-brand border border-brand/20 uppercase tracking-widest backdrop-blur-md">
              Next-Gen Workforce Hub
            </span>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Smart Field Service <br />
              <span className="text-brand">Management Platform</span>
            </h2>
            <p className={`text-xs md:text-sm leading-relaxed max-w-xl mx-auto font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Optimize your mobile workforce, assign jobs instantly with skill-matching algorithms, track technicians live on maps, and automate billing on task resolution.
            </p>

            <div className="flex justify-center gap-4 pt-2">
              <a
                href="#services"
                className="bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_8px_20px_rgba(0,168,150,0.4)] transition-all flex items-center gap-2 text-xs cursor-pointer"
              >
                Browse Services <ArrowRight size={16} />
              </a>
            </div>
          </div>

          {/* DYNAMIC CUSTOMER SERVICES SECTION */}
          <div id="services" className="space-y-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-slate-800/20 pb-6">
              <div className="text-left space-y-1">
                <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Our Field Services</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Explore catalog listings and find local experts</p>
              </div>

              {/* Dynamic search & filter panel */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-initial">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search standard service..."
                    className={`w-full md:w-56 pl-9 pr-4 py-2.5 border rounded-xl text-xs focus:outline-none ${
                      isDark 
                        ? 'bg-slate-950/60 border-slate-800 text-white' 
                        : 'bg-white border-slate-205 text-slate-900 shadow-sm'
                    }`}
                  />
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>

                <div className={`relative flex items-center gap-1.5 border rounded-xl px-3 py-1.5 ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-205 shadow-sm'
                }`}>
                  <Filter size={12} className="text-slate-500" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`bg-transparent border-none text-xs focus:outline-none cursor-pointer ${
                      isDark ? 'text-slate-300' : 'text-slate-700 font-semibold'
                    }`}
                  >
                    {categoryOptions.map(cat => (
                      <option key={cat} value={cat} className={isDark ? 'bg-slate-900 text-white text-xs' : 'bg-white text-slate-900 text-xs'}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {getFilteredServices().length === 0 ? (
              <div className={`text-center py-16 font-semibold rounded-3xl border max-w-lg mx-auto ${
                isDark ? 'bg-slate-900/40 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500 shadow-sm'
              }`}>
                No matching service categories are found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {getFilteredServices().map((service) => (
                  <div 
                    key={service._id} 
                    className={`rounded-[32px] overflow-hidden border flex flex-col justify-between hover:scale-[1.015] hover:border-brand hover:shadow-[0_20px_50px_rgba(0,168,150,0.15)] transition-all duration-300 group ${
                      isDark 
                        ? 'bg-slate-900/90 border-slate-800 shadow-2xl' 
                        : 'bg-white border-slate-200 shadow-[0_15px_35px_rgba(0,0,0,0.06)]'
                    }`}
                  >
                    <div className="h-44 w-full overflow-hidden relative">
                      <img 
                        src={getServiceImage(service)} 
                        alt={service.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent"></div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                      <div className="space-y-2">
                        {/* High Contrast Bright Price Label & Rating */}
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-black text-brand tracking-tight">
                            LKR {service.price?.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold flex items-center gap-0.5 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                            <Star size={10} className="fill-amber-500" /> 4.8 (85+)
                          </span>
                        </div>

                        <h4 className={`font-extrabold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{service.name}</h4>
                        
                        {/* Skill Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {service.requiredSkills?.map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-brand/10 text-brand text-[9px] font-bold uppercase tracking-wider">
                              {skill}
                            </span>
                          ))}
                        </div>

                        <p className={`text-xs font-medium leading-relaxed line-clamp-3 ${isDark ? 'text-slate-200' : 'text-slate-655'}`}>
                          {(!service.description || service.description.toLowerCase() === 'call me') 
                            ? 'Complete troubleshooting, certified component replacements, and comprehensive system inspection by our local specialists.'
                            : service.description
                          }
                        </p>
                      </div>

                      {/* Footer values */}
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100/10">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                          Certified Service
                        </span>
                        <button
                          onClick={() => handleOpenDetailModal(service)}
                          className="flex items-center gap-1 bg-brand text-white font-extrabold px-3.5 py-2 rounded-xl hover:bg-brand-hover hover:scale-[1.02] shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all cursor-pointer text-xs"
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

          {/* How It Works Section */}
          <div className="space-y-8 pt-8 border-t border-slate-805/10">
            <div className="text-center space-y-1">
              <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>How It Works</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Simple 4-step process to resolve your task</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className={`p-6 rounded-3xl border shadow-lg text-center space-y-4 relative ${
                isDark ? 'bg-slate-900/70 border-slate-800/60' : 'bg-white border-slate-200'
              }`}>
                <div className="absolute top-4 left-4 h-6 w-6 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">
                  1
                </div>
                <div className="h-12 w-12 rounded-2xl bg-brand-light text-brand flex items-center justify-center border border-brand/20 mx-auto">
                  <Search size={20} />
                </div>
                <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Select Service</h4>
                <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-655'}`}>
                  Browse or search our verified catalog for Electrical, Plumbing, AC, or Pump services.
                </p>
              </div>

              {/* Step 2 */}
              <div className={`p-6 rounded-3xl border shadow-lg text-center space-y-4 relative ${
                isDark ? 'bg-slate-900/70 border-slate-800/60' : 'bg-white border-slate-200'
              }`}>
                <div className="absolute top-4 left-4 h-6 w-6 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">
                  2
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 mx-auto">
                  <Star size={20} className="fill-amber-500" />
                </div>
                <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Choose Provider</h4>
                <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-655'}`}>
                  Compare technician profiles, star ratings, reviews, and their live area locations on map.
                </p>
              </div>

              {/* Step 3 */}
              <div className={`p-6 rounded-3xl border shadow-lg text-center space-y-4 relative ${
                isDark ? 'bg-slate-900/70 border-slate-800/60' : 'bg-white border-slate-200'
              }`}>
                <div className="absolute top-4 left-4 h-6 w-6 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">
                  3
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mx-auto">
                  <Navigation size={20} />
                </div>
                <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Track Live Dispatch</h4>
                <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-655'}`}>
                  Watch your assigned technician travel to your door on a live map with dynamic ETA.
                </p>
              </div>

              {/* Step 4 */}
              <div className={`p-6 rounded-3xl border shadow-lg text-center space-y-4 relative ${
                isDark ? 'bg-slate-900/70 border-slate-800/60' : 'bg-white border-slate-200'
              }`}>
                <div className="absolute top-4 left-4 h-6 w-6 rounded-full bg-brand/10 text-brand text-xs font-black flex items-center justify-center">
                  4
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-450 flex items-center justify-center border border-emerald-500/20 mx-auto">
                  <CheckCircle size={20} />
                </div>
                <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Secure Resolution</h4>
                <p className={`text-xs leading-relaxed font-semibold ${isDark ? 'text-slate-400' : 'text-slate-655'}`}>
                  Confirm completed task, view automatically generated cost invoice, and rate service.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Dynamic Corporate SaaS Footer */}
        <footer className="border-t pt-16 pb-8 text-xs bg-slate-955 border-slate-900 text-slate-400 shadow-2xl">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-brand flex items-center justify-center text-white font-black text-xs">F</div>
                FieldFlow
              </h1>
              <p className="text-[11px] leading-relaxed text-slate-400">
                The ultimate decentralized field service dispatch platform connecting customers with matching certified technicians.
              </p>
            </div>
            <div>
              <h5 className="font-extrabold text-xs uppercase tracking-wider mb-4 text-white">Services</h5>
              <ul className="space-y-2.5 font-semibold">
                <li>
                  <a 
                    href="#services" 
                    onClick={() => setCategoryFilter('AC Repair')}
                    className="hover:text-brand transition-colors"
                  >
                    AC Maintenance
                  </a>
                </li>
                <li>
                  <a 
                    href="#services" 
                    onClick={() => setCategoryFilter('Electrical')}
                    className="hover:text-brand transition-colors"
                  >
                    Electrical Rewiring
                  </a>
                </li>
                <li>
                  <a 
                    href="#services" 
                    onClick={() => setCategoryFilter('Plumbing')}
                    className="hover:text-brand transition-colors"
                  >
                    Plumbing & Pumps
                  </a>
                </li>
                <li>
                  <a 
                    href="#services" 
                    onClick={() => setCategoryFilter('Generator Repair')}
                    className="hover:text-brand transition-colors"
                  >
                    Generator Repair
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="font-extrabold text-xs uppercase tracking-wider mb-4 text-white">Portal Links</h5>
              <ul className="space-y-2.5 font-semibold">
                <li><Link to="/login" className="hover:text-brand">Customer Login</Link></li>
                <li><Link to="/apply" className="hover:text-brand">Technician Registration</Link></li>
                <li><Link to="/login" className="hover:text-brand">Admin Console</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="font-extrabold text-xs uppercase tracking-wider mb-4 text-white">Help & Support</h5>
              <ul className="space-y-2.5">
                <li>
                  <span className="text-slate-500 block font-bold">Customer Care Desk:</span> 
                  <a href="tel:+94112345678" className="font-bold text-sm mt-0.5 text-white hover:text-brand transition-colors block">
                    +94 11 234 5678
                  </a>
                </li>
                <li>
                  <span className="text-slate-500 block font-bold">Email support:</span> 
                  <a href="mailto:help@fieldflow.lk" className="font-bold text-sm mt-0.5 text-white hover:text-brand transition-colors block">
                    help@fieldflow.lk
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-6 border-t border-slate-900 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase font-bold tracking-wider">
            <span>© {new Date().getFullYear()} FieldFlow Inc. All Rights Reserved.</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Use</a>
            </div>
          </div>
        </footer>

      </div>

      {/* PROVIDER DETAILS & RATING PREVIEW MODAL */}
      {showDetailModal && selectedService && selectedProvider && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-[32px] shadow-2xl border overflow-hidden relative ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-slate-200' : 'bg-white border-slate-205 text-slate-850'
          }`}>
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-100/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={18} className="text-brand" />
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Select Service Provider</h3>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className={`p-1 rounded-lg border cursor-pointer ${
                  isDark ? 'bg-slate-950 border-slate-855 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-slate-955/50 border-slate-850' : 'bg-slate-50 border-slate-200 shadow-sm'
              }`}>
                <div className="flex justify-between items-center">
                  <h4 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedProvider.name}</h4>
                  <span className="bg-brand/10 text-brand text-xs font-black px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <Star size={12} className="fill-brand" /> {selectedProvider.rating}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Phone size={10} className="text-slate-500" /> Phone: {selectedProvider.phone}
                </p>
                <p className="text-xs italic font-medium">
                  "{selectedProvider.recentFeedback}"
                </p>
              </div>

              {/* Provider Location Map Pin Visualizer */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Live Provider Area Map (Nearest to Colombo)</p>
                <div 
                  id="provider-map-container" 
                  className="h-44 w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden relative z-10 shadow-inner"
                ></div>
              </div>

              {!user && (
                <div className="bg-amber-955/20 text-amber-500 p-3.5 rounded-xl border border-amber-900/35 text-[10px] font-bold flex items-center gap-2">
                  <ShieldAlert size={14} className="shrink-0" />
                  <span>You must be logged into your customer portal to submit service requests.</span>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-900/10 border-t border-slate-800/10 flex justify-end gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2.5 border border-slate-205 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleProceedToBook}
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Proceed to Book Service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. BOOK SERVICE SIMPLIFIED PREMIUM GLASS MODAL */}
      {showBookModal && selectedService && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className={`max-w-md w-full rounded-[32px] shadow-2xl border overflow-hidden relative ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-slate-200' : 'bg-white border-slate-205 text-slate-855'
          }`}>
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-100/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-brand">
                <ClipboardList size={20} />
                <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Book: {selectedService.name}</h3>
              </div>
              <button 
                onClick={() => setShowBookModal(false)}
                className={`p-1 rounded-lg border transition-all cursor-pointer ${
                  isDark ? 'bg-slate-955 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-105 border-slate-205 text-slate-500'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4 max-h-[68vh] overflow-y-auto">
              {feedback && (
                <div className={`p-4 rounded-2xl text-xs border flex items-center gap-2 ${
                  feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-450 border-red-900/30'
                }`}>
                  {feedback.success ? <Check size={14} /> : <AlertCircle size={14} />}
                  <span className="font-medium">{feedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Describe Your Problem
                </label>
                <textarea
                  required
                  rows="2"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand/45 transition-all ${
                    isDark ? 'bg-slate-955/60 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-900'
                  }`}
                  placeholder="Describe what needs repair/service..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand/45 ${
                      isDark ? 'bg-slate-955/60 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-900'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone size={10} className="text-brand" /> Contact Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand/45 ${
                      isDark ? 'bg-slate-955/60 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-900'
                    }`}
                    placeholder="e.g. 0771234567"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
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

              <div>
                <label className="block text-[10px] font-bold text-slate-555 uppercase tracking-wider mb-1.5">
                  Service Delivery Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-brand/45 ${
                    isDark ? 'bg-slate-955/60 border-slate-805 text-white' : 'bg-white border-slate-205 text-slate-900'
                  }`}
                  placeholder="Street and City (Autofills on map pin drop)"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-slate-100/10">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="px-5 py-2.5 border border-slate-205 rounded-xl text-xs font-semibold text-slate-450 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-[0_8px_16px_rgba(0,168,150,0.3)] hover:shadow-lg transition-all cursor-pointer"
                >
                  {submitLoading ? 'Requesting...' : 'Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER BOOKINGS HISTORY PREMIUM GLASS MODAL */}
      {showMyBookings && (
        <div className="fixed inset-0 bg-slate-955/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-2xl w-full rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border overflow-hidden relative ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-slate-200' : 'bg-white border-slate-205 text-slate-855'
          }`}>
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-100/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-brand">
                <ClipboardList size={20} />
                <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>My Booked Services</h3>
              </div>
              <button 
                onClick={() => setShowMyBookings(false)}
                className={`p-1 rounded-lg border cursor-pointer ${
                  isDark ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-slate-105 border-slate-205 text-slate-500'
                }`}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[58vh] space-y-4">
              {myBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-555 font-semibold">
                  You have not submitted any service bookings yet.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {myBookings.map((booking) => (
                    <div 
                      key={booking._id} 
                      className={`border p-5 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs shadow-lg ${
                        isDark ? 'bg-slate-950/50 border-slate-850' : 'bg-slate-50 border-slate-205'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className={`font-extrabold text-sm tracking-tight flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <span>{booking.serviceId?.name || 'Service Requested'}</span>
                        </div>
                        <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                          <MapPin size={13} className="text-brand shrink-0" /> {booking.address}
                        </div>
                        <div className="text-[9px] text-slate-500 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                          <Calendar size={13} className="text-slate-500" /> Pref. Date: {new Date(booking.preferredDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-auto">
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold border capitalize ${
                          booking.status === 'Completed'
                            ? 'bg-brand-light text-brand border-brand/20'
                            : booking.status === 'Assigned'
                            ? 'bg-sky-950/20 text-sky-400 border-sky-500/20'
                            : booking.status === 'Travelling'
                            ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20 animate-pulse'
                            : 'bg-slate-900/30 text-slate-550 border-slate-500/20'
                        }`}>
                          {booking.status === 'Travelling' ? 'ON THE WAY' : booking.status}
                        </span>
                        
                        {(booking.status === 'Assigned' || booking.status === 'Travelling' || booking.status === 'Accepted' || booking.status === 'Arrived') && (
                          <button
                            onClick={() => handleOpenTracking(booking)}
                            className="bg-brand text-white font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 hover:bg-brand-hover transition-colors cursor-pointer text-[10px] shadow-sm"
                          >
                            <Eye size={12} /> Track Live
                          </button>
                        )}

                        {booking.serviceId?.price && (
                          <div className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            LKR {booking.serviceId.price?.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-900/10 border-t border-slate-800/10 flex justify-end">
              <button
                onClick={() => setShowMyBookings(false)}
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-855 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REAL-TIME LIVE DISPATCH TRACKING MODAL */}
      {showTracking && trackingBooking && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-xl w-full rounded-[32px] shadow-2xl border overflow-hidden relative ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-slate-200' : 'bg-white border-slate-205 text-slate-850'
          }`}>
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-100/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation size={18} className="text-brand animate-pulse" />
                <h3 className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Tracking Technician Dispatch</h3>
              </div>
              <button 
                onClick={() => setShowTracking(false)}
                className="text-slate-400 hover:text-white p-1 bg-slate-905 rounded-lg border border-slate-800 hover:bg-slate-900 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className={`grid grid-cols-3 gap-4 p-4 rounded-2xl border text-center animate-pulse ${
                isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-slate-50 border-slate-205'
              }`}>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Status</p>
                  <p className="text-xs font-bold text-brand mt-0.5 capitalize">{trackingBooking.status}</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Distance</p>
                  <p className={`text-xs font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{trackingDistance} km</p>
                </div>
                <div>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">ETA</p>
                  <p className={`text-xs font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {trackingBooking.status === 'Travelling' ? `${trackingEta} mins` : 'Waiting...'}
                  </p>
                </div>
              </div>

              <div 
                id="tracking-map-container" 
                className="h-64 w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden z-10 relative shadow-inner"
              ></div>

              <div className={`text-[10px] font-semibold leading-relaxed p-3.5 rounded-xl border flex items-center gap-2 ${
                isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-205 text-slate-700'
              }`}>
                <CheckCircle size={14} className="text-brand shrink-0" />
                {trackingBooking.status === 'Travelling' ? (
                  <span>Technician updated: "I am en route to your location. Estimating arrival in {trackingEta} mins."</span>
                ) : (
                  <span>Job Accepted! Tracking will activate once the technician selects their travel ETA and departs.</span>
                )}
              </div>
            </div>

            <div className="p-5 bg-slate-900/10 border-t border-slate-800/10 flex justify-end">
              <button
                onClick={() => setShowTracking(false)}
                className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-855 text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Dismiss Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRIVACY POLICY / TERMS OF USE DYNAMIC GLASS MODAL */}
      {showPolicyModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-[32px] shadow-2xl border overflow-hidden relative ${
            isDark ? 'bg-slate-900/95 border-slate-800 text-slate-200' : 'bg-white border-slate-205 text-slate-850'
          }`}>
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-100/10 flex items-center justify-between">
              <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {showPolicyModal === 'privacy' ? 'Privacy Policy' : 'Terms of Use'}
              </h3>
              <button 
                onClick={() => setShowPolicyModal(null)}
                className={`p-1 rounded-lg border cursor-pointer ${
                  isDark ? 'bg-slate-950 border-slate-855 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs leading-relaxed">
              {showPolicyModal === 'privacy' ? (
                <>
                  <p className="font-bold text-[10px] text-brand uppercase tracking-wider">1. Data Collection</p>
                  <p className="text-slate-500">
                    We collect essential information like your phone number, service address coordinates, and name to coordinate job matches with technicians.
                  </p>
                  <p className="font-bold text-[10px] text-brand uppercase tracking-wider">2. Live Location Sharing</p>
                  <p className="text-slate-405">
                    When tracking a technician en route, coordinates are accessed temporarily in real-time to facilitate ETA simulation and dispatch maps.
                  </p>
                  <p className="font-bold text-[10px] text-brand uppercase tracking-wider">3. Security Assurance</p>
                  <p className="text-slate-405">
                    All client-technician profiles and invoice ledger sheets are cryptographically hashed and isolated securely per company tenants.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[10px] text-brand uppercase tracking-wider">1. Acceptable Use</p>
                  <p className="text-slate-405">
                    Users must provide authentic and precise GPS job coordinates when booking field service work orders. Mock or false requests are strictly prohibited.
                  </p>
                  <p className="font-bold text-[10px] text-brand uppercase tracking-wider">2. Technician Code of Conduct</p>
                  <p className="text-slate-405">
                    Technicians are required to send honest arrival ETA updates and maintain updated availability states on their mobile dispatcher consoles.
                  </p>
                  <p className="font-bold text-[10px] text-brand uppercase tracking-wider">3. Cost & Billing Settlement</p>
                  <p className="text-slate-405">
                    Payments are auto-calculated dynamically based on task labor hours and reported spare part ledgers upon invoice completion.
                  </p>
                </>
              )}
            </div>

            <div className="p-5 bg-slate-900/10 border-t border-slate-800/10 flex justify-end">
              <button
                onClick={() => setShowPolicyModal(null)}
                className="px-5 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Accept & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. GORGEOUS CUSTOMER PROFILE DETAILS MODAL */}
      {showProfileModal && user && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className={`max-w-md w-full rounded-[32px] shadow-2xl border overflow-hidden relative ${
            isDark ? 'bg-slate-900/95 border-slate-805 text-slate-200' : 'bg-white border-slate-205 text-slate-850'
          }`}>
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand to-transparent"></div>
            
            <div className="p-6 border-b border-slate-100/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={18} className="text-brand" />
                <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>My FieldFlow Profile</h3>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className={`p-1 rounded-lg border cursor-pointer ${
                  isDark ? 'bg-slate-950 border-slate-850 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-center">
              {/* Profile Card Header with Initials badge */}
              <div className="space-y-3">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-brand to-emerald-500 text-white flex items-center justify-center text-2xl font-black mx-auto shadow-[0_8px_25px_rgba(0,168,150,0.3)]">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className={`font-extrabold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.name}</h4>
                  <div className="flex justify-center items-center gap-1.5 mt-1">
                    <span className="bg-brand/10 text-brand text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {user.role?.replace('_', ' ')}
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-0.5 uppercase tracking-wider">
                      <Check size={8} className="stroke-[3]" /> Verified Account
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Profile Identity Specifications */}
              <div className={`p-5 rounded-2xl border text-left space-y-3 text-xs ${
                isDark ? 'bg-slate-950/40 border-slate-850' : 'bg-slate-50 border-slate-205 shadow-inner'
              }`}>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/10">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Email Address</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.email || 'piyumi@gmail.com'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/10">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Phone Contact</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.phone || '+94 77 123 4567'}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-800/10">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Service Coordinates</span>
                  <span className={`font-mono text-[10px] text-brand font-bold`}>6.9271° N, 79.8612° E</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Member Since</span>
                  <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>August 20, 2026</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-900/10 border-t border-slate-800/10 flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
