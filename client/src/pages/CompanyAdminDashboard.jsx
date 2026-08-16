import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Shield, Hammer, ClipboardList, Wallet, UserCheck, Star } from 'lucide-react';

export default function CompanyAdminDashboard() {
  const { accessToken } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/v1/analytics/dashboard', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (res.data.success) {
          setData(res.data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load analytics dashboard');
        setLoading(false);
      });
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm">
        <span className="font-bold">Error:</span> {error}
      </div>
    );
  }

  const { metrics, requestStatusDistribution, technicianPerformance, popularServices } = data || {};

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Admin Overview</h1>
        <p className="text-slate-500 mt-1">Real-time metrics, revenue ledger and job allocation metrics</p>
      </div>

      {/* Analytic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="h-12 w-12 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Requests</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{metrics?.totalRequests || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="h-12 w-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed Jobs</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{metrics?.completedJobs || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <Wallet size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Revenue (LKR)</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{metrics?.totalRevenue || 0}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="h-12 w-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Hammer size={22} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Time (mins)</p>
            <p className="text-2xl font-bold text-slate-800 mt-0.5">{metrics?.averageCompletionTime || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Popular Services Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Popular Services Demand</h3>
          {popularServices?.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
              No service booking data available
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popularServices}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Technician Rankings */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Technician Leaderboard</h3>
          <div className="space-y-4">
            {technicianPerformance?.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">No technician logs</div>
            ) : (
              technicianPerformance?.map((tech) => (
                <div key={tech.technicianId} className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
                      {tech.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{tech.name}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border mt-0.5 ${
                        tech.availability === 'available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {tech.availability}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                    <Star size={16} className="fill-amber-400 text-amber-400" />
                    {tech.rating}
                    <span className="text-[10px] text-slate-400 font-medium">({tech.totalReviews})</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
