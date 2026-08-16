import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, accessToken, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600"></div>
          <p className="text-slate-500 mt-4 text-sm font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Check if role is authorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 border border-slate-100 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 mb-4 border border-red-100">
            Access Denied
          </span>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Unauthorized Access</h2>
          <p className="text-slate-500 text-sm mb-6">
            You do not have the required permissions to view this dashboard page.
          </p>
          <Navigate to="/" replace />
        </div>
      </div>
    );
  }

  return children;
}
