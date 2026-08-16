import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { 
  User, 
  Mail, 
  Briefcase, 
  Clock, 
  Award, 
  Lock, 
  Key, 
  CheckCircle, 
  ShieldAlert, 
  Phone,
  Power
} from 'lucide-react';

export default function TechnicianProfile() {
  const { accessToken, user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Profile Edit State
  const [skills, setSkills] = useState('');
  const [phone, setPhone] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/v1/technicians', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.data.success) {
        const ownProfile = res.data.data.find(
          t => {
            const tUserId = t.userId?._id || t.userId;
            const currentUserId = user?._id || user?.id;
            return tUserId?.toString() === currentUserId?.toString();
          }
        );
        if (ownProfile) {
          setProfile(ownProfile);
          setSkills(ownProfile.skills.join(', '));
          setPhone(ownProfile.phone || '');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [accessToken, user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profile) return;
    setSubmitLoading(true);
    setFeedback(null);

    try {
      const skillsArray = skills.split(',').map(s => s.trim()).filter(Boolean);
      const res = await axios.put(`http://localhost:5000/api/v1/technicians/${profile._id}`, {
        skills: skillsArray,
        phone
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data.success) {
        setFeedback({ success: true, message: 'Profile details updated successfully!' });
        fetchProfile();
      }
    } catch (err) {
      setFeedback({ success: false, message: 'Failed to update profile settings' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setFeedback({ success: false, message: 'New password must be at least 6 characters' });
      return;
    }
    setSubmitLoading(true);
    setFeedback(null);

    try {
      const res = await axios.put('http://localhost:5000/api/v1/auth/updatepassword', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (res.data.success) {
        setFeedback({ success: true, message: 'Password changed successfully!' });
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Password update failed' });
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-900/40 backdrop-blur-md rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 h-64 bg-slate-900/40 backdrop-blur-md rounded-3xl"></div>
          <div className="col-span-2 h-64 bg-slate-900/40 backdrop-blur-md rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 relative text-slate-300">
      {/* Decorative Blur Blobs */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        <h1 className="text-2xl font-bold text-white tracking-tight">Profile & Account Settings</h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Manage credentials and expertises</p>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs border backdrop-blur-md flex items-center gap-2 relative z-10 ${
          feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
        }`}>
          {feedback.success ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        
        {/* Profile Card Summary Column */}
        <div className="col-span-1 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-6 space-y-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <div className="text-center space-y-3">
            {/* Avatar block */}
            <div className="h-16 w-16 bg-brand-light text-brand rounded-2xl flex items-center justify-center font-black text-2xl mx-auto shadow-md">
              {profile?.userId?.name?.slice(0, 2).toUpperCase() || 'TE'}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">{profile?.userId?.name}</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Field Technician</p>
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5">
              <Mail size={14} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 font-semibold truncate">{profile?.userId?.email}</span>
            </div>
            
            <div className="flex items-center gap-2.5">
              <Phone size={14} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 font-semibold">{profile?.phone || 'No phone registered'}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Briefcase size={14} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 font-semibold capitalize">{profile?.skills.join(', ')}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock size={14} className="text-slate-500 shrink-0" />
              <span className="text-slate-400 font-semibold">Active Portal Member</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Power size={14} className="text-slate-500 shrink-0" />
              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                profile?.availabilityStatus === 'available'
                  ? 'bg-brand-light text-brand border-brand/20'
                  : 'bg-amber-950/30 text-amber-500 border-amber-500/20'
              }`}>
                {profile?.availabilityStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Action settings forms Column */}
        <div className="col-span-2 space-y-6">
          
          {/* Edit Profile details card */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="pb-3 border-b border-slate-800/60 flex items-center gap-2 text-brand">
              <User size={18} />
              <h3 className="font-bold text-white text-sm">Update Contact Details & Skills</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="e.g. +94 77 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Skills / Expertises (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="e.g. Plumbing, AC Repair"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="bg-brand hover:bg-brand-hover text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
              >
                {submitLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change password card */}
          <div className="bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/60 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="pb-3 border-b border-slate-800/60 flex items-center gap-2 text-brand">
              <Lock size={18} />
              <h3 className="font-bold text-white text-sm">Change Portal Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitLoading}
                className="bg-brand hover:bg-brand-hover text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow-md transition-all disabled:opacity-50"
              >
                {submitLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
