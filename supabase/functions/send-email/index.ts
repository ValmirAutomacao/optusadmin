import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EmailRequest {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get Resend API Key from environment
        const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
        if (!RESEND_API_KEY) {
            console.error('RESEND_API_KEY not configured');
            return new Response(
                JSON.stringify({ error: 'Email service not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Parse request body
        const body: EmailRequest = await req.json();

        if (!body.to || !body.subject || !body.html) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Default from address (usando admin@ ao invés de noreply@)
        const from = body.from || 'OptusAdmin <admin@optuagentiasaas.shop>';

        // Send email via Resend
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from,
                to: Array.isArray(body.to) ? body.to : [body.to],
                subject: body.subject,
                html: body.html
            })
        });

        const resendData = await resendResponse.json();

        if (!resendResponse.ok) {
            console.error('Resend API error:', resendData);
            return new Response(
                JSON.stringify({ error: 'Failed to send email', details: resendData }),
                { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, id: resendData.id }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Error in send-email function:', error);
        return new Response(
            JSON.stringify({ error: 'Internal server error', message: String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
