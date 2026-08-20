import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, register, loading, error, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isRegister) {
      await register(name, email, password, 'customer');
    } else {
      await login(email, password);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative neon blur blobs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-teal-400/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Frosted Glass Login / Register Panel */}
      <div className="max-w-md w-full bg-slate-900/60 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-slate-800/60 overflow-hidden relative z-10">
        <div className="p-8 space-y-6">
          <div className="text-center space-y-2">
            {/* Back to Home Link */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-brand bg-slate-950/40 border border-slate-800/80 px-3.5 py-1.5 rounded-xl font-extrabold uppercase tracking-wider mb-2 transition-colors mx-auto"
            >
              ← Back to Homepage
            </Link>
            {/* Logo */}
            <div className="h-10 w-10 rounded-xl bg-brand flex items-center justify-center text-white font-black text-base mx-auto shadow-[0_0_16px_rgba(0,168,150,0.4)]">
              F
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight pt-1">
              {isRegister ? 'Create Account' : 'Welcome to FieldFlow'}
            </h2>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              {isRegister ? 'Join the field service network' : 'Sign in to your workplace account'}
            </p>
          </div>

          {error && (
            <div className="bg-red-950/20 border border-red-900/30 text-red-400 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="name">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all duration-200"
                  placeholder="e.g. Kamal Perera"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all duration-200"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-[0_8px_16px_rgba(0,168,150,0.25)] hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : isRegister ? 'Register' : 'Sign In'}
            </button>
          </form>

          <div className="text-center pt-2 select-none">
            <span className="text-xs text-slate-500 font-medium">
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setName('');
                setEmail('');
                setPassword('');
              }}
              className="text-xs text-brand hover:text-brand-hover hover:underline font-bold transition-all cursor-pointer focus:outline-none"
            >
              {isRegister ? 'Sign In' : 'Create one'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
