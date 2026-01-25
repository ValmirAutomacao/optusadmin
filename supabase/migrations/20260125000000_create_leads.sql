-- Tabela de Leads (contatos capturados do WhatsApp)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    source VARCHAR(50) DEFAULT 'whatsapp',
    status VARCHAR(20) DEFAULT 'novo' CHECK (status IN ('novo', 'em_contato', 'qualificado', 'convertido', 'perdido')),
    first_contact_at TIMESTAMPTZ DEFAULT NOW(),
    last_contact_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, phone)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política: Usuários só veem leads do próprio tenant
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Leads do tenant'
    ) THEN
        CREATE POLICY "Leads do tenant" ON public.leads
            FOR ALL USING (
                tenant_id IN (
                    SELECT tenant_id FROM public.users WHERE auth_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Comentário
COMMENT ON TABLE public.leads IS 'Armazena leads capturados via WhatsApp para follow-up e remarketing';
