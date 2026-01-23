import React, { forwardRef } from 'react';
import { useMask, MaskType } from '../../hooks/useMask';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string;
  icon?: string;
  maskType: MaskType;
  value?: string;
  onChange?: (value: string, unmaskedValue: string) => void;
  error?: string;
}

const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(({
  label,
  icon,
  maskType,
  value: externalValue,
  onChange,
  error,
  className = '',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const mask = useMask(maskType);

  React.useEffect(() => {
    if (externalValue !== undefined && externalValue !== mask.value) {
      mask.setValue(mask.handleChange(externalValue));
    }
  }, [externalValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = mask.handleChange(e.target.value);
    const unmaskedValue = mask.getUnmaskedValue(newValue);

    if (onChange) {
      onChange(newValue, unmaskedValue);
    }
  };

  const inputClasses = `
    w-full px-4 py-3
    ${icon ? 'pl-12' : ''}
    bg-gray-50 border-2 border-transparent rounded-xl
    text-sm font-medium
    focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5
    transition-all outline-none
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    ${error ? 'border-red-300 bg-red-50' : ''}
    ${className}
  `.trim();

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-bold text-gray-900 uppercase tracking-widest ml-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-icons-round text-gray-400 text-xl">{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          type="text"
          value={mask.value}
          onChange={handleInputChange}
          className={inputClasses}
          placeholder={mask.placeholder}
          maxLength={mask.maxLength}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && (
        <p className="text-red-600 text-xs mt-1 ml-1">{error}</p>
      )}
    </div>
  );
});

MaskedInput.displayName = 'MaskedInput';

export default MaskedInput;