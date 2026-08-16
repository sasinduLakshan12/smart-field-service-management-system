import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Briefcase, PlusCircle, CheckCircle, ShieldAlert, Clock, Trash2, Edit2 } from 'lucide-react';

export default function CompanyAdminServices() {
  const { accessToken } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const fetchServices = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/services', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setServices(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [accessToken]);

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('');
    setFeedback(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (service) => {
    setIsEditMode(true);
    setEditingId(service._id);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price);
    setDuration(service.duration || 60);
    setFeedback(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFeedback(null);

    try {
      if (isEditMode) {
        // Edit Mode: PUT /api/v1/services/:id
        const res = await axios.put(`http://localhost:5000/api/v1/services/${editingId}`, {
          name,
          description,
          price: Number(price),
          duration: Number(duration)
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.data.success) {
          setFeedback({ success: true, message: 'Service catalog item updated successfully!' });
          setShowModal(false);
          fetchServices();
        }
      } else {
        // Add Mode: POST /api/v1/services
        const res = await axios.post('http://localhost:5000/api/v1/services', {
          name,
          description,
          price: Number(price),
          duration: Number(duration) || 60
        }, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.data.success) {
          setFeedback({ success: true, message: 'Service catalog item added successfully!' });
          setName('');
          setDescription('');
          setPrice('');
          setDuration('');
          setShowModal(false);
          fetchServices();
        }
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Action failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to remove this service from the catalog?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/v1/services/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setFeedback({ success: true, message: 'Service deleted successfully!' });
        fetchServices();
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Failed to delete service catalog item' });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900/40 backdrop-blur-md rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-900/40 backdrop-blur-md rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative text-slate-300">
      {/* Decorative Blur Blobs */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Services Catalogue</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Manage Service Items</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-brand hover:bg-brand-hover text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-[0_8px_16px_rgba(0,168,150,0.3)] hover:shadow-lg transition-all flex items-center gap-1.5"
        >
          <PlusCircle size={16} /> Add Service Item
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs border backdrop-blur-md flex items-center gap-2 ${
          feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
        }`}>
          {feedback.success ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Services Grid (Dark Glassmorphism layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {services.length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 font-semibold bg-slate-900/20 rounded-3xl border border-slate-800/40">
            No service catalog items available. Click "Add Service Item" to get started.
          </div>
        ) : (
          services.map((service) => (
            <div key={service._id} className="bg-slate-900/40 backdrop-blur-md p-5 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-sm">{service.name}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(service)}
                      title="Edit service details"
                      className="h-7 w-7 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:bg-brand/20 text-slate-400 hover:text-brand flex items-center justify-center transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service._id)}
                      title="Delete service"
                      className="h-7 w-7 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:bg-red-950/30 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="h-7 w-7 rounded-lg bg-brand-light text-brand flex items-center justify-center border border-brand/20">
                      <Briefcase size={14} />
                    </span>
                  </div>
                </div>
                <p className="text-slate-400 text-xs line-clamp-3 font-semibold leading-relaxed">
                  {service.description || 'No description provided.'}
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800/40 text-[11px] text-slate-500 font-bold">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-500" />
                  <span className="text-slate-400">{service.duration} mins</span>
                </div>
                <div className="text-brand text-xs font-black">
                  LKR {service.price}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-800/60 overflow-hidden text-slate-200">
            <div className="p-5 border-b border-slate-800/60 flex items-center gap-2 text-brand">
              <Briefcase size={20} />
              <h3 className="font-bold text-white">{isEditMode ? 'Edit Service Item' : 'Add New Service Item'}</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Service Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="e.g. Standard Aircon Repair"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows="3"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="What is included in this service..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Price (LKR)
                  </label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="e.g. 3500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Est. Duration (Mins)
                  </label>
                  <input
                    type="number"
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="e.g. 60"
                  />
                </div>
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
                  disabled={submitLoading}
                  className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  {submitLoading ? 'Processing...' : isEditMode ? 'Save Changes' : 'Create Service Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
