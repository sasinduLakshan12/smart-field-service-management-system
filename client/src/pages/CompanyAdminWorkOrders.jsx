import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  ClipboardList, 
  Calendar, 
  User, 
  UserCheck, 
  Clock, 
  Send, 
  AlertCircle, 
  CheckCircle,
  FileText,
  UserPlus
} from 'lucide-react';

export default function CompanyAdminWorkOrders() {
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'requests'
  const [workOrders, setWorkOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dispatch Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchWorkOrders = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/work-orders', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setWorkOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/service-requests', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        // Filter only 'Pending' requests for assignment
        const pending = res.data.data.filter(r => r.status === 'Pending');
        setRequests(pending);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/technicians', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setTechnicians(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchWorkOrders(), fetchRequests(), fetchTechnicians()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const handleOpenDispatchModal = (reqItem) => {
    setSelectedRequest(reqItem);
    
    // Auto filter matching technicians by matching skills
    const serviceName = reqItem.serviceId?.name?.toLowerCase() || '';
    const matchingTechs = technicians.filter(tech => 
      tech.availabilityStatus === 'available' &&
      tech.skills.some(skill => 
        serviceName.includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(serviceName)
      )
    );

    if (reqItem.interestedTechnicians && reqItem.interestedTechnicians.length > 0) {
      let bestTechId = reqItem.interestedTechnicians[0]._id;
      let highestRating = -1;
      reqItem.interestedTechnicians.forEach(tech => {
        const fullTech = technicians.find(t => t._id === tech._id);
        const rating = fullTech?.ratings?.average || 5.0;
        if (rating > highestRating) {
          highestRating = rating;
          bestTechId = tech._id;
        }
      });
      setSelectedTechId(bestTechId);
    } else if (matchingTechs.length > 0) {
      setSelectedTechId(matchingTechs[0]._id);
    } else {
      setSelectedTechId('');
    }
    
    setScheduledDate(reqItem.preferredDate ? reqItem.preferredDate.slice(0, 10) : '');
    setNotes(reqItem.problemDescription || '');
    setFeedback(null);
    setShowModal(true);
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!selectedTechId) {
      setFeedback({ success: false, message: 'Please select an available skilled technician!' });
      return;
    }

    setSubmitLoading(true);
    setFeedback(null);

    try {
      const res = await axios.post('http://localhost:5000/api/v1/work-orders', {
        requestId: selectedRequest._id,
        technicianId: selectedTechId,
        scheduledDate,
        notes
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data.success) {
        setFeedback({ success: true, message: 'Job successfully dispatched to technician!' });
        setTimeout(() => {
          setShowModal(false);
          loadData();
        }, 1500);
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Dispatch failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Return all technicians so the admin can manually select anyone if needed
  const getFilteredTechs = () => {
    return technicians;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900/40 backdrop-blur-md rounded-2xl"></div>
        <div className="h-64 bg-slate-900/40 backdrop-blur-md rounded-3xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative text-slate-300">
      {/* Decorative Blur Blobs */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Work Orders & Operations</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Job Dispatcher Board</p>
        </div>
      </div>

      {feedback && !showModal && (
        <div className={`p-4 rounded-2xl text-xs border backdrop-blur-md flex items-center gap-2 ${
          feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
        }`}>
          {feedback.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-950/40 border border-slate-900/60 rounded-xl w-fit relative z-10">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'orders' 
              ? 'bg-brand text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Work Orders ({workOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'requests' 
              ? 'bg-brand text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Incoming Customer Requests ({requests.length})
        </button>
      </div>

      {/* ACTIVE WORK ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60 overflow-hidden relative z-10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/20 border-b border-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Job Description</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Assigned Tech</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Invoiced Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-300">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-semibold">
                    No active work orders. Select "Incoming Requests" to dispatch new jobs.
                  </td>
                </tr>
              ) : (
                workOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-950/20 transition-colors duration-150">
                    <td className="p-4 pl-6 font-bold text-slate-200 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
                        <ClipboardList size={14} />
                      </div>
                      {order.serviceId?.name}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <User size={12} className="text-slate-500" />
                        {order.customerId?.userId?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <UserCheck size={12} className="text-slate-500" />
                        {order.technicianId?.userId?.name || 'Unassigned'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Calendar size={12} className="text-slate-500" />
                        {new Date(order.scheduledDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                        order.status === 'Completed'
                          ? 'bg-brand-light text-brand border-brand/20'
                          : order.status === 'Assigned'
                          ? 'bg-sky-950/30 text-sky-400 border-sky-500/20'
                          : 'bg-amber-950/30 text-amber-500 border-amber-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right font-black text-slate-200">
                      LKR {order.billing?.totalCost || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* INCOMING SERVICE REQUESTS TAB */}
      {activeTab === 'requests' && (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60 overflow-hidden relative z-10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/20 border-b border-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Requested Service</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Problem Description</th>
                <th className="p-4 text-center">Priority</th>
                <th className="p-4 text-center">Preferred Date</th>
                <th className="p-4 pr-6 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-300">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-semibold">
                    No pending customer requests at this time.
                  </td>
                </tr>
              ) : (
                requests.map((reqItem) => (
                  <tr key={reqItem._id} className="hover:bg-slate-950/20 transition-colors duration-150">
                    <td className="p-4 pl-6 font-bold text-slate-200 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-indigo-950/30 text-indigo-450 flex items-center justify-center font-bold text-xs">
                        <ClipboardList size={14} />
                      </div>
                      {reqItem.serviceId?.name}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-200">{reqItem.customerId?.userId?.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{reqItem.address}</div>
                    </td>
                    <td className="p-4">
                      <p className="max-w-[200px] truncate text-slate-400" title={reqItem.problemDescription}>
                        {reqItem.problemDescription || 'No details provided'}
                      </p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                        reqItem.priority === 'high' 
                          ? 'bg-red-950/30 text-red-400 border-red-500/20' 
                          : 'bg-slate-950/30 text-slate-400 border-slate-500/20'
                      }`}>
                        {reqItem.priority}
                      </span>
                    </td>
                    <td className="p-4 text-center font-semibold text-slate-400">
                      {reqItem.preferredDate ? new Date(reqItem.preferredDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <button
                        onClick={() => handleOpenDispatchModal(reqItem)}
                        className="bg-brand hover:bg-brand-hover text-white py-1.5 px-3 rounded-lg text-[10px] font-bold shadow-md transition-all flex items-center gap-1 mx-auto"
                      >
                        <UserPlus size={12} /> Assign & Dispatch
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* DISPATCH WORK ORDER GLASS MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-800/60 overflow-hidden text-slate-200">
            <div className="p-5 border-b border-slate-800/60 flex items-center gap-2 text-brand">
              <Send size={20} />
              <h3 className="font-bold text-white">Dispatch Service Request</h3>
            </div>

            <form onSubmit={handleDispatch} className="p-5 space-y-4">
              {feedback && (
                <div className={`p-4 rounded-2xl text-xs border flex items-center gap-2 ${
                  feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
                }`}>
                  {feedback.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {feedback.message}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Requested Service
                </label>
                <div className="text-sm font-bold text-white">{selectedRequest?.serviceId?.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">For {selectedRequest?.customerId?.userId?.name}</div>
              </div>

              {selectedRequest?.interestedTechnicians && selectedRequest.interestedTechnicians.length > 0 && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
                  <p className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider">Interested Applicants ({selectedRequest.interestedTechnicians.length})</p>
                  <div className="space-y-2 mt-1.5">
                    {selectedRequest.interestedTechnicians.map(tech => {
                      const fullTech = technicians.find(t => t._id === tech._id);
                      const rating = fullTech?.ratings?.average || 5.0;
                      return (
                        <div 
                          key={tech._id} 
                          onClick={() => setSelectedTechId(tech._id)}
                          className={`flex justify-between items-center p-2.5 rounded-xl border cursor-pointer transition-all ${
                            selectedTechId === tech._id
                              ? 'bg-brand/20 border-brand/80 shadow-md'
                              : 'bg-slate-950/40 border-slate-800 hover:bg-slate-950/80'
                          }`}
                        >
                          <div className="font-bold text-white text-[11px]">{tech.userId?.name || 'Technician'}</div>
                          <div className="flex items-center gap-1 font-bold text-slate-350">
                            <span>⭐ {rating}</span>
                            <span className="text-[9px] text-slate-500 font-medium">({fullTech?.ratings?.count || 0} reviews)</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Select Available Skilled Technician
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {getFilteredTechs().length === 0 ? (
                    <option value="" className="bg-slate-900 text-slate-400 text-xs">No active techs match this skill ({selectedRequest?.serviceId?.name})</option>
                  ) : (
                    getFilteredTechs().map(tech => (
                      <option 
                        key={tech._id} 
                        value={tech._id} 
                        className="bg-slate-900 text-white text-xs"
                        disabled={tech.availabilityStatus !== 'available'}
                      >
                        {tech.userId?.name} ({tech.skills.join(', ')}) - {tech.availabilityStatus}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[9px] text-slate-500 mt-1 font-semibold">Only showing technicians whose skills match this service.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Scheduled Execution Date
                </label>
                <input
                  type="date"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Problem Description & Dispatch Notes
                </label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                  placeholder="Additional notes for technician..."
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-800/60 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading || getFilteredTechs().length === 0}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitLoading ? 'Dispatching...' : 'Dispatch Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
