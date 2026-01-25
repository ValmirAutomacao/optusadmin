// Edge Function: Proxy seguro para API Uazapi (Versão 17 - Bypass JWT Gateway)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-instance-token',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        // 1. Validar Usuário (Fazemos manual para ter controle total dos erros)
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('[AUTH] Sem header de autorização')
            return new Response(JSON.stringify({ error: 'Não autorizado (Sem Header)' }), { status: 401, headers: corsHeaders })
        }

        const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            console.error('[AUTH] Erro ao validar JWT no Supabase:', authError?.message)
            return new Response(JSON.stringify({
                error: 'SessãoSupabaseInvalida',
                details: authError?.message
            }), { status: 401, headers: corsHeaders })
        }

        console.log(`[AUTH] Usuário validado: ${user.email}`)

        // 2. Configurações Uazapi
        const UAZAPI_ADMIN_TOKEN = (Deno.env.get('UAZAPI_ADMIN_TOKEN') || '').trim()
        const UAZAPI_BASE_URL = 'https://optus.uazapi.com'

        if (!UAZAPI_ADMIN_TOKEN) {
            console.error('[CONFIG] UAZAPI_ADMIN_TOKEN ausente')
            return new Response(JSON.stringify({ error: 'Admin token não configurado' }), { status: 500, headers: corsHeaders })
        }

        // 3. Preparar Path
        const url = new URL(req.url)
        const path = url.pathname.split('/uazapi-proxy')[1] || '/'
        const uazapiUrl = `${UAZAPI_BASE_URL}${path.replace(/\/+/g, '/')}`

        // 4. Headers Uazapi
        const instanceToken = req.headers.get('x-instance-token')
        const activeToken = (instanceToken || UAZAPI_ADMIN_TOKEN).trim()

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        }

        // Endpoints que requerem admintoken
        const adminPaths = ['/instance/all', '/instance/init', '/instance/create', '/instance/delete', '/instance/restore']
        if (adminPaths.some(ap => path.startsWith(ap)) || !instanceToken) {
            headers['admintoken'] = activeToken
            console.log(`[UAZAPI] Usando admintoken para ${path}`)
        } else {
            headers['token'] = activeToken
            console.log(`[UAZAPI] Usando token para ${path}`)
        }

        // 5. Proxy Call
        const options: RequestInit = {
            method: req.method,
            headers
        }

        if (req.method !== 'GET' && req.method !== 'OPTIONS') {
            options.body = await req.text()
        }

        console.log(`[FETCH] Chamando Uazapi: ${uazapiUrl}`)
        const response = await fetch(uazapiUrl, options)
        const result = await response.text()

        console.log(`[RESULT] Status: ${response.status}, Body: ${result.substring(0, 100)}`)

        return new Response(result, {
            status: response.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('[FATAL]', error)
        return new Response(JSON.stringify({ error: 'Erro interno no servidor de proxy' }), { status: 500, headers: corsHeaders })
    }
})
