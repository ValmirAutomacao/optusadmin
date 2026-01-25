import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        )

        // 1. Buscar agendamentos que ocorrem em exatamente 24 horas (janela de 1 hora)
        // Usamos UTC para facilitar
        const targetDate = new Date();
        targetDate.setHours(targetDate.getHours() + 24);

        const dateStr = targetDate.toISOString().split('T')[0];
        const hourStr = targetDate.toISOString().split('T')[1].substring(0, 5); // ex: "14:30"

        console.log(`[REMINDER] Buscando agendamentos para ${dateStr} aproximadamente às ${hourStr}`);

        const { data: list, error: listError } = await supabase
            .from('agendamentos')
            .select(`
                id,
                tenant_id,
                name,
                data_agendamento,
                hora_inicio,
                profissional:profissionais(name),
                tenant:tenants(nome)
            `)
            .eq('data_agendamento', dateStr)
            // .filter('hora_inicio', 'like', `${hourStr.substring(0,2)}%`) // Simplificado para teste
            .eq('status', 'confirmed');

        if (listError) throw listError;
        if (!list || list.length === 0) {
            return new Response(JSON.stringify({ message: 'Nenhum agendamento para notificar agora' }), { headers: corsHeaders })
        }

        const results = [];

        for (const appointment of list) {
            try {
                // 2. Buscar instância de WhatsApp conectada para este tenant
                const { data: instance } = await supabase
                    .from('whatsapp_instances')
                    .select('uazapi_token, phone')
                    .eq('tenant_id', appointment.tenant_id)
                    .eq('status', 'connected')
                    .limit(1)
                    .single();

                if (!instance?.uazapi_token) {
                    console.warn(`[SKIP] Tenant ${appointment.tenant_id} sem instância conectada`);
                    continue;
                }

                // 3. Buscar telefone do lead/cliente (assumindo que guardamos no lead ou passamos na criação)
                // Para este exemplo, vamos assumir que o sistema de agendamento tem o telefone
                // Se não, buscaríamos na tabela de leads
                const { data: lead } = await supabase
                    .from('leads')
                    .select('phone')
                    .eq('tenant_id', appointment.tenant_id)
                    .eq('name', appointment.name)
                    .limit(1)
                    .single();

                if (!lead?.phone) continue;

                const message = `Olá *${appointment.name}*! 👋\n\nEste é um lembrete do seu agendamento na *${appointment.tenant?.nome}*.\n\n📅 *Data:* ${new Date(appointment.data_agendamento).toLocaleDateString('pt-BR')}\n⏰ *Horário:* ${appointment.hora_inicio}\n👨‍⚕️ *Com:* ${appointment.profissional?.name}\n\nPor favor, confirme se você comparecerá respondendo *SIM* ou *NÃO*.\n\nPara reagendar, entre em contato conosco. Até logo!`;

                // 4. Enviar via Uazapi
                const uazapiResponse = await fetch('https://optus.uazapi.com/message/text', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'token': instance.uazapi_token
                    },
                    body: JSON.stringify({
                        phone: lead.phone,
                        message: message
                    })
                });

                results.push({ id: appointment.id, sent: uazapiResponse.ok });

            } catch (err) {
                console.error(`[ERROR] Falha ao enviar lembrete para agendamento ${appointment.id}:`, err);
            }
        }

        return new Response(JSON.stringify({ processed: list.length, results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('[FATAL]', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
    }
})
