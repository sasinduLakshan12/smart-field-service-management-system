import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ClipboardList, Users, Check, AlertCircle } from 'lucide-react';

export default function DispatcherDashboard() {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchData = async () => {
    try {
      const [reqRes, techRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/service-requests', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }),
        axios.get('http://localhost:5000/api/v1/technicians', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      ]);

      if (reqRes.data.success) setRequests(reqRes.data.data);
      if (techRes.data.success) setTechnicians(techRes.data.data);
    } catch (err) {
      console.error('Failed to load dispatcher lists', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFeedback(null);

    try {
      const response = await axios.post('http://localhost:5000/api/v1/work-orders', {
        requestId: selectedRequest._id,
        technicianId: selectedTechId,
        scheduledDate,
        notes: assignmentNotes
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (response.data.success) {
        setFeedback({ success: true, message: 'Technician assigned successfully!' });
        setSelectedRequest(null);
        setSelectedTechId('');
        setScheduledDate('');
        setAssignmentNotes('');
        fetchData(); // Reload listings
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Assignment failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
        <div className="h-64 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  // Filter requests that are Pending or Reviewed (unassigned)
  const unassignedRequests = requests.filter(r => ['Pending', 'Reviewed'].includes(r.status));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Dispatcher Desk</h1>
        <p className="text-slate-500 mt-1">Review requests, check matching skills, and schedule technicians</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-sm border flex items-center gap-2 ${
          feedback.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {feedback.success ? <Check size={18} /> : <AlertCircle size={18} />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Unassigned Requests List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ClipboardList size={18} className="text-slate-400" />
              Pending Service Requests ({unassignedRequests.length})
            </h3>

            {unassignedRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                No unassigned requests. All caught up!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {unassignedRequests.map((req) => (
                  <div key={req._id} className="py-4 flex justify-between items-start gap-4 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700">{req.serviceId.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          req.priority === 'emergency' || req.priority === 'high'
                            ? 'bg-red-50 text-red-600 border-red-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {req.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{req.problemDescription}</p>
                      <div className="text-[11px] text-slate-400">
                        Requested by: {req.customerId?.userId?.name} | {req.address.street}, {req.address.city}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                    >
                      Assign Job
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Technician Status List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 h-fit">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-slate-400" />
            Technician Availability ({technicians.length})
          </h3>

          <div className="space-y-4">
            {technicians.map((tech) => (
              <div key={tech._id} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{tech.userId?.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Skills: {tech.skills.join(', ')}</p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  tech.availabilityStatus === 'available'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {tech.availabilityStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Modal Form */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Assign Technician</h3>
              <p className="text-xs text-slate-400 mt-0.5">For: {selectedRequest.serviceId.name}</p>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Technician
                </label>
                <select
                  required
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white"
                >
                  <option value="">-- Choose available technician --</option>
                  {technicians
                    .filter(t => t.availabilityStatus === 'available')
                    .map(t => (
                      <option key={t._id} value={t._id}>
                        {t.userId.name} (Skills: {t.skills.join(', ')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assignment Notes
                </label>
                <textarea
                  rows="3"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400"
                  placeholder="Instructions for the technician..."
                ></textarea>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                >
                  {submitLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
