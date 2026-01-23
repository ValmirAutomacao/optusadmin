// Edge Function para buscar CNPJ via ReceitaWS
// Resolve problema de CORS

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { cnpj } = await req.json();

        if (!cnpj) {
            return new Response(
                JSON.stringify({ error: 'CNPJ não informado' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Limpar CNPJ
        const cleanCnpj = cnpj.replace(/\D/g, '');

        if (cleanCnpj.length !== 14) {
            return new Response(
                JSON.stringify({ error: 'CNPJ inválido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Buscar na ReceitaWS
        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);

        if (!response.ok) {
            if (response.status === 429) {
                return new Response(
                    JSON.stringify({ error: 'Limite de consultas excedido. Aguarde 1 minuto.' }),
                    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            throw new Error('Erro ao consultar CNPJ');
        }

        const data = await response.json();

        if (data.status === 'ERROR') {
            return new Response(
                JSON.stringify({ error: data.message || 'CNPJ não encontrado' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Formatar resposta
        const result = {
            razaoSocial: data.nome,
            nomeFantasia: data.fantasia || data.nome,
            cnpj: data.cnpj,
            email: data.email,
            telefone: data.telefone,
            atividadePrincipal: data.atividade_principal?.[0]?.text || '',
            situacao: data.situacao,
            endereco: {
                logradouro: data.logradouro,
                numero: data.numero,
                complemento: data.complemento,
                bairro: data.bairro,
                cidade: data.municipio,
                uf: data.uf,
                cep: data.cep
            }
        };

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message || 'Erro interno' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
