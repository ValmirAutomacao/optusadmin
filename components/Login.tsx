
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  isMobile: boolean;
}

const Login: React.FC<LoginProps> = ({ isMobile }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-serious-50 p-6">
      {/* Background patterns for visual "desire" and depth */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-serious-900/10 blur-[120px] rounded-full" />
      </div>

      <div className={`w-full max-w-md transition-all duration-500 ${isMobile ? 'mt-[-10vh]' : ''}`}>
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-serious-900/5 p-8 md:p-12 relative overflow-hidden border border-white">
          
          {/* Brand Identity */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-brand-500 rounded-3xl flex items-center justify-center shadow-lg shadow-brand-500/30 mb-6">
              <span className="material-icons-round text-white text-3xl">bolt</span>
            </div>
            <h1 className="text-3xl font-extrabold text-serious-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 text-sm mt-2 font-medium">Log in to your hybrid dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-serious-900 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">alternate_email</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-serious-900 uppercase tracking-widest">Password</label>
                <button type="button" className="text-[10px] font-bold text-brand-500 hover:text-brand-600 uppercase tracking-wide">Forgot?</button>
              </div>
              <div className="relative group">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors">lock</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-medium focus:bg-white focus:border-brand-500/20 focus:ring-4 focus:ring-brand-500/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-1">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500" />
              <label htmlFor="remember" className="text-xs font-medium text-slate-500">Keep me signed in on this device</label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-serious-900 hover:bg-serious-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-serious-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              {!isLoading && (
                <span className="material-icons-round text-brand-500 group-hover:translate-x-1 transition-transform">arrow_forward</span>
              )}
            </button>
          </form>

          <div className="mt-10 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-400">Don't have an account?</span>
            <button className="text-xs font-bold text-serious-900 hover:underline">Create Account</button>
          </div>
        </div>

        {/* Dynamic Footer Reference */}
        {!isMobile && (
          <div className="mt-8 flex justify-center gap-8">
            <div className="flex items-center gap-2 text-slate-400">
              <span className="material-icons-round text-sm">security</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Secure System</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="material-icons-round text-sm">devices</span>
              <span className="text-[10px] font-bold uppercase tracking-widest">Hybrid PWA Ready</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
