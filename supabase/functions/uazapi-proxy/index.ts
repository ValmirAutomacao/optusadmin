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
    '/instance/init',
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
        const UAZAPI_ADMIN_TOKEN = (Deno.env.get('UAZAPI_ADMIN_TOKEN') || '').trim()

        if (!UAZAPI_ADMIN_TOKEN) {
            return new Response(
                JSON.stringify({ error: 'UAZAPI_ADMIN_TOKEN não configurado no servidor' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Extrair o path real ignorando o prefixo do Supabase (/functions/v1/uazapi-proxy)
        const url = new URL(req.url)
        const proxyPath = '/uazapi-proxy'
        const pathIndex = url.pathname.indexOf(proxyPath)
        const path = pathIndex !== -1
            ? url.pathname.substring(pathIndex + proxyPath.length).replace(/\/+/g, '/')
            : url.pathname.replace(/\/+/g, '/')

        if (!path || path === '/') {
            return new Response(
                JSON.stringify({ error: 'Path não especificado' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Determinar qual token usar: prioridade para x-instance-token, fallback para admin token
        const instanceToken = req.headers.get('x-instance-token')
        const uazapiToken = (instanceToken || UAZAPI_ADMIN_TOKEN).trim()

        const isAdminEndpoint = ADMIN_ENDPOINTS.some(endpoint => path.startsWith(endpoint))

        // Preparar requisição para Uazapi
        const uazapiUrl = `${UAZAPI_BASE_URL}${path}`

        // Enviamos em ambos os headers para garantir compatibilidade
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'admintoken': uazapiToken,
            'token': uazapiToken
        }

        console.log(`[Proxy] ${req.method} ${path} -> ${uazapiUrl}`)
        console.log(`[Auth] Usando token iniciando em: ${uazapiToken.substring(0, 5)}... (Admin fallback usado: ${!instanceToken})`)

        const options: RequestInit = {
            method: req.method,
            headers,
        }

        // Incluir body se não for GET/OPTIONS
        if (req.method !== 'GET' && req.method !== 'OPTIONS') {
            try {
                const contentType = req.headers.get('content-type')
                if (contentType?.includes('application/json')) {
                    const body = await req.json()
                    options.body = JSON.stringify(body)
                }
            } catch (e) {
                console.log('[Body] Erro ao ler body:', e.message)
            }
        }

        // Fazer request para Uazapi
        const uazapiResponse = await fetch(uazapiUrl, options)
        const responseData = await uazapiResponse.text()

        console.log(`[Uazapi] Status: ${uazapiResponse.status}, Resposta: ${responseData.substring(0, 100)}...`)

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
