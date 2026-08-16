import React, { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import axios from 'axios';

function App() {
  const { user, accessToken, logout, checkAuth } = useAuthStore();
  const [companyInfo, setCompanyInfo] = useState(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user && user.companyId) {
      axios.get(`http://localhost:5000/api/v1/companies/${user.companyId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
        .then(res => {
          if (res.data.success && res.data.data) {
            setCompanyInfo(res.data.data);
          }
        })
        .catch(err => {
          console.error("Failed to load tenant company information", err);
        });
    } else {
      setCompanyInfo(null);
    }
  }, [user, accessToken]);

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md overflow-hidden p-8 border border-slate-100">
        <div className="text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
            Authenticated Session ✅
          </span>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
            Welcome, {user.name}
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Role: <span className="font-semibold text-slate-700 capitalize">{user.role}</span>
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-100 text-left text-xs space-y-2">
            <div><span className="font-bold text-slate-600">User ID:</span> {user.id}</div>
            <div><span className="font-bold text-slate-600">Email:</span> {user.email}</div>
            <div><span className="font-bold text-slate-600">Tenant:</span> {companyInfo ? `${companyInfo.name} (${companyInfo.subscriptionStatus} plan)` : 'Platform Level (No Tenant)'}</div>
            {companyInfo && (
              <>
                <div><span className="font-bold text-slate-600">Company Contact:</span> {companyInfo.email} | {companyInfo.phone || 'N/A'}</div>
                <div><span className="font-bold text-slate-600">Local Currency:</span> {companyInfo.settings?.currency || 'LKR'}</div>
              </>
            )}
          </div>

          <button
            onClick={logout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2.5 px-4 rounded-lg transition-colors border border-red-200"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
