import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Briefcase, Shield, Clock, ArrowRight } from 'lucide-react';

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative text-slate-200 transition-colors duration-200 overflow-x-hidden"
      style={{ backgroundImage: "url('/landing_bg.jpg')" }}
    >
      {/* Dark semi-transparent frosted glass mask overlay */}
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs z-0"></div>

      <div className="min-h-screen flex flex-col justify-between relative z-10">
        
        {/* Header / Navbar */}
        <header className="max-w-6xl w-full mx-auto px-6 h-20 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand flex items-center justify-center text-white font-black text-sm shadow-[0_0_12px_rgba(0,168,150,0.4)]">
              F
            </div>
            FieldFlow
          </h1>
          
          <div className="flex items-center gap-4">
            <Link
              to="/apply"
              className="text-slate-300 hover:text-white text-xs font-bold transition-all"
            >
              Apply as Tech
            </Link>
            {user ? (
              <Link
                to="/dashboard"
                className="bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all flex items-center gap-1.5"
              >
                Go to Console <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to="/login"
                className="bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-[0_4px_12px_rgba(0,168,150,0.3)] transition-all"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-4xl w-full mx-auto px-6 pt-10 pb-20 text-center space-y-10">
          <div className="space-y-5 max-w-3xl mx-auto">
            <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-brand-light text-brand border border-brand/20 uppercase tracking-widest backdrop-blur-md">
              Next-Gen Workforce Hub
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Smart Field Service <br />
              <span className="text-brand">Management Platform</span>
            </h2>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed max-w-xl mx-auto font-semibold">
              Optimize your mobile workforce, assign jobs instantly with skill-matching algorithms, track technicians live on maps, and automate billing on task resolution.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_8px_20px_rgba(0,168,150,0.4)] transition-all flex items-center gap-2 text-xs"
              >
                Access Console Dashboard <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-8 rounded-2xl shadow-[0_8px_20px_rgba(0,168,150,0.4)] transition-all flex items-center gap-2 text-xs"
                >
                  Get Started <ArrowRight size={16} />
                </Link>
                <Link
                  to="/apply"
                  className="bg-slate-900/60 hover:bg-slate-950 text-slate-300 font-bold py-3.5 px-8 rounded-2xl border border-slate-800/60 transition-all flex items-center gap-2 text-xs"
                >
                  Join as Technician
                </Link>
              </>
            )}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800/40 shadow-[0_8px_24px_rgba(0,0,0,0.3)] text-left space-y-3">
              <div className="h-10 w-10 rounded-xl bg-brand-light text-brand flex items-center justify-center border border-brand/20">
                <Briefcase size={20} />
              </div>
              <h4 className="font-bold text-white text-sm">Smart Dispatching</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Intelligent scheduler filters availability and technician skills automatically matching customer requirements.
              </p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800/40 shadow-[0_8px_24px_rgba(0,0,0,0.3)] text-left space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-950/30 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Shield size={20} />
              </div>
              <h4 className="font-bold text-white text-sm">Tenant Boundaries</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Multi-tenant architecture automatically isolates customer directories, orders, catalog and billing ledgers securely.
              </p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-3xl border border-slate-800/40 shadow-[0_8px_24px_rgba(0,0,0,0.3)] text-left space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-950/30 text-amber-400 flex items-center justify-center border border-amber-500/20">
                <Clock size={20} />
              </div>
              <h4 className="font-bold text-white text-sm">Auto-Billing Ledger</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                Calculates task labor and parts costs dynamically generating PDF-ready invoices on status completed callback.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="h-14 border-t border-slate-900/40 flex items-center justify-center text-[10px] text-slate-500 font-bold tracking-wider">
          © {new Date().getFullYear()} FieldFlow Inc. All Rights Reserved.
        </footer>

      </div>
    </div>
  );
}
