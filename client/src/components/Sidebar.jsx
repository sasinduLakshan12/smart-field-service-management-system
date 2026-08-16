import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard,
  Users,
  Settings,
  Briefcase,
  FileText,
  Map,
  MessageSquare,
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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Briefcase className="text-sky-400" />
          FieldFlow
        </h1>
        <p className="text-xs text-slate-500 mt-1 capitalize">{user?.role?.replace('_', ' ')} Portal</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/10'
                    : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors duration-150"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
