import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, CheckCircle, ShieldAlert, FileText, UploadCloud, X, MapPin, Navigation } from 'lucide-react';

// Fix Leaflet Default Icon path resolution issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function ApplyTechnician() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('AC Repair');
  const [experienceYears, setExperienceYears] = useState('');
  
  // Location / Geocoding State
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: 6.9271, lng: 79.8612 });
  const [detectingLocation, setDetectingLocation] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Autocomplete Suggestions State
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // File upload state
  const [cvFile, setCvFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleAddressChange = async (val) => {
    setAddress(val);
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5000/api/v1/geocode/search?q=${encodeURIComponent(val)}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Failed to fetch address suggestions via proxy', err);
    }
  };

  const handleSelectSuggestion = (sug) => {
    const lat = parseFloat(sug.lat);
    const lng = parseFloat(sug.lon);
    setAddress(sug.display_name);
    setCoordinates({ lat, lng });
    setSuggestions([]);
    setShowSuggestions(false);
    
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], 14);
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    }
  };

  const fetchAddressFromCoords = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`, {
        headers: { 'Accept-Language': 'en' }
      });
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      }
    } catch (error) {
      console.error('OSM Geocoding failed:', error);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCoords = { lat: latitude, lng: longitude };
        setCoordinates(newCoords);
        if (mapRef.current) {
          mapRef.current.setView([latitude, longitude], 14);
        }
        if (markerRef.current) {
          markerRef.current.setLatLng([latitude, longitude]);
        }
        fetchAddressFromCoords(latitude, longitude);
        setDetectingLocation(false);
      },
      (error) => {
        console.error('Geolocation lock error:', error);
        setDetectingLocation(false);
        alert('Could not auto-lock your GPS location. Please drop a pin on the map manually!');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Initialize registration map
  useEffect(() => {
    const mapContainer = document.getElementById('tech-register-map');
    if (!mapContainer || mapRef.current) return;

    const map = L.map('tech-register-map', {
      zoomControl: true,
      scrollWheelZoom: true
    }).setView([coordinates.lat, coordinates.lng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([coordinates.lat, coordinates.lng], {
      draggable: true
    }).addTo(map);

    // Initial geocode
    fetchAddressFromCoords(coordinates.lat, coordinates.lng);

    marker.on('dragend', (e) => {
      const { lat, lng } = e.target.getLatLng();
      setCoordinates({ lat, lng });
      fetchAddressFromCoords(lat, lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setCoordinates({ lat, lng });
      marker.setLatLng([lat, lng]);
      fetchAddressFromCoords(lat, lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    axios.get('http://localhost:5000/api/v1/companies')
      .then(res => {
        if (res.data.success && res.data.data.length > 0) {
          setCompanies(res.data.data);
          setSelectedCompanyId(res.data.data[0]._id);
        }
      })
      .catch(err => {
        console.error('Failed to load companies, using default seed');
      });
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCvFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      setFeedback({ success: false, message: 'Please drop or browse your CV file first!' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const base64File = await getBase64(cvFile);

      const res = await axios.post('http://localhost:5000/api/v1/technicians/apply', {
        name,
        email,
        password,
        skills: [selectedSkill],
        experienceYears: Number(experienceYears),
        fileName: cvFile.name,
        fileData: base64File,
        companyId: selectedCompanyId || undefined,
        address,
        coordinates
      });

      if (res.data.success) {
        setFeedback({ success: true, message: res.data.message });
        setName('');
        setEmail('');
        setPassword('');
        setExperienceYears('');
        setCvFile(null);
        
        // Auto redirect to Homepage after 2.5 seconds
        setTimeout(() => {
          navigate('/');
        }, 2500);
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  const skillOptions = [
    'AC Repair',
    'Plumbing',
    'Electrical',
    'Generator Repair',
    'Appliance Repair'
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative text-slate-200 flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/landing_bg.jpg')" }}
    >
      {/* Dark mask */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-0"></div>

      {/* Frosted Glass Apply Container */}
      <div className="max-w-lg w-full bg-slate-900/60 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-slate-800/60 overflow-hidden relative z-10 p-7 space-y-6">
        
        <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
          <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-semibold">
            <ArrowLeft size={16} /> Home
          </Link>
          <h2 className="text-sm font-extrabold text-brand uppercase tracking-wider">Workforce Registration</h2>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-white">Apply as Technician</h3>
          <p className="text-xs text-slate-400 font-medium">Provide your credentials and qualifications for admin review.</p>
        </div>

        {feedback && (
          <div className={`p-4 rounded-2xl text-xs border flex items-center gap-2 ${
            feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
          }`}>
            {feedback.success ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. Ruwan Perera"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. ruwan@gmail.com"
                autoComplete="new-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Portal Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Years of Experience
              </label>
              <input
                type="number"
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Primary Expertise
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {skillOptions.map(skill => (
                <option key={skill} value={skill} className="bg-slate-900 text-white text-xs">{skill}</option>
              ))}
            </select>
          </div>

          {/* Geocoded Address Map Picker */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Home Base Address (GPS Auto-Locked)
              </label>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="text-[9px] font-black uppercase tracking-wider text-brand hover:text-brand-hover flex items-center gap-1 bg-brand/10 border border-brand/20 px-2 py-1 rounded-lg cursor-pointer"
              >
                <Navigation size={10} className={detectingLocation ? 'animate-spin' : ''} /> 
                {detectingLocation ? 'Locating...' : 'Get Current GPS'}
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                required
                name="tech-home-address-field-unique"
                autoComplete="off"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="Type location (e.g. Colombo, Vavuniya) or drag marker"
              />
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand" />

              {/* Autocomplete suggestions list */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-800/80 rounded-xl shadow-2xl z-[60] overflow-hidden text-xs max-h-48 overflow-y-auto">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.place_id}
                      onClick={() => handleSelectSuggestion(sug)}
                      className="px-3.5 py-2 hover:bg-brand/20 text-slate-200 cursor-pointer border-b border-slate-800/40 last:border-0 truncate"
                      title={sug.display_name}
                    >
                      {sug.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Map Container */}
            <div className="h-40 rounded-2xl overflow-hidden border border-slate-800/80 shadow-md relative z-10">
              <div id="tech-register-map" className="h-full w-full"></div>
            </div>
          </div>

          {/* Drag & Drop CV File Upload Area */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Upload CV / Resume Document (PDF/Doc)
            </label>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                dragActive 
                  ? 'border-brand bg-brand/10 scale-[1.01]' 
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <input
                id="cv-file-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {cvFile ? (
                <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2 text-white">
                    <FileText size={18} className="text-brand" />
                    <span className="font-bold truncate max-w-[240px]">{cvFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">({(cvFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setCvFile(null)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="cv-file-input" 
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <UploadCloud size={28} className="text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-white">Drag & drop your file here, or <span className="text-brand hover:underline">browse</span></p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Supports PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-[0_8px_16px_rgba(0,168,150,0.3)] hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting profile...' : 'Submit Application'}
          </button>
        </form>

      </div>
    </div>
  );
}
