import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Page Components
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CompanyAdminDashboard from './pages/CompanyAdminDashboard';
import CompanyAdminTechnicians from './pages/CompanyAdminTechnicians';
import CompanyAdminServices from './pages/CompanyAdminServices';
import CompanyAdminWorkOrders from './pages/CompanyAdminWorkOrders';
import DispatcherDashboard from './pages/DispatcherDashboard';
import TechnicianDashboard from './pages/TechnicianDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import BookService from './pages/BookService';

import Home from './pages/Home';
import ApplyTechnician from './pages/ApplyTechnician';
import TechnicianProfile from './pages/TechnicianProfile';

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
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
    checkAuth();
  }, [checkAuth, initTheme]);

  return (
    <Router>
      <Routes>
        {/* Public Landing page */}
        <Route path="/" element={<Home />} />

        {/* Public auth portal */}
        <Route path="/login" element={<Login />} />

        {/* Public apply portal */}
        <Route path="/apply" element={<ApplyTechnician />} />

        {/* Dashboard Redirector */}
        <Route path="/dashboard" element={<RoleRedirector />} />

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
                <CompanyAdminTechnicians />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute allowedRoles={['company_admin']}>
                <CompanyAdminServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/work-orders"
            element={
              <ProtectedRoute allowedRoles={['company_admin']}>
                <CompanyAdminWorkOrders />
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
          <Route
            path="/technician/profile"
            element={
              <ProtectedRoute allowedRoles={['technician']}>
                <TechnicianProfile />
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
        
        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
