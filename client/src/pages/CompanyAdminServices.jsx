import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Briefcase, PlusCircle, CheckCircle, ShieldAlert, Clock, Trash2, Edit2, Search, Filter, UploadCloud, X } from 'lucide-react';

export default function CompanyAdminServices() {
  const { accessToken } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('All');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Custom image uploader state
  const [imageFile, setImageFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [requiredSkill, setRequiredSkill] = useState('AC Repair');

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
    setRequiredSkill('AC Repair');
    setImageFile(null);
    setFeedback(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (service) => {
    setIsEditMode(true);
    setEditingId(service._id);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price);
    setDuration(service.duration || service.estimatedDuration || 60);
    setRequiredSkill(service.requiredSkills?.[0] || 'AC Repair');
    setImageFile(null);
    setFeedback(null);
    setShowModal(true);
  };

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
      setImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
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
    setSubmitLoading(true);
    setFeedback(null);

    try {
      let imageData, imageName;
      if (imageFile) {
        imageData = await getBase64(imageFile);
        imageName = imageFile.name;
      }

      const payload = {
        name,
        description,
        price: Number(price),
        duration: Number(duration) || 60,
        requiredSkills: [requiredSkill],
        imageName,
        imageData
      };

      if (isEditMode) {
        const res = await axios.put(`http://localhost:5000/api/v1/services/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.data.success) {
          setFeedback({ success: true, message: 'Service catalog item updated successfully!' });
          setShowModal(false);
          fetchServices();
        }
      } else {
        const res = await axios.post('http://localhost:5000/api/v1/services', payload, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (res.data.success) {
          setFeedback({ success: true, message: 'Service catalog item added successfully!' });
          setName('');
          setDescription('');
          setPrice('');
          setDuration('');
          setRequiredSkill('AC Repair');
          setImageFile(null);
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

  const getFilteredServices = () => {
    return services.filter(service => {
      const matchesSearch = 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSkill = 
        skillFilter === 'All' ||
        service.requiredSkills?.some(skill => skill.toLowerCase() === skillFilter.toLowerCase());

      return matchesSearch && matchesSkill;
    });
  };

  const skillOptions = ['All', 'AC Repair', 'Plumbing', 'Electrical', 'Generator Repair', 'Appliance Repair'];

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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Services Catalogue</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Manage Service Items</p>
        </div>
        
        {/* Search & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 md:flex-initial">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search service..."
              className="w-full md:w-52 pl-9 pr-4 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          {/* Filter dropdown */}
          <div className="relative flex items-center gap-1.5 bg-slate-950/40 border border-slate-800/60 rounded-xl px-2.5 py-1">
            <Filter size={12} className="text-slate-500" />
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="bg-transparent border-none text-xs text-slate-300 focus:outline-none py-1 cursor-pointer"
            >
              {skillOptions.map(skill => (
                <option key={skill} value={skill} className="bg-slate-900 text-white text-xs">{skill}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="bg-brand hover:bg-brand-hover text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-[0_8px_16px_rgba(0,168,150,0.3)] hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <PlusCircle size={16} /> Add Service Item
          </button>
        </div>
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
        {getFilteredServices().length === 0 ? (
          <div className="col-span-3 text-center py-12 text-slate-500 font-semibold bg-slate-900/20 rounded-3xl border border-slate-800/40">
            No service catalog items match the criteria.
          </div>
        ) : (
          getFilteredServices().map((service) => (
            <div key={service._id} className="bg-slate-900/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60 flex flex-col justify-between hover:scale-[1.01] transition-transform duration-150 group">
              {/* Header Image */}
              <div className="h-32 w-full overflow-hidden relative">
                <img 
                  src={service.imageUrl || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80'} 
                  alt={service.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
                  <button
                    onClick={() => handleOpenEditModal(service)}
                    title="Edit service details"
                    className="h-7 w-7 rounded-lg bg-slate-950/80 border border-slate-800/60 hover:bg-brand/20 text-slate-400 hover:text-brand flex items-center justify-center transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteService(service._id)}
                    title="Delete service"
                    className="h-7 w-7 rounded-lg bg-slate-950/80 border border-slate-800/60 hover:bg-red-950/30 text-slate-400 hover:text-red-400 flex items-center justify-center transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="font-bold text-white text-sm">{service.name}</h3>
                  <p className="text-slate-400 text-xs line-clamp-2 font-semibold leading-relaxed">
                    {service.description || 'No description provided.'}
                  </p>
                  <div className="pt-1 flex gap-1">
                    {service.requiredSkills?.map(skill => (
                      <span key={skill} className="px-2 py-0.5 rounded-md bg-brand-light text-brand text-[9px] font-bold border border-brand/10 capitalize">
                        {skill} Required
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-slate-850 text-[11px] text-slate-500 font-bold">
                  <div className="flex items-center gap-1">
                    <Clock size={14} className="text-slate-500" />
                    <span className="text-slate-400">{service.estimatedDuration || service.duration || 60} mins</span>
                  </div>
                  <div className="text-brand text-xs font-black">
                    LKR {service.price}
                  </div>
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

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
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
                  rows="2"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="What is included in this service..."
                ></textarea>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
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

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Duration (Mins)
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

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Required Skill
                  </label>
                  <select
                    value={requiredSkill}
                    onChange={(e) => setRequiredSkill(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  >
                    {skillOptions.slice(1).map(skill => (
                      <option key={skill} value={skill} className="bg-slate-900 text-white text-[11px]">{skill}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Drag & Drop Cover Image Uploader */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Service Cover Image (Optional)
                </label>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-xl p-4 text-center transition-all relative ${
                    dragActive 
                      ? 'border-brand bg-brand/10' 
                      : 'border-slate-800 bg-slate-950/40 hover:border-slate-750'
                  }`}
                >
                  <input
                    id="service-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imageFile ? (
                    <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-lg text-[10px]">
                      <span className="font-bold truncate max-w-[200px] text-white">{imageFile.name}</span>
                      <button 
                        type="button" 
                        onClick={() => setImageFile(null)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <label 
                      htmlFor="service-image-input" 
                      className="flex flex-col items-center justify-center cursor-pointer space-y-1"
                    >
                      <UploadCloud size={20} className="text-slate-500" />
                      <p className="text-[10px] font-bold text-white">Drag & drop or <span className="text-brand hover:underline">browse</span> cover photo</p>
                    </label>
                  )}
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
