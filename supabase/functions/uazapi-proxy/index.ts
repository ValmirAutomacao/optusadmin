// Edge Function: Proxy seguro para API Uazapi
// Protege o ADMIN_TOKEN mantendo-o apenas no servidor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-instance-token',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

// Endpoints que requerem ADMIN_TOKEN
const ADMIN_ENDPOINTS = [
    '/instance/all',
    '/instance/create',
    '/instance/delete',
    '/instance/init', // Criar instância requer admin token
]

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Validar JWT do Supabase
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Não autorizado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Verificar usuário autenticado
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Token inválido' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Obter configurações da Uazapi
        const UAZAPI_BASE_URL = Deno.env.get('UAZAPI_BASE_URL') || 'https://optus.uazapi.com'
        const UAZAPI_ADMIN_TOKEN = Deno.env.get('UAZAPI_ADMIN_TOKEN')

        if (!UAZAPI_ADMIN_TOKEN) {
            return new Response(
                JSON.stringify({ error: 'Configuração do servidor incompleta' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Extrair o path da requisição
        const url = new URL(req.url)
        const path = url.pathname.replace('/uazapi-proxy', '')

        if (!path) {
            return new Response(
                JSON.stringify({ error: 'Path não especificado' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Determinar qual token usar
        let uazapiToken: string

        if (ADMIN_ENDPOINTS.some(endpoint => path.startsWith(endpoint))) {
            // Operações admin - usar ADMIN_TOKEN
            uazapiToken = UAZAPI_ADMIN_TOKEN
        } else {
            // Operações de instância - usar token da instância (header)
            const instanceToken = req.headers.get('x-instance-token')
            if (!instanceToken) {
                return new Response(
                    JSON.stringify({ error: 'Token da instância não fornecido' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            uazapiToken = instanceToken
        }

        // Preparar request para Uazapi
        const uazapiUrl = `${UAZAPI_BASE_URL}${path}`
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${uazapiToken}`,
        }

        const options: RequestInit = {
            method: req.method,
            headers,
        }

        // Incluir body se não for GET
        if (req.method !== 'GET') {
            try {
                const body = await req.json()
                options.body = JSON.stringify(body)
            } catch {
                // Request sem body
            }
        }

        // Fazer request para Uazapi
        const uazapiResponse = await fetch(uazapiUrl, options)
        const responseData = await uazapiResponse.text()

        // Retornar resposta
        return new Response(responseData, {
            status: uazapiResponse.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
            },
        })

    } catch (error) {
        console.error('Erro no proxy Uazapi:', error)
        return new Response(
            JSON.stringify({ error: error.message || 'Erro interno' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
