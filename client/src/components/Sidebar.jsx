import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  ClipboardList,
  PlusCircle,
  Building,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuthStore();

  const getLinks = () => {
    switch (user?.role) {
      case 'super_admin':
        return [
          { to: '/super-admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/super-admin/companies', label: 'Companies', icon: Building },
        ];
      case 'company_admin':
        return [
          { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/admin/technicians', label: 'Technicians', icon: Users },
          { to: '/admin/services', label: 'Services', icon: Briefcase },
          { to: '/admin/work-orders', label: 'Work Orders', icon: ClipboardList },
        ];
      case 'dispatcher':
        return [
          { to: '/dispatcher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/dispatcher/requests', label: 'Requests Intake', icon: ClipboardList },
        ];
      case 'technician':
        return [
          { to: '/technician/dashboard', label: 'My Tasks', icon: ClipboardList },
          { to: '/technician/profile', label: 'My Profile', icon: Users },
        ];
      case 'customer':
        return [
          { to: '/customer/dashboard', label: 'My Requests', icon: ClipboardList },
          { to: '/customer/request', label: 'Book Service', icon: PlusCircle },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-950/60 backdrop-blur-md text-slate-400 flex flex-col h-full border-r border-slate-900/60 transition-colors duration-200">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-900/60">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-black text-sm shadow-[0_0_12px_rgba(0,168,150,0.3)]">
            F
          </div>
          FieldFlow
        </h1>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">
          {user?.role?.replace('_', ' ')} Portal
        </p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 transform ${
                  isActive
                    ? 'bg-brand text-white shadow-[0_8px_20px_rgba(0,168,150,0.3)] scale-[1.02]'
                    : 'hover:bg-slate-900/40 hover:text-slate-100 text-slate-400'
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile Sign Out */}
      <div className="p-4 border-t border-slate-900/60">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors duration-200"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
