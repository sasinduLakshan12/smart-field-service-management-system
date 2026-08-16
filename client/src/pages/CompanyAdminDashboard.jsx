import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClipboardList, Shield, Wallet, Hammer, Star, Calendar } from 'lucide-react';

export default function CompanyAdminDashboard() {
  const { accessToken, user } = useAuthStore();
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
        <div className="h-32 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-72 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-3xl"></div>
          </div>
          <div className="space-y-4">
            <div className="h-20 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl"></div>
            <div className="h-20 bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/20 backdrop-blur-md border border-red-900/30 text-red-400 px-6 py-4 rounded-2xl text-sm">
        <span className="font-bold">Error:</span> {error}
      </div>
    );
  }

  const { metrics, technicianPerformance, popularServices } = data || {};

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative text-slate-200">
      {/* Decorative Blur Blobs */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* LEFT COLUMN: Welcome Banner & Glass Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Frosted Welcome Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#00a896]/90 to-teal-500/60 backdrop-blur-md rounded-3xl p-7 text-white shadow-[0_8px_32px_0_rgba(0,168,150,0.15)] border border-white/10">
            <div className="relative z-10 space-y-2.5">
              <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 backdrop-blur-md text-white border border-white/10 uppercase tracking-wider">
                Live Console
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight">Good Day, {user?.name}!</h2>
              <p className="text-slate-100 text-xs font-semibold max-w-md leading-relaxed">
                FieldFlow active tracking console is operational. You have {metrics?.totalRequests || 0} active service assignments today.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10 translate-x-6 translate-y-6 pointer-events-none">
              <Calendar size={200} />
            </div>
          </div>

          {/* Frosted Glass Popular Services Demand Chart */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60">
            <div className="mb-6">
              <h3 className="text-sm font-bold text-white">Popular Services Demand</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Quantity of service orders by catalog item</p>
            </div>
            
            {popularServices?.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-slate-500 text-xs font-semibold">
                No service booking data available
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={popularServices} barSize={26}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255, 255, 255, 0.04)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.85)', 
                        backdropFilter: 'blur(8px)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="count" fill="#00a896" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Glass Metrics Stack & Leaderboard */}
        <div className="space-y-6">
          {/* Frosted Glass Metrics Stack */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60 p-6 space-y-5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Performance Indicators</h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/20 border border-slate-900/40 hover:bg-slate-950/40 transition-colors duration-200">
                <div className="h-9 w-9 rounded-xl bg-brand-light text-brand flex items-center justify-center border border-brand/20">
                  <ClipboardList size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Requests</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{metrics?.totalRequests || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/20 border border-slate-900/40 hover:bg-slate-950/40 transition-colors duration-200">
                <div className="h-9 w-9 rounded-xl bg-teal-950/30 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed Jobs</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{metrics?.completedJobs || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/20 border border-slate-900/40 hover:bg-slate-950/40 transition-colors duration-200">
                <div className="h-9 w-9 rounded-xl bg-indigo-950/30 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenue Ledger</p>
                  <p className="text-base font-extrabold text-white mt-0.5">LKR {metrics?.totalRevenue || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-950/20 border border-slate-900/40 hover:bg-slate-950/40 transition-colors duration-200">
                <div className="h-9 w-9 rounded-xl bg-amber-950/30 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <Hammer size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Avg Repair Time</p>
                  <p className="text-base font-extrabold text-white mt-0.5">{metrics?.averageCompletionTime || 0} mins</p>
                </div>
              </div>
            </div>
          </div>

          {/* Frosted Glass Leaderboard List */}
          <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] border border-slate-800/60">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Technician Performance</h3>
            <div className="space-y-3">
              {technicianPerformance?.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs font-semibold">No technician logs</div>
              ) : (
                technicianPerformance?.map((tech) => (
                  <div key={tech.technicianId} className="flex justify-between items-center p-3 rounded-2xl bg-slate-950/20 border border-slate-900/40 hover:bg-slate-950/40 transition-colors duration-200">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-slate-800/60 flex items-center justify-center text-slate-400 font-bold text-xs">
                        {tech.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-200">{tech.name}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border mt-0.5 bg-brand-light text-brand border-brand/20`}>
                          {tech.availability}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-1 text-slate-300 font-bold text-xs">
                      <Star size={14} className="fill-amber-400 text-amber-400" />
                      {tech.rating}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
