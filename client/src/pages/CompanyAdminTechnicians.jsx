import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  Users, 
  PlusCircle, 
  Mail, 
  Briefcase, 
  CheckCircle, 
  Star, 
  ShieldAlert, 
  Trash2, 
  Power, 
  FileText, 
  ExternalLink,
  ClipboardList,
  Check,
  X
} from 'lucide-react';

export default function CompanyAdminTechnicians() {
  const { accessToken } = useAuthStore();
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' or 'applications'
  const [technicians, setTechnicians] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State for manual entry
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState('');

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

  const fetchApplications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/technicians/applications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setApplications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchTechnicians(), fetchApplications()]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFeedback(null);

    try {
      const res = await axios.post('http://localhost:5000/api/v1/auth/register', {
        name,
        email,
        password,
        role: 'technician'
      });

      if (res.data.success) {
        setFeedback({ success: true, message: 'Technician onboarded successfully!' });
        setName('');
        setEmail('');
        setPassword('');
        setSkills('');
        setShowModal(false);
        fetchTechnicians();
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Failed to add technician' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'offline' : 'available';
    try {
      const res = await axios.put(`http://localhost:5000/api/v1/technicians/${id}`, {
        availabilityStatus: nextStatus
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setFeedback({ success: true, message: 'Availability status updated!' });
        fetchTechnicians();
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Failed to update technician status' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this technician from the workforce?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/v1/technicians/${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setFeedback({ success: true, message: 'Technician removed successfully!' });
        fetchTechnicians();
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Failed to delete technician' });
    }
  };

  const handleReviewApplication = async (id, decision) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/v1/technicians/applications/${id}`, {
        status: decision
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        setFeedback({ 
          success: true, 
          message: `Application has been successfully ${decision === 'approved' ? 'approved' : 'rejected'}!` 
        });
        loadData();
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Failed to submit application review decision' });
    }
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Workforce Management</h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Technicians & Applications</p>
        </div>
        {activeTab === 'directory' && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand hover:bg-brand-hover text-white font-semibold py-2 px-4 rounded-xl text-xs shadow-[0_8px_16px_rgba(0,168,150,0.3)] hover:shadow-lg transition-all flex items-center gap-1.5"
          >
            <PlusCircle size={16} /> Add Technician
          </button>
        )}
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs border backdrop-blur-md flex items-center gap-2 ${
          feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
        }`}>
          {feedback.success ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-2 p-1 bg-slate-950/40 border border-slate-900/60 rounded-xl w-fit relative z-10">
        <button
          onClick={() => setActiveTab('directory')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'directory' 
              ? 'bg-brand text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Directory ({technicians.length})
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'applications' 
              ? 'bg-brand text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Join Requests ({applications.length})
        </button>
      </div>

      {/* DIRECTORY TAB VIEW */}
      {activeTab === 'directory' && (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60 overflow-hidden relative z-10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/20 border-b border-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Technician Name</th>
                <th className="p-4">Contact info</th>
                <th className="p-4">Skills / Expertise</th>
                <th className="p-4">Status</th>
                <th className="p-4">Rating</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-300">
              {technicians.map((tech) => (
                <tr key={tech._id} className="hover:bg-slate-950/20 transition-colors duration-150">
                  <td className="p-4 pl-6 font-bold text-slate-200 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-brand-light text-brand flex items-center justify-center font-bold text-xs">
                      {tech.userId?.name?.slice(0, 2).toUpperCase()}
                    </div>
                    {tech.userId?.name}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <Mail size={12} className="text-slate-500" />
                      {tech.userId?.email}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium capitalize">
                      <Briefcase size={12} className="text-slate-500" />
                      {tech.skills.join(', ')}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                      tech.availabilityStatus === 'available'
                        ? 'bg-brand-light text-brand border-brand/20'
                        : 'bg-amber-950/30 text-amber-500 border-amber-500/20'
                    }`}>
                      {tech.availabilityStatus}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-300">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      5.0 <span className="text-[10px] text-slate-500 font-normal">(0 reviews)</span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(tech._id, tech.availabilityStatus)}
                        title="Toggle availability"
                        className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:bg-brand/20 text-slate-400 hover:text-brand transition-colors"
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(tech._id)}
                        title="Remove technician"
                        className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:bg-red-950/30 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* APPLICATIONS TAB VIEW */}
      {activeTab === 'applications' && (
        <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60 overflow-hidden relative z-10">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/20 border-b border-slate-900/40 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 pl-6">Applicant Name</th>
                <th className="p-4">Contact info</th>
                <th className="p-4">Skills / Expertise</th>
                <th className="p-4 text-center">Experience</th>
                <th className="p-4 text-center">Resume CV</th>
                <th className="p-4 pr-6 text-center">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-300">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-500 font-semibold">
                    No pending registration requests.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-950/20 transition-colors duration-150">
                    <td className="p-4 pl-6 font-bold text-slate-200">
                      {app.name}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                        <Mail size={12} className="text-slate-500" />
                        {app.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-400 font-medium capitalize">
                        <Briefcase size={12} className="text-slate-500" />
                        {app.skills.join(', ')}
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-300">
                      {app.experienceYears} Years
                    </td>
                    <td className="p-4 text-center">
                      <a 
                        href={app.cvUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-brand hover:underline font-bold"
                      >
                        <FileText size={14} /> Open CV <ExternalLink size={10} />
                      </a>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => handleReviewApplication(app._id, 'approved')}
                          className="p-1.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white text-emerald-400 transition-all"
                          title="Approve & Register"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleReviewApplication(app._id, 'rejected')}
                          className="p-1.5 rounded-lg bg-red-950/30 border border-red-500/20 hover:bg-red-600 hover:text-white text-red-400 transition-all"
                          title="Reject Application"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Tech Glass Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-slate-900/90 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-800/60 overflow-hidden text-slate-200">
            <div className="p-5 border-b border-slate-800/60 flex items-center gap-2 text-brand">
              <Users size={20} />
              <h3 className="font-bold text-white">Add New Technician</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Form fields ... */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="e.g. Ruwan Silva"
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
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="e.g. ruwan@company.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Skills / Expertises (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  placeholder="e.g. Plumbing, AC Repair, Electrical"
                />
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
                  {submitLoading ? 'Registering...' : 'Register Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
