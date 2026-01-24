import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface CreateUserRequest {
    email: string;
    password: string;
    name: string;
    role: string;
    tenant_id: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Criar cliente Supabase com service_role key (acesso admin)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        // Parse request body
        const body: CreateUserRequest = await req.json();

        if (!body.email || !body.password || !body.name || !body.tenant_id) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: email, password, name, tenant_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validar senha
        if (body.password.length < 6) {
            return new Response(
                JSON.stringify({ error: 'Password must be at least 6 characters' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Criar usuário usando Admin API (já confirmado, sem email de confirmação)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true, // Já marca como confirmado!
            user_metadata: {
                name: body.name,
                role: body.role || 'admin',
                tenant_id: body.tenant_id
            }
        });

        if (authError) {
            console.error('Error creating user:', authError);
            return new Response(
                JSON.stringify({ error: authError.message }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        if (!authData.user) {
            return new Response(
                JSON.stringify({ error: 'Failed to create user' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Criar perfil do usuário na tabela users
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                auth_id: authData.user.id,
                tenant_id: body.tenant_id,
                email: body.email,
                name: body.name,
                role: body.role || 'admin',
                status: 'active'
            });

        if (profileError) {
            console.error('Error creating profile:', profileError);
            // Não falha, pois o usuário foi criado no auth
        }

        return new Response(
            JSON.stringify({
                success: true,
                user_id: authData.user.id,
                email: authData.user.email
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in create-user function:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', message: String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
