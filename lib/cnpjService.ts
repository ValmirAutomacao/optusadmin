/**
 * Serviço de consulta CNPJ via ReceitaWS
 * API gratuita: 3 consultas/minuto
 */

interface CnpjResponse {
    status: 'OK' | 'ERROR';
    message?: string;
    nome: string;
    fantasia: string;
    cnpj: string;
    abertura: string;
    situacao: string;
    tipo: string;
    natureza_juridica: string;
    email: string;
    telefone: string;
    atividade_principal: Array<{
        code: string;
        text: string;
    }>;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
}

export interface CnpjData {
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    email: string;
    telefone: string;
    atividadePrincipal: string;
    situacao: string;
    endereco: {
        logradouro: string;
        numero: string;
        complemento: string;
        bairro: string;
        cidade: string;
        uf: string;
        cep: string;
    };
}

/**
 * Remove formatação do CNPJ
 */
export function cleanCnpj(cnpj: string): string {
    return cnpj.replace(/\D/g, '');
}

/**
 * Valida formato do CNPJ
 */
export function isValidCnpj(cnpj: string): boolean {
    const cleaned = cleanCnpj(cnpj);

    if (cleaned.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cleaned)) return false;

    // Validação dos dígitos verificadores
    let size = cleaned.length - 2;
    let numbers = cleaned.substring(0, size);
    const digits = cleaned.substring(size);
    let sum = 0;
    let pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (result !== parseInt(digits.charAt(0))) return false;

    size = size + 1;
    numbers = cleaned.substring(0, size);
    sum = 0;
    pos = size - 7;

    for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
    }

    result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return result === parseInt(digits.charAt(1));
}

/**
 * Busca dados do CNPJ via Edge Function (resolve CORS)
 */
export async function fetchCnpjData(cnpj: string): Promise<CnpjData> {
    const cleaned = cleanCnpj(cnpj);

    if (!isValidCnpj(cleaned)) {
        throw new Error('CNPJ inválido');
    }

    // Usar Edge Function do Supabase para evitar CORS
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/buscar-cnpj`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ cnpj: cleaned }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao consultar CNPJ');
    }

    return data as CnpjData;
}

/**
 * Formata CNPJ para exibição
 */
export function formatCnpj(cnpj: string): string {
    const cleaned = cleanCnpj(cnpj);
    return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/**
 * Formata CPF para exibição
 */
export function formatCpf(cpf: string): string {
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * Valida CPF
 */
export function isValidCpf(cpf: string): boolean {
    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cleaned)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let result = (sum * 10) % 11;
    if (result === 10 || result === 11) result = 0;
    if (result !== parseInt(cleaned.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    result = (sum * 10) % 11;
    if (result === 10 || result === 11) result = 0;

    return result === parseInt(cleaned.charAt(10));
}
