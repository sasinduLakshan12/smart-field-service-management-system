import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Page Components
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CompanyAdminDashboard from './pages/CompanyAdminDashboard';
import DispatcherDashboard from './pages/DispatcherDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import BookService from './pages/BookService';

// Fallback Route Redirector depending on Role
function RoleRedirector() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'super_admin':
      return <Navigate to="/super-admin/dashboard" replace />;
    case 'company_admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'dispatcher':
      return <Navigate to="/dispatcher/dashboard" replace />;
    case 'technician':
      return <Navigate to="/technician/dashboard" replace />;
    case 'customer':
      return <Navigate to="/customer/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Router>
      <Routes>
        {/* Public auth portal */}
        <Route path="/login" element={<Login />} />

        {/* Dashboard layouts wrapper */}
        <Route element={<DashboardLayout />}>
          
          {/* Super Admin Dashboard routes */}
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/companies"
            element={
              <ProtectedRoute allowedRoles={['super_admin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Company Admin Dashboard routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['company_admin']}>
                <CompanyAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/technicians"
            element={
              <ProtectedRoute allowedRoles={['company_admin']}>
                <CompanyAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute allowedRoles={['company_admin']}>
                <CompanyAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/work-orders"
            element={
              <ProtectedRoute allowedRoles={['company_admin']}>
                <CompanyAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Dispatcher Dashboard routes */}
          <Route
            path="/dispatcher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['dispatcher']}>
                <DispatcherDashboard />
              </ProtectedRoute>
            }
          />

          {/* Technician Dashboard routes */}
          <Route
            path="/technician/dashboard"
            element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianDashboard />
              </ProtectedRoute>
            }
          />

          {/* Customer Dashboard routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customer/request"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookService />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Root Redirector */}
        <Route path="/" element={<RoleRedirector />} />
        
        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
