import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Check, AlertCircle } from 'lucide-react';

export default function BookService() {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Form State
  const [serviceId, setServiceId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [preferredDate, setPreferredDate] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5000/api/v1/services', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (res.data.success) {
          setServices(res.data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load services catalogue', err);
        setLoading(false);
      });
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFeedback(null);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/service-requests', {
        serviceId,
        problemDescription,
        priority,
        preferredDate,
        address: { street, city, coordinates: { lat: 6.9, lng: 79.9 } }, // default coordinates
        additionalNotes
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.data.success) {
        setFeedback({ success: true, message: 'Request submitted successfully!' });
        setTimeout(() => navigate('/customer/dashboard'), 1500);
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Failed to submit booking' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-40 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
          <ClipboardCheck size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-800">Book a Service</h2>
          <p className="text-xs text-slate-400">Request service scheduling for your location</p>
        </div>
      </div>

      {feedback && (
        <div className={`mx-6 mt-6 p-4 rounded-xl text-xs border flex items-center gap-2 ${
          feedback.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedback.success ? <Check size={16} /> : <AlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Select Service Type
          </label>
          <select
            required
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
          >
            <option value="">-- Select a Service --</option>
            {services.map(s => (
              <option key={s._id} value={s._id}>
                {s.name} (LKR {s.price})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Problem Description
          </label>
          <textarea
            required
            rows="3"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400"
            placeholder="Describe the issue you are experiencing..."
          ></textarea>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Preferred Date
            </label>
            <input
              type="date"
              required
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Street Address
            </label>
            <input
              type="text"
              required
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
              placeholder="e.g. 12, Galle Rd"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              City
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800"
              placeholder="e.g. Colombo"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Additional Notes (Optional)
          </label>
          <textarea
            rows="2"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400"
            placeholder="Special instructions, gate codes etc..."
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={submitLoading}
          className="w-full mt-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-sm hover:shadow transition-all disabled:opacity-50"
        >
          {submitLoading ? 'Submitting Request...' : 'Confirm Request Booking'}
        </button>
      </form>
    </div>
  );
}
