/**
 * Página de Onboarding para Managers
 * Permite que o gestor da empresa crie sua senha após receber o email de convite
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { validateOnboardingToken, completeOnboarding } from '../lib/onboardingService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface TenantData {
    id: string;
    name: string;
    manager_name: string;
    manager_email: string;
}

export default function ManagerOnboarding() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tenantData, setTenantData] = useState<TenantData | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Token não encontrado. Verifique o link do email.');
            setLoading(false);
            return;
        }

        validateToken();
    }, [token]);

    async function validateToken() {
        if (!token) return;

        setLoading(true);
        const result = await validateOnboardingToken(token, 'manager');

        if (!result.valid || !result.data) {
            setError('Token inválido ou expirado. Solicite um novo convite.');
            setLoading(false);
            return;
        }

        setTenantData(result.data as TenantData);
        setLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        if (!token) {
            setError('Token não encontrado.');
            return;
        }

        setSubmitting(true);
        setError(null);

        const result = await completeOnboarding({
            token,
            type: 'manager',
            password
        });

        if (!result.success) {
            setError(result.error || 'Erro ao criar conta. Tente novamente.');
            setSubmitting(false);
            return;
        }

        setSuccess(true);
        setSubmitting(false);

        // Redirecionar para login após 3 segundos
        setTimeout(() => {
            navigate('/');
        }, 3000);
    }

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white/80">Verificando convite...</p>
                </div>
            </div>
        );
    }

    // Error state (invalid/expired token)
    if (error && !tenantData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-orange-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">❌</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Inválido</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={() => navigate('/')} variant="secondary">
                        Ir para Login
                    </Button>
                </div>
            </div>
        );
    }

    // Success state
    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-4xl">✅</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Conta Criada!</h1>
                    <p className="text-gray-600 mb-4">
                        Sua conta foi criada com sucesso. Você será redirecionado para o login em instantes...
                    </p>
                    <p className="text-sm text-gray-500">
                        Se não for redirecionado, <a href="/" className="text-blue-600 hover:underline">clique aqui</a>.
                    </p>
                </div>
            </div>
        );
    }

    // Form state
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <span className="text-4xl">🔐</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao OptusAdmin!</h1>
                    <p className="text-gray-600 mt-2">
                        Crie sua senha para acessar <strong>{tenantData?.name}</strong>
                    </p>
                </div>

                {/* User Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-500">Você está acessando como:</p>
                    <p className="font-semibold text-gray-900">{tenantData?.manager_name}</p>
                    <p className="text-sm text-gray-600">{tenantData?.manager_email}</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nova Senha"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        required
                    />

                    <Input
                        label="Confirmar Senha"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite a senha novamente"
                        required
                    />

                    {error && (
                        <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            {error}
                        </p>
                    )}

                    <Button
                        type="submit"
                        loading={submitting}
                        className="w-full"
                    >
                        🚀 Criar Minha Conta
                    </Button>
                </form>

                <p className="text-center text-xs text-gray-500 mt-6">
                    Ao criar sua conta, você concorda com nossos termos de uso.
                </p>
            </div>
        </div>
    );
}
