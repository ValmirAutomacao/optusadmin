import { useState, useCallback } from 'react';

export type MaskType = 'phone' | 'cpf' | 'cnpj' | 'cep' | 'money' | 'date';

interface MaskConfig {
  mask: string;
  placeholder: string;
  maxLength: number;
}

const MASKS: Record<MaskType, MaskConfig> = {
  phone: {
    mask: '(##) #####-####',
    placeholder: '(11) 99999-9999',
    maxLength: 15
  },
  cpf: {
    mask: '###.###.###-##',
    placeholder: '000.000.000-00',
    maxLength: 14
  },
  cnpj: {
    mask: '##.###.###/####-##',
    placeholder: '00.000.000/0000-00',
    maxLength: 18
  },
  cep: {
    mask: '#####-###',
    placeholder: '00000-000',
    maxLength: 9
  },
  money: {
    mask: 'R$ #.###,##',
    placeholder: 'R$ 0,00',
    maxLength: 20
  },
  date: {
    mask: '##/##/####',
    placeholder: 'dd/mm/aaaa',
    maxLength: 10
  }
};

export const useMask = (type: MaskType) => {
  const [value, setValue] = useState('');
  const config = MASKS[type];

  const applyMask = useCallback((inputValue: string): string => {
    const cleanValue = inputValue.replace(/\D/g, '');

    switch (type) {
      case 'phone':
        return applyPhoneMask(cleanValue);
      case 'cpf':
        return applyCpfMask(cleanValue);
      case 'cnpj':
        return applyCnpjMask(cleanValue);
      case 'cep':
        return applyCepMask(cleanValue);
      case 'money':
        return applyMoneyMask(cleanValue);
      case 'date':
        return applyDateMask(cleanValue);
      default:
        return inputValue;
    }
  }, [type]);

  const handleChange = useCallback((inputValue: string) => {
    const maskedValue = applyMask(inputValue);
    setValue(maskedValue);
    return maskedValue;
  }, [applyMask]);

  const clearValue = useCallback(() => {
    setValue('');
  }, []);

  const getUnmaskedValue = useCallback((maskedValue?: string) => {
    const valueToClean = maskedValue || value;
    if (type === 'money') {
      return valueToClean.replace(/[R$\s.,]/g, '');
    }
    return valueToClean.replace(/\D/g, '');
  }, [value, type]);

  return {
    value,
    setValue,
    handleChange,
    clearValue,
    getUnmaskedValue,
    placeholder: config.placeholder,
    maxLength: config.maxLength
  };
};

function applyPhoneMask(value: string): string {
  if (value.length <= 10) {
    return value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

function applyCpfMask(value: string): string {
  return value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/-$/, '');
}

function applyCnpjMask(value: string): string {
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').replace(/-$/, '');
}

function applyCepMask(value: string): string {
  return value.replace(/(\d{5})(\d{0,3})/, '$1-$2').replace(/-$/, '');
}

function applyMoneyMask(value: string): string {
  if (!value) return '';

  const numericValue = parseInt(value, 10);
  const formattedValue = (numericValue / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return formattedValue;
}

function applyDateMask(value: string): string {
  return value.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3').replace(/\/$/, '');
}

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/\D/g, '');

  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;

  return remainder === parseInt(cleanCPF.charAt(10));
};

export const validateCNPJ = (cnpj: string): boolean => {
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  if (cleanCNPJ.length !== 14 || /^(\d)\1+$/.test(cleanCNPJ)) {
    return false;
  }

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleanCNPJ.charAt(i)) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return digit1 === parseInt(cleanCNPJ.charAt(12)) && digit2 === parseInt(cleanCNPJ.charAt(13));
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};