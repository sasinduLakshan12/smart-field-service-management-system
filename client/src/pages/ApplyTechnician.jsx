import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle, ShieldAlert, FileText, UploadCloud, X } from 'lucide-react';

export default function ApplyTechnician() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('AC Repair');
  const [experienceYears, setExperienceYears] = useState('');
  
  // File upload state
  const [cvFile, setCvFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/v1/companies')
      .then(res => {
        if (res.data.success && res.data.data.length > 0) {
          setCompanies(res.data.data);
          setSelectedCompanyId(res.data.data[0]._id);
        }
      })
      .catch(err => {
        console.error('Failed to load companies, using default seed');
      });
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setCvFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
    }
  };

  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cvFile) {
      setFeedback({ success: false, message: 'Please drop or browse your CV file first!' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const base64File = await getBase64(cvFile);

      const res = await axios.post('http://localhost:5000/api/v1/technicians/apply', {
        name,
        email,
        password,
        skills: [selectedSkill],
        experienceYears: Number(experienceYears),
        fileName: cvFile.name,
        fileData: base64File,
        companyId: selectedCompanyId || undefined
      });

      if (res.data.success) {
        setFeedback({ success: true, message: res.data.message });
        setName('');
        setEmail('');
        setPassword('');
        setExperienceYears('');
        setCvFile(null);
        
        // Auto redirect to Homepage after 2.5 seconds
        setTimeout(() => {
          navigate('/');
        }, 2500);
      }
    } catch (err) {
      setFeedback({ success: false, message: err.response?.data?.message || 'Submission failed' });
    } finally {
      setLoading(false);
    }
  };

  const skillOptions = [
    'AC Repair',
    'Plumbing',
    'Electrical',
    'Generator Repair',
    'Appliance Repair'
  ];

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative text-slate-200 flex items-center justify-center p-4"
      style={{ backgroundImage: "url('/landing_bg.jpg')" }}
    >
      {/* Dark mask */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs z-0"></div>

      {/* Frosted Glass Apply Container */}
      <div className="max-w-lg w-full bg-slate-900/60 backdrop-blur-md rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-slate-800/60 overflow-hidden relative z-10 p-7 space-y-6">
        
        <div className="flex justify-between items-center pb-2 border-b border-slate-800/40">
          <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-1 text-xs font-semibold">
            <ArrowLeft size={16} /> Home
          </Link>
          <h2 className="text-sm font-extrabold text-brand uppercase tracking-wider">Workforce Registration</h2>
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl font-bold text-white">Apply as Technician</h3>
          <p className="text-xs text-slate-400 font-medium">Provide your credentials and qualifications for admin review.</p>
        </div>

        {feedback && (
          <div className={`p-4 rounded-2xl text-xs border flex items-center gap-2 ${
            feedback.success ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/30' : 'bg-red-950/20 text-red-400 border-red-900/30'
          }`}>
            {feedback.success ? <CheckCircle size={16} /> : <ShieldAlert size={16} />}
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. Ruwan Perera"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. ruwan@gmail.com"
                autoComplete="new-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Portal Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Years of Experience
              </label>
              <input
                type="number"
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="e.g. 5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Primary Expertise
              </label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {skillOptions.map(skill => (
                  <option key={skill} value={skill} className="bg-slate-900 text-white text-xs">{skill}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Company
              </label>
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/60 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                {companies.length === 0 ? (
                  <option value="" className="bg-slate-900 text-white text-xs">Lanka Service Co. (Default)</option>
                ) : (
                  companies.map(comp => (
                    <option key={comp._id} value={comp._id} className="bg-slate-900 text-white text-xs">{comp.name}</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Drag & Drop CV File Upload Area */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Upload CV / Resume Document (PDF/Doc)
            </label>
            
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all relative ${
                dragActive 
                  ? 'border-brand bg-brand/10 scale-[1.01]' 
                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
              }`}
            >
              <input
                id="cv-file-input"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              {cvFile ? (
                <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                  <div className="flex items-center gap-2 text-white">
                    <FileText size={18} className="text-brand" />
                    <span className="font-bold truncate max-w-[240px]">{cvFile.name}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">({(cvFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setCvFile(null)}
                    className="text-slate-400 hover:text-red-400 transition-colors p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label 
                  htmlFor="cv-file-input" 
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <UploadCloud size={28} className="text-slate-500" />
                  <div>
                    <p className="text-xs font-bold text-white">Drag & drop your file here, or <span className="text-brand hover:underline">browse</span></p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">Supports PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-brand hover:bg-brand-hover text-white font-bold py-3.5 px-4 rounded-xl text-xs shadow-[0_8px_16px_rgba(0,168,150,0.3)] hover:shadow-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting profile...' : 'Submit Application'}
          </button>
        </form>

      </div>
    </div>
  );
}
