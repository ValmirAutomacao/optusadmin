# Integração WhatsApp - Uazapi

## Visão Geral

O sistema Optus Admin agora possui integração completa com a API Uazapi para gerenciamento automatizado de instâncias WhatsApp. Esta implementação permite que os clientes criem, configurem e gerenciem suas conexões WhatsApp diretamente pelo app, sem necessidade de intervenção manual.

## 🚀 Funcionalidades Implementadas

### ✅ Criação Automatizada de Instâncias
- **Fluxo completamente automatizado**: Cliente apenas informa nome e telefone (opcional)
- **Geração automática de QR Code** (sem telefone) ou **Código de Pareamento** (com telefone)
- **Webhook configurado automaticamente** para receber eventos
- **Isolamento por tenant** (multi-tenant seguro)

### ✅ Interface Completa de Gerenciamento
- **Listagem de instâncias** com status em tempo real
- **Modal de status** com QR Code/PairCode e instruções
- **Monitoramento automático** de conexão a cada 3 segundos
- **Exclusão de instâncias** com confirmação

### ✅ Segurança e Isolamento
- **RLS (Row Level Security)** na tabela `whatsapp_instances`
- **Permissões por role**: apenas admin/developer podem acessar
- **Dados sensíveis protegidos** (tokens, credenciais)

## 📋 Requisitos de Sistema

### Banco de Dados (Supabase)
- Tabela `whatsapp_instances` criada via migration
- Políticas RLS configuradas
- Triggers de auditoria (updated_at)

### Variáveis de Ambiente
```env
VITE_UAZAPI_BASE_URL=https://optus.uazapi.com
VITE_UAZAPI_ADMIN_TOKEN=your_admin_token_here
VITE_WEBHOOK_BASE_URL=https://your-domain.com/webhooks
```

### Permissões de Usuário
- Acesso restrito a roles: `developer` e `admin`
- Integração com sistema de autenticação existente

## 🔧 Componentes Principais

### 1. Serviço de Integração (`lib/uazapi.ts`)
**Classes principais:**
- `UazapiService`: Comunicação direta com API Uazapi
- `WhatsappInstanceService`: Lógica de negócio e integração com Supabase

**Métodos implementados:**
- `createWhatsappInstance()`: Criação automatizada completa
- `listTenantInstances()`: Listagem por tenant
- `checkInstanceStatus()`: Monitoramento de status
- `deleteWhatsappInstance()`: Exclusão segura

### 2. Interface do Usuário (`components/WhatsappInstances.tsx`)
**Funcionalidades:**
- Formulário de criação com validação
- Grid responsivo de instâncias
- Modal de status com QR Code/PairCode
- Monitoramento em tempo real
- Instruções passo-a-passo para usuário

### 3. Página e Rotas (`pages/Whatsapp.tsx`)
- Integração com Layout responsivo
- Rota protegida `/whatsapp`
- Item ativo no menu de navegação

## 🔄 Fluxo de Automação

### 1. Criação de Instância
```
Cliente preenche formulário
    ↓
Sistema chama Uazapi /instance/init
    ↓
Salva dados no Supabase
    ↓
Chama Uazapi /instance/connect
    ↓
Configura webhook automaticamente
    ↓
Exibe QR Code/PairCode para cliente
```

### 2. Processo de Conexão
```
Cliente escaneia QR Code ou insere PairCode
    ↓
Sistema monitora status a cada 3s
    ↓
Webhook recebe evento 'connection'
    ↓
Status atualizado em tempo real
    ↓
Interface confirma conexão estabelecida
```

### 3. Gestão de Eventos
```
WhatsApp → Uazapi → Webhook → Seu Sistema
```

## 📊 Estrutura do Banco

### Tabela: `whatsapp_instances`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único da instância |
| `tenant_id` | UUID | Isolamento por tenant |
| `name` | VARCHAR | Nome da instância |
| `phone` | VARCHAR | Telefone do WhatsApp |
| `uazapi_instance_id` | VARCHAR | ID na API Uazapi |
| `uazapi_token` | VARCHAR | Token de autenticação |
| `status` | VARCHAR | disconnected/connecting/connected |
| `qrcode` | TEXT | QR Code em base64 |
| `paircode` | VARCHAR | Código de pareamento |
| `profile_name` | VARCHAR | Nome do perfil conectado |
| `webhook_configured` | BOOLEAN | Se webhook está ativo |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Última atualização |

## 🎯 Endpoints da API Uazapi Utilizados

### Endpoints Administrativos (admintoken)
- `POST /instance/init` - Criar instância
- `GET /instance/all` - Listar todas instâncias

### Endpoints por Instância (token)
- `POST /instance/connect` - Iniciar conexão
- `GET /instance/status` - Verificar status
- `POST /webhook` - Configurar webhook
- `DELETE /instance` - Deletar instância

## 🎨 Interface do Usuário

### Tela Principal
- **Header**: Título + botão "Nova Instância"
- **Grid de Cards**: Exibe cada instância com status visual
- **Ações**: Botões de Status e Deletar por instância

### Modal de Criação
- **Campos**: Nome, Telefone (opcional), Descrição
- **Validações**: Nome obrigatório, telefone formato correto
- **Instruções**: Informações sobre QR vs PairCode

### Modal de Status
- **Status Visual**: Ícones coloridos por estado
- **QR Code**: Imagem para escaneamento
- **PairCode**: Código numérico destacado
- **Instruções**: Passo-a-passo detalhado
- **Monitoramento**: Atualização automática

## 🔐 Segurança

### Row Level Security (RLS)
```sql
-- Isolamento por tenant
CREATE POLICY "whatsapp_instances_tenant_isolation" ON whatsapp_instances
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Permissões de modificação
CREATE POLICY "whatsapp_instances_modification" ON whatsapp_instances
  FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
    AND current_setting('app.current_user_role') IN ('owner', 'admin')
  );
```

### Proteção de Rotas
- Middleware `ProtectedRoute` com verificação de role
- Acesso restrito a `developer` e `admin`

### Webhook Security
- URLs únicas por instância
- Filtro `excludeMessages: ['wasSentByApi']` evita loops
- Validação de origem dos eventos

## 📱 Responsividade

### Desktop (≥1024px)
- Layout sidebar + conteúdo principal
- Modais centralizados
- Grid de cards responsivo

### Mobile (<1024px)
- Interface PWA otimizada
- Modais full-screen
- Navegação touch-friendly

## 🚨 Tratamento de Erros

### Cenários Cobertos
1. **Erro na API Uazapi**: Rollback automático no Supabase
2. **Erro no Supabase**: Cleanup na Uazapi
3. **Timeout de conexão**: Monitoramento para e usuário é notificado
4. **Webhook falhou**: Status mantido, permite reconfiguração
5. **Credenciais inválidas**: Mensagens de erro claras

### Logs e Debugging
- `console.error()` para todos os erros
- Detalhes do erro exibidos para admin
- Status tracking em tempo real

## 🔄 Próximas Fases

### Fase 2: Webhook Handler
- Endpoint para receber eventos Uazapi
- Processamento de mensagens recebidas
- Integração com automações n8n

### Fase 3: Gestão de Mensagens
- Interface para envio de mensagens
- Templates e respostas rápidas
- Histórico de conversas

### Fase 4: Automação Avançada
- Integração com n8n workflows
- RAG para respostas inteligentes
- Analytics de performance

## 📞 Suporte e Troubleshooting

### Problemas Comuns

**1. QR Code não conecta**
- Verificar se é WhatsApp Business (recomendado)
- Tentar código de pareamento com telefone
- Verificar conectividade do servidor

**2. Webhook não recebe eventos**
- Verificar URL pública acessível
- Conferir configuração de filtros
- Testar URL webhook manualmente

**3. Erro de permissão**
- Verificar role do usuário
- Conferir configuração RLS
- Validar tenant_id correto

### Logs Importantes
```bash
# Verificar instâncias ativas na Uazapi
curl -H "admintoken: YOUR_TOKEN" https://optus.uazapi.com/instance/all

# Testar webhook (substitua a URL)
curl -X POST https://your-domain.com/webhooks/whatsapp/instance-id \
  -H "Content-Type: application/json" \
  -d '{"event":"connection","instance":"test","data":{"status":"connected"}}'
```

## 📄 Changelog

### v1.0.0 (Atual)
- ✅ Criação automatizada de instâncias
- ✅ Interface completa de gerenciamento
- ✅ Monitoramento em tempo real
- ✅ Webhook configuration
- ✅ Multi-tenant security
- ✅ QR Code e PairCode support

---

## 📞 Contato

Para suporte técnico ou dúvidas sobre a integração:
- Documentação Uazapi: [API Documentation](https://uazapi.com/docs)
- Issues do projeto: GitHub Issues
- Suporte Supabase: [Supabase Support](https://supabase.com/support)