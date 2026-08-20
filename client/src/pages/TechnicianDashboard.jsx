import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuthStore } from '../store/authStore';
import { 
  ClipboardList, 
  CheckCircle, 
  Navigation, 
  MapPin, 
  Play, 
  Check, 
  Power, 
  Clock, 
  DollarSign, 
  FileText, 
  AlertCircle,
  Plus,
  Trash,
  X
} from 'lucide-react';

// Fix Leaflet Default Icon path resolution issues in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function TechnicianDashboard() {
  const { accessToken, user } = useAuthStore();
  const [workOrders, setWorkOrders] = useState([]);
  const [availableRequests, setAvailableRequests] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // ETA modal trigger
  const [showEtaModal, setShowEtaModal] = useState(false);
  const [etaOrderId, setEtaOrderId] = useState(null);
  const [selectedEta, setSelectedEta] = useState(15); // default 15 mins

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Completion Form State
  const [laborCost, setLaborCost] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [parts, setParts] = useState([{ name: '', quantity: 1, price: 0 }]);

  const mapInstances = useRef({});

  const fetchProfileAndOrders = async () => {
    try {
      // 1. Fetch all work orders for this technician
      const response = await axios.get('http://localhost:5000/api/v1/work-orders', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.data.success) {
        setWorkOrders(response.data.data);
      }

      // 2. Fetch technician list to resolve own profile status
      const techResponse = await axios.get('http://localhost:5000/api/v1/technicians', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      let ownProfile = null;
      if (techResponse.data.success) {
        ownProfile = techResponse.data.data.find(t => {
          const tUserId = t.userId?._id || t.userId;
          const currentUserId = user?._id || user?.id;
          return tUserId?.toString() === currentUserId?.toString();
        });
        if (ownProfile) {
          setProfile(ownProfile);
        }
      }

      // 3. Fetch all available requests
      const reqResponse = await axios.get('http://localhost:5000/api/v1/service-requests', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (reqResponse.data.success) {
        setAvailableRequests(reqResponse.data.data);
      }
    } catch (err) {
      console.error('Failed to load technician dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExpressInterest = async (requestId) => {
    if (!window.confirm('Are you sure you want to express interest in this job? Admin will review and assign.')) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await axios.post(`http://localhost:5000/api/v1/service-requests/${requestId}/interest`, {}, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setFeedback({ success: true, message: 'Interest expressed successfully! Admin has been notified.' });
        fetchProfileAndOrders();
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Failed to express interest.' });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndOrders();
  }, [accessToken, user]);

  // Mount Leaflet maps on work orders
  useEffect(() => {
    if (workOrders.length > 0) {
      workOrders.forEach(order => {
        const mapContainerId = `tech-map-${order._id}`;
        const container = document.getElementById(mapContainerId);
        
        if (container) {
          // Destroy existing map instance if initialized
          if (mapInstances.current[order._id]) {
            mapInstances.current[order._id].remove();
          }

          // Customer coordinates
          const custLat = order.requestId?.coordinates?.lat || 6.9271;
          const custLng = order.requestId?.coordinates?.lng || 79.8612;

          const map = L.map(mapContainerId).setView([custLat, custLng], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
          }).addTo(map);

          // Add Customer destination marker
          const customerIcon = L.icon({
            iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619034.png', // Home Icon
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          });
          L.marker([custLat, custLng], { icon: customerIcon }).addTo(map)
            .bindPopup(`Customer Jobsite: ${order.customerId?.userId?.name}`).openPopup();

          mapInstances.current[order._id] = map;
        }
      });
    }

    return () => {
      // Cleanup maps on unmount
      Object.keys(mapInstances.current).forEach(id => {
        if (mapInstances.current[id]) {
          mapInstances.current[id].remove();
        }
      });
      mapInstances.current = {};
    };
  }, [workOrders]);

  const handleToggleStatus = async () => {
    if (!profile) return;
    const nextStatus = profile.availabilityStatus === 'available' ? 'offline' : 'available';
    setActionLoading(true);
    try {
      const res = await axios.put(`http://localhost:5000/api/v1/technicians/${profile._id}`, {
        availabilityStatus: nextStatus
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setProfile({ ...profile, availabilityStatus: nextStatus });
        setFeedback({ success: true, message: `Status updated to ${nextStatus}!` });
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Failed to update availability status' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus, payload = {}) => {
    setActionLoading(true);
    setFeedback(null);
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/v1/work-orders/${orderId}/status`,
        { status: newStatus, ...payload },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data.success) {
        setSelectedOrder(null);
        setShowEtaModal(false);
        setFeedback({ success: true, message: `Job updated to: ${newStatus}` });
        fetchProfileAndOrders();
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Status update failed' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenTravel = (orderId) => {
    setEtaOrderId(orderId);
    setSelectedEta(15); // default
    setShowEtaModal(true);
  };

  const handleConfirmTravel = () => {
    const order = workOrders.find(o => o._id === etaOrderId);
    const destLat = order?.requestId?.coordinates?.lat || 6.9271;
    const destLng = order?.requestId?.coordinates?.lng || 79.8612;

    // Start technician traveling coordinates slightly further away (simulate approach)
    const initialTechLat = destLat + 0.012;
    const initialTechLng = destLng + 0.012;

    handleStatusUpdate(etaOrderId, 'Travelling', {
      eta: Number(selectedEta),
      lat: initialTechLat,
      lng: initialTechLng
    });
  };

  const handleAddPart = () => {
    setParts([...parts, { name: '', quantity: 1, price: 0 }]);
  };

  const handleRemovePart = (index) => {
    const updated = parts.filter((_, idx) => idx !== index);
    setParts(updated);
  };

  const handlePartChange = (index, field, value) => {
    const updated = [...parts];
    updated[index][field] = value;
    setParts(updated);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    const filteredParts = parts.filter(p => p.name.trim() !== '');
    handleStatusUpdate(selectedOrder._id, 'Completed', {
      notes: workNotes,
      laborCost: Number(laborCost) || 0,
      parts: filteredParts
    });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-lg mx-auto animate-pulse">
        <div className="h-10 w-48 bg-slate-900/40 backdrop-blur-md rounded-2xl"></div>
        <div className="h-44 bg-slate-900/40 backdrop-blur-md rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 relative text-slate-300">
      {/* Decorative Neon Blob */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header with Availability Status Control */}
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Technician Console</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">My Active Tasks</p>
        </div>

        {profile && (
          <button
            onClick={handleToggleStatus}
            disabled={actionLoading}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              profile.availabilityStatus === 'available'
                ? 'bg-brand/10 border-brand/20 text-brand shadow-[0_0_12px_rgba(0,168,150,0.2)]'
                : 'bg-amber-955/20 border-amber-500/20 text-amber-500'
            }`}
          >
            <Power size={14} />
            {profile.availabilityStatus === 'available' ? 'Online' : 'Offline'}
          </button>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs border backdrop-blur-md flex items-center gap-2 relative z-10 ${
          feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
        }`}>
          {feedback.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Available Jobs Pool */}
      {profile && (
        <div className="space-y-4 relative z-10 mb-8">
          <div className="flex items-center gap-2 text-brand">
            <ClipboardList size={18} />
            <h3 className="font-extrabold text-sm text-white">Available Jobs Pool</h3>
          </div>
          {availableRequests.filter(req => 
            (req.status === 'Pending' || req.status === 'Reviewed') &&
            req.serviceId?.requiredSkills?.some(skill => profile.skills?.map(s => s.toLowerCase()).includes(skill.toLowerCase()))
          ).length === 0 ? (
            <div className="bg-slate-900/20 backdrop-blur-md rounded-3xl border border-slate-800/40 p-5 text-center text-slate-500 text-xs font-semibold">
              No matching open jobs available in the pool right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {availableRequests
                .filter(req => 
                  (req.status === 'Pending' || req.status === 'Reviewed') &&
                  req.serviceId?.requiredSkills?.some(skill => profile.skills?.map(s => s.toLowerCase()).includes(skill.toLowerCase()))
                )
                .map((req) => (
                  <div key={req._id} className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-5 space-y-3.5 flex flex-col justify-between shadow-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-sm text-white">{req.serviceId?.name}</h4>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-bold border border-amber-500/10">
                          {req.priority?.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium line-clamp-2 leading-relaxed">
                        {req.problemDescription}
                      </p>
                      <div className="text-[10px] text-slate-500 font-bold flex flex-col gap-1.5">
                        <div className="flex items-start gap-1.5">
                          <MapPin size={12} className="text-brand mt-0.5 shrink-0" /> 
                          <span>{req.address?.street || req.address}, {req.address?.city || ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 uppercase tracking-wider">
                          <Clock size={12} className="text-slate-500 shrink-0" /> 
                          <span>Pref Date: {new Date(req.preferredDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {req.interestedTechnicians?.includes(profile._id) ? (
                      <button
                        disabled
                        className="w-full mt-2 bg-slate-850 text-slate-500 font-extrabold py-2.5 rounded-xl text-xs border border-slate-800/40 text-center cursor-not-allowed"
                      >
                        Interest Expressed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleExpressInterest(req._id)}
                        disabled={actionLoading}
                        className="w-full mt-2 bg-brand hover:bg-brand-hover text-white font-extrabold py-2.5 rounded-xl text-xs shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all cursor-pointer text-center"
                      >
                        Express Interest
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Task List */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-2 text-brand mb-1">
          <ClipboardList size={18} />
          <h3 className="font-extrabold text-sm text-white">My Active Tasks</h3>
        </div>
        {workOrders.length === 0 ? (
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-8 text-center text-slate-500 font-semibold">
            No active jobs assigned to you currently.
          </div>
        ) : (
          workOrders.map((order) => (
            <div key={order._id} className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-5 space-y-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)]">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white text-sm">{order.serviceId?.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-bold flex items-center gap-1">
                    <Clock size={12} /> {new Date(order.scheduledDate).toLocaleString()}
                  </p>
                </div>
                <span className={`inline-flex px-2.5 py-1 rounded-lg text-[9px] font-bold border capitalize ${
                  order.status === 'Completed'
                    ? 'bg-brand-light text-brand border-brand/20'
                    : order.status === 'In Progress'
                    ? 'bg-emerald-950/20 text-emerald-450 border-emerald-500/20'
                    : 'bg-indigo-950/20 text-indigo-400 border-indigo-500/20'
                }`}>
                  {order.status}
                </span>
              </div>

              {/* Destination Map Container if active */}
              {(order.status === 'Travelling' || order.status === 'Accepted' || order.status === 'Arrived' || order.status === 'In Progress') && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Job Destination Map</p>
                  <div 
                    id={`tech-map-${order._id}`} 
                    className="h-44 w-full rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden z-10 relative"
                  ></div>
                </div>
              )}

              {/* Customer Info Box */}
              <div className="bg-slate-950/30 border border-slate-850/40 rounded-2xl p-4 text-xs space-y-2.5">
                <div className="flex items-center gap-2 text-slate-350 font-bold">
                  <MapPin size={14} className="text-brand shrink-0" />
                  <span>{order.customerId?.userId?.name || 'Customer Profile'}</span>
                </div>
                <div className="text-slate-300 pl-5 leading-relaxed font-semibold">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Address & Phone:</span>
                  {order.customerId?.phone} | {order.address || order.customerId?.addresses?.[0] || 'On-site'}
                </div>
                <div className="text-slate-300 pl-5 leading-relaxed font-semibold">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Dispatch notes:</span>
                  {order.notes || 'No dispatch notes'}
                </div>
                {order.eta && (
                  <div className="text-brand pl-5 font-bold flex items-center gap-1.5">
                    <Clock size={13} />
                    <span>Travel ETA Sent: {order.eta} mins</span>
                  </div>
                )}
              </div>

              {/* Workflow status controls */}
              <div className="pt-2">
                {order.status === 'Assigned' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(order._id, 'Accepted')}
                    className="w-full bg-brand hover:bg-brand-hover text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={15} /> Accept Job Assignment
                  </button>
                )}

                {order.status === 'Accepted' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleOpenTravel(order._id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Navigation size={15} /> Start Travel to Location
                  </button>
                )}

                {order.status === 'Travelling' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(order._id, 'Arrived')}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MapPin size={15} /> Confirm Arrival
                  </button>
                )}

                {order.status === 'Arrived' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(order._id, 'In Progress')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Play size={15} /> Start Execution (Work)
                  </button>
                )}

                {order.status === 'In Progress' && (
                  <button
                    onClick={() => {
                      setLaborCost('');
                      setWorkNotes('');
                      setParts([{ name: '', quantity: 1, price: 0 }]);
                      setSelectedOrder(order);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check size={15} /> Report Completion & Invoice
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Travelling ETA Selection Dropdown Modal */}
      {showEtaModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-xs w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-200 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h4 className="font-bold text-white text-xs uppercase tracking-wide">Select Travel ETA</h4>
              <button onClick={() => setShowEtaModal(false)} className="text-slate-400 hover:text-white">
                <X size={14} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                How many minutes will you take?
              </label>
              <select
                value={selectedEta}
                onChange={(e) => setSelectedEta(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
              >
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="20">20 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>

            <button
              onClick={handleConfirmTravel}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
            >
              Confirm & Start Travelling
            </button>
          </div>
        </div>
      )}

      {/* Completion & Billing Form Glass Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-800/60 overflow-hidden my-8 text-slate-200">
            <div className="p-5 border-b border-slate-800/60">
              <h3 className="font-bold text-white text-sm">Report Completion & Billing</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Job: {selectedOrder.serviceId?.name}</p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Labor Cost (LKR)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={laborCost}
                    onChange={(e) => setLaborCost(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-955/40 border border-slate-805 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="e.g. 1500"
                  />
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Job Resolution Notes
                </label>
                <textarea
                  rows="3"
                  required
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-955/40 border border-slate-805 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="Explain what repair or work was completed..."
                ></textarea>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Parts Used
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="text-[10px] text-brand hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus size={12} /> Add Part
                  </button>
                </div>
                <div className="space-y-2">
                  {parts.map((part, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Part name"
                        value={part.name}
                        onChange={(e) => handlePartChange(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={part.quantity}
                        onChange={(e) => handlePartChange(idx, 'quantity', Number(e.target.value))}
                        className="w-14 px-2 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white text-center focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={part.price}
                        onChange={(e) => handlePartChange(idx, 'price', Number(e.target.value))}
                        className="w-18 px-2 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white text-center focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePart(idx)}
                        className="p-2 text-slate-550 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-slate-800/60 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {actionLoading ? 'Saving...' : 'Submit Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
