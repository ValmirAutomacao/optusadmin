import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full ${icon ? 'pl-12' : 'pl-4'} pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none ${error ? 'border-red-300 bg-red-50' : ''} ${className}`}
        />
      </div>
      {error && (
        <p className="text-red-600 text-xs ml-1">{error}</p>
      )}
    </div>
  );
};

export default Input;