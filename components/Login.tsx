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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 p-6">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className={`w-full max-w-md transition-all duration-500 animate-reveal ${isMobile ? 'scale-90' : ''}`}>
        {/* Glass Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-blue-900/10 relative overflow-hidden">

          {/* Brand Identity */}
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/30 mb-6">
              <span className="material-icons-round text-white text-3xl">bolt</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-center">
              Bem-vindo!
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium text-center">
              Acesse sua conta para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                Email
              </label>
              <div className="relative group">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  alternate_email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Senha
                </label>
                <button type="button" className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wide">
                  Esqueceu?
                </button>
              </div>
              <div className="relative group">
                <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-2 border-transparent rounded-2xl text-sm font-semibold focus:bg-white focus:border-blue-600/20 focus:ring-4 focus:ring-blue-600/5 transition-all outline-none"
                  required
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="remember"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
              />
              <label htmlFor="remember" className="text-xs font-medium text-slate-500">
                Manter conectado neste dispositivo
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm flex items-center gap-2 animate-reveal">
                <span className="material-icons-round text-lg">error</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <span className="material-icons-round group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-8 pt-8 border-t border-slate-100/50 flex flex-col items-center gap-4">
            <div className="flex justify-center gap-6">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="material-icons-round text-sm">security</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Seguro</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="material-icons-round text-sm">devices</span>
                <span className="text-[9px] font-bold uppercase tracking-widest">Multi-Acesso</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-medium">
              Uso restrito a funcionários autorizados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
