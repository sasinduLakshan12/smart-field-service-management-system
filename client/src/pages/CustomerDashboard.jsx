import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { ClipboardList, Clock, CheckCircle2, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CustomerDashboard() {
  const { accessToken } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:5000/api/v1/service-requests', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (res.data.success) {
          setRequests(res.data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load customer requests', err);
        setLoading(false);
      });
  }, [accessToken]);

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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">My Service Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track your pending repairs and service history</p>
        </div>
        <Link
          to="/customer/request"
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 rounded-lg text-xs shadow-sm hover:shadow transition-all"
        >
          Book New Service
        </Link>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 p-12 text-center text-slate-400 text-sm space-y-3">
            <ClipboardList size={36} className="mx-auto text-slate-300" />
            <p>You have not submitted any service requests yet.</p>
          </div>
        ) : (
          requests.map((req) => (
            <div key={req._id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{req.serviceId?.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Preferred Date: {new Date(req.preferredDate).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                  req.status === 'Completed' || req.status === 'Customer Confirmed'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : req.status === 'Cancelled'
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  {req.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1.5">
                <div><span className="font-bold text-slate-500">Problem Description:</span> {req.problemDescription}</div>
                <div><span className="font-bold text-slate-500">Address:</span> {req.address.street}, {req.address.city}</div>
                {req.additionalNotes && (
                  <div><span className="font-bold text-slate-500">Notes:</span> {req.additionalNotes}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
