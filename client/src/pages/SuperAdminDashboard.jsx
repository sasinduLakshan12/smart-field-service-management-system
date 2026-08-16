import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Building, PlusCircle, Check, AlertCircle, Mail, Phone, MapPin } from 'lucide-react';

export default function SuperAdminDashboard() {
  const { accessToken } = useAuthStore();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const fetchCompanies = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/v1/companies', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.data.success) {
        setCompanies(response.data.data);
      }
    } catch (err) {
      console.error('Failed to load companies list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFeedback(null);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/companies', {
        name,
        email,
        phone,
        address
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.data.success) {
        setFeedback({ success: true, message: 'Company tenant onboarded successfully!' });
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
        setShowModal(false);
        fetchCompanies();
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Onboarding failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded"></div>
        <div className="h-48 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Super Admin Panel</h1>
          <p className="text-xs text-slate-500 mt-0.5">Oversee companies, onboarding, and subscription plans</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg text-xs shadow-sm hover:shadow transition-all flex items-center gap-1.5"
        >
          <PlusCircle size={16} /> Onboard Company
        </button>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs border flex items-center gap-2 ${
          feedback.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedback.success ? <Check size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      {/* Companies Directory Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
              <th className="p-4 pl-6">Company Name</th>
              <th className="p-4">Contact Info</th>
              <th className="p-4">Address</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6">Registered On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {companies.map((company) => (
              <tr key={company._id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 pl-6 font-semibold text-slate-800 flex items-center gap-2">
                  <Building size={16} className="text-slate-400" />
                  {company.name}
                </td>
                <td className="p-4 space-y-0.5">
                  <div className="flex items-center gap-1"><Mail size={12} className="text-slate-400" /> {company.email}</div>
                  <div className="flex items-center gap-1"><Phone size={12} className="text-slate-400" /> {company.phone || 'N/A'}</div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {company.address || 'N/A'}</div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full font-bold border capitalize ${
                    company.subscriptionStatus === 'active'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {company.subscriptionStatus}
                  </span>
                </td>
                <td className="p-4 pr-6 text-slate-400">
                  {new Date(company.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Onboarding Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <Building size={20} className="text-sky-600" />
              <h3 className="font-bold text-slate-800">Onboard New Company</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                  placeholder="e.g. Acme Services"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Company Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                  placeholder="e.g. billing@acme.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                  placeholder="e.g. 0771234567"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Office Address
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
                  placeholder="e.g. Colombo, Sri Lanka"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                >
                  {submitLoading ? 'Registering...' : 'Onboard Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
