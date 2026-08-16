import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ClipboardList, CheckCircle, Navigation, MapPin, Play, Check } from 'lucide-react';

export default function TechnicianDashboard() {
  const { accessToken } = useAuthStore();
  const [workOrders, setWorkOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Completion Form State
  const [laborCost, setLaborCost] = useState('');
  const [workNotes, setWorkNotes] = useState('');
  const [parts, setParts] = useState([{ name: '', quantity: 1, price: 0 }]);

  const fetchWorkOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/work-orders', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.data.success) {
        setWorkOrders(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load technician work orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkOrders();
  }, [accessToken]);

  const handleStatusUpdate = async (orderId, newStatus, payload = {}) => {
    setActionLoading(true);
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/v1/work-orders/${orderId}/status`,
        { status: newStatus, ...payload },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (response.data.success) {
        setSelectedOrder(null);
        fetchWorkOrders();
      }
    } catch (err) {
      console.error('Status update failed', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddPart = () => {
    setParts([...parts, { name: '', quantity: 1, price: 0 }]);
  };

  const handlePartChange = (index, field, value) => {
    const updated = [...parts];
    updated[index][field] = value;
    setParts(updated);
  };

  const handleCompleteSubmit = (e) => {
    e.preventDefault();
    // Validate parts
    const filteredParts = parts.filter(p => p.name.trim() !== '');
    handleStatusUpdate(selectedOrder._id, 'Completed', {
      notes: workNotes,
      laborCost: Number(laborCost) || 0,
      parts: filteredParts
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded"></div>
        <div className="h-32 bg-slate-200 rounded-xl"></div>
        <div className="h-32 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Technician Dashboard</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your active service assignments</p>
      </div>

      <div className="space-y-4">
        {workOrders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-8 text-center text-slate-400 text-sm">
            No jobs assigned to you currently.
          </div>
        ) : (
          workOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{order.serviceId.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Scheduled: {new Date(order.scheduledDate).toLocaleString()}</p>
                </div>
                <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-100 capitalize">
                  {order.status}
                </span>
              </div>

              <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-400 shrink-0" />
                  <span>{order.customerId?.userId?.name} | {order.customerId?.phone}</span>
                </div>
                <div className="pl-5 text-slate-500 font-medium">
                  {order.notes || 'No dispatch notes'}
                </div>
              </div>

              {/* Status Action Workflow Control */}
              <div className="pt-2">
                {order.status === 'Assigned' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(order._id, 'Accepted')}
                    className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={16} /> Accept Job
                  </button>
                )}

                {order.status === 'Accepted' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(order._id, 'Travelling')}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Navigation size={16} /> Start Travel
                  </button>
                )}

                {order.status === 'Travelling' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(order._id, 'Arrived')}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <MapPin size={16} /> Arrived at Location
                  </button>
                )}

                {order.status === 'Arrived' && (
                  <button
                    disabled={actionLoading}
                    onClick={() => handleStatusUpdate(order._id, 'In Progress')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Play size={16} /> Start Work
                  </button>
                )}

                {order.status === 'In Progress' && (
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={16} /> Complete Job
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Completion Dialog Form */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">Report Completion & Billing</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Job: {selectedOrder.serviceId.name}</p>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Labor Cost (LKR)
                </label>
                <input
                  type="number"
                  required
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                  placeholder="e.g. 1500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Job Resolution Notes
                </label>
                <textarea
                  rows="3"
                  required
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400"
                  placeholder="Explain what repair or work was completed..."
                ></textarea>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Parts Used
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPart}
                    className="text-[10px] text-sky-600 hover:text-sky-700 font-bold"
                  >
                    + Add Part
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
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={part.quantity}
                        onChange={(e) => handlePartChange(idx, 'quantity', Number(e.target.value))}
                        className="w-16 px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 text-center"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={part.price}
                        onChange={(e) => handlePartChange(idx, 'price', Number(e.target.value))}
                        className="w-20 px-2 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
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
