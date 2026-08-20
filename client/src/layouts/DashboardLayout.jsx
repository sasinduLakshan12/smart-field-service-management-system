import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { Sun, Moon, Menu } from 'lucide-react';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#0b0f19] overflow-hidden text-slate-200 transition-colors duration-200">
      {/* Sidebar Navigation (Now responsive with open state) */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-slate-950/40 backdrop-blur-md border-b border-slate-900/60 px-4 md:px-8 flex justify-between items-center shadow-xs z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu Toggle on mobile screens */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-400 border border-slate-800/60 transition-colors duration-200 md:hidden"
              aria-label="Open Sidebar"
            >
              <Menu size={18} />
            </button>
            
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest hidden sm:block">
              Smart Workforce Suite
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-400 border border-slate-800/60 transition-colors duration-200"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} />}
            </button>

            {/* Profile Info */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold text-white max-w-[120px] truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-brand-light flex items-center justify-center text-brand font-bold text-sm border border-brand/20">
                {user?.name?.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/90 transition-colors duration-200 relative">
          {/* Decorative light/neon blobs to enhance the glass look on the dark area */}
          <div className="absolute top-10 left-10 w-64 h-64 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-teal-400/5 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
