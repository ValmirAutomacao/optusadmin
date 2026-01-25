// Edge Function: Proxy seguro para API Uazapi
// Protege o ADMIN_TOKEN mantendo-o apenas no servidor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-instance-token',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

// Endpoints que requerem ADMIN_TOKEN (conforme OpenAPI)
const ADMIN_ENDPOINTS = [
    '/instance/all',
    '/instance/create',
    '/instance/delete',
    '/instance/init',
]

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Validar JWT do Supabase (Segurança do Proxy)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Não autorizado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        const supabaseToken = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(supabaseToken)

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Token Supabase inválido' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Configurações da Uazapi
        const UAZAPI_BASE_URL = 'https://optus.uazapi.com'
        const UAZAPI_ADMIN_TOKEN = (Deno.env.get('UAZAPI_ADMIN_TOKEN') || '').trim()

        if (!UAZAPI_ADMIN_TOKEN) {
            return new Response(
                JSON.stringify({ error: 'UAZAPI_ADMIN_TOKEN não configurado no servidor' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Extrair Path e Definir Autenticação
        const url = new URL(req.url)
        const path = url.pathname.split('/uazapi-proxy')[1] || '/'

        const isAdminEndpoint = ADMIN_ENDPOINTS.some(endpoint => path.startsWith(endpoint))
        const instanceToken = req.headers.get('x-instance-token')

        // DETERMINAÇÃO DO HEADER E TOKEN CORRETO
        // Importante: NÃO enviar 'Authorization: Bearer' para a Uazapi, ela não reconhece.
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }

        if (isAdminEndpoint) {
            headers['admintoken'] = UAZAPI_ADMIN_TOKEN
        } else {
            if (!instanceToken) {
                return new Response(
                    JSON.stringify({ error: 'Token da instância não fornecido (x-instance-token)' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
            headers['token'] = instanceToken.trim()
        }

        // 4. Proxy da Requisição
        const uazapiUrl = `${UAZAPI_BASE_URL}${path.replace(/\/+/g, '/')}`
        const options: RequestInit = {
            method: req.method,
            headers,
        }

        if (req.method !== 'GET' && req.method !== 'OPTIONS' && req.method !== 'HEAD') {
            try {
                const bodyText = await req.text()
                if (bodyText) {
                    options.body = bodyText
                }
            } catch (e) {
                console.error('Erro ao ler body:', e.message)
            }
        }

        const uazapiResponse = await fetch(uazapiUrl, options)
        const responseData = await uazapiResponse.text()

        // 5. Retornar Resposta
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
            JSON.stringify({ error: error.message || 'Erro interno no proxy' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
