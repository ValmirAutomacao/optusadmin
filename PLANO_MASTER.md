# 🏥 PLANO MASTER - Sistema de Automação Clínica (v2)

**Data:** 27/01/2026  
**Prazo de Entrega:** HOJE (Protótipo)  
**Status:** APROVADO PARA IMPLEMENTAÇÃO

---

## 📊 ANÁLISE DO ESTADO ATUAL

### ✅ Estrutura do Banco de Dados

| Tabela | Campos Relevantes | Status |
|--------|-------------------|--------|
| `tenants` | name, segment, settings | ✅ OK |
| `patients` | name, phone, birth_date | ✅ OK |
| `specialties` | name, description | 🆕 CRIAR |
| `profissionais` | name, specialty_id (FK), schedule_config | 🔄 AJUSTAR |
| `professional_schedules` | weekday, start_time, end_time, slot_duration | ✅ OK |
| `appointments` | patient_id, professional_id, scheduled_at, status | ✅ OK |
| `knowledge_base` | content, embedding, metadata | ✅ OK |
| `leads` | name, phone, status | ✅ OK |
| `servicos` | name, specialty_id (FK), active | 🔄 AJUSTAR |

### ⚠️ Ajuste de Rota (28/01)
Identificamos lacunas estruturais que impedem o agendamento perfeito. Vamos pausar o fluxo n8n para:
1.  **DB:** Criar tabela `specialties` e chaves estrangeiras.
2.  **UI:** Criar cadastro de Especialidades e Carga Horária nos Profissionais.
3.  **n8n:** Implementar a nova sequência de 5 passos.

---

## 🎭 FLUXO CONVERSACIONAL DO AGENTE

### Personalidade do Agente
- **Nome:** Agente Virtual da [Nome da Empresa]
- **Tom:** Profissional, cordial, objetivo
- **Empresa:** Lida do campo `tenants.name` (ex: "Clínica Optus")
- **Segmento:** Adapta linguagem conforme `tenants.segment`

---

### 📞 SCRIPT DE ATENDIMENTO

#### 1. SAUDAÇÃO INICIAL
```
Olá! 👋 Sou o agente virtual da {tenant.name}.
Como posso te ajudar hoje?

1️⃣ Saber mais sobre nossos serviços
2️⃣ Agendar uma consulta/atendimento
```

---

#### 2. FLUXO "SABER MAIS" (RAG)
```
[Cliente escolhe opção 1]

📋 Nossos principais serviços são:
{lista de services/procedimentos do RAG ou professionals.services}

Ficou interessado em algum? Posso te passar mais detalhes ou agendar uma visita! 😊
```

**Loop:** Continua oferecendo informações até cliente querer agendar ou encerrar.

---

#### 3. FLUXO "AGENDAMENTO" (Sequência de 5 Passos 🚀)

##### 3.1 Escolha do Procedimento (Serviço)
```
[Cliente escolhe opção 2 ou pede para agendar]

Ótimo! Para qual procedimento você deseja agendar?
1. Consulta Eletiva
2. Unimed
3. Terapia
...
```

##### 3.2 Identificação da Especialidade
*(O sistema identifica a especialidade vinculada ao serviço escolhido internamente)*

##### 3.3 Escolha do Profissional
```
[Sistema lista profissionais daquela especialidade]

Temos os seguintes profissionais especialistas:
1. Dr. João (Cardiologia)
2. Dra. Maria (Cardiologia)

Com quem você prefere?
```

##### 3.4 Escolha de Horário (Grade do Profissional)
```
[Sistema busca a carga horária na professional_schedules]

📅 Horários de atendimento de {profissional}:
📍 Segunda e Quarta: 08:00 às 12:00
📍 Terça e Quinta: 14:00 às 18:00
```

##### 3.5 Verificação de Disponibilidade (Últimos 7 dias úteis)
```
[Sistema cruza Grade vs Appointments]

Estes são os horários livres nos próximos dias:
📍 Segunda (28/01): 09:00, 10:30
📍 Terça (29/01): 15:00, 16:00

Qual horário fica melhor para você?
```

##### 3.6 Coleta de Dados e Pré-cadastro
```
[Cliente escolhe horário]

Perfeito! Para confirmar seu agendamento, preciso de algumas informações para o seu pré-cadastro:

👤 Qual seu nome completo? (nome e sobrenome)
```
```
[Cliente informa nome]

📱 Qual seu número de telefone para contato?
(É importante para criarmos seu registro, mesmo que seja este mesmo número)
```
```
[Cliente informa telefone]

🎂 Qual sua data de nascimento?
```

> [!IMPORTANT]
> **Ação no Banco:** O sistema deve criar um registro na tabela `patients` com esses dados logo após a coleta para agilizar o atendimento futuro.

##### 3.7 Confirmação Final
```
[Dados coletados]

✅ Agendamento confirmado e pré-cadastro realizado com sucesso!

📋 Resumo:
👤 Nome: {nome}
📱 Telefone: {telefone}
🎂 Nascimento: {data_nascimento}
👨‍⚕️ Profissional: {profissional}
📅 Data/Hora: {data_hora}
🏥 Serviço: {servico}

Posso ajudar em mais alguma coisa? 😊
```

---

#### 4. CONFIRMAÇÃO 24H ANTES (Automático)
```
[24h antes do horário agendado - Enviado pelo Cron]

Olá {nome}! 👋

Lembrando que você tem um agendamento amanhã:
📅 {data}
⏰ {hora}
👨‍⚕️ {profissional}

Por favor, confirme:
1️⃣ Confirmar presença ✅
2️⃣ Cancelar ❌
3️⃣ Reagendar 🔄
```

**Respostas:**
- **Confirmar:** Atualiza status para `confirmed`
- **Cancelar:** Atualiza status para `cancelled`
- **Reagendar:** Reinicia fluxo de horários

---

#### 5. ENCAMINHAMENTO PARA HUMANO
```
[Quando IA não consegue resolver ou cliente pede]

Entendi! Vou transferir você para um de nossos atendentes humanos.
Por favor, aguarde um momento... 👤

{Atualiza lead.status = 'escalated'}
{Notifica atendente via webhook/email}
```

---

## 🏗️ ARQUITETURA TÉCNICA

### Fluxo no n8n

```
┌─────────────────────────────────────────────────────────────────────┐
│                         WEBHOOK                                     │
│                    /webhook/whatsapp-optus                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CODE: EXTRAIR DADOS                              │
│  • instanceName, chatId, contactPhone, messageText                  │
│  • Ignorar mensagens fromMe ou wasSentByApi                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 SUPABASE: IDENTIFICAR TENANT                        │
│  • Buscar tenant pela instância                                     │
│  • Carregar nome da empresa, segmento                               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│              SUPABASE: BUSCAR/CRIAR SESSÃO                          │
│  • Verificar se cliente já tem conversa ativa                       │
│  • Recuperar estado do fluxo (etapa atual)                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    AI AGENT (GPT-4.1-mini)                          │
│  • System prompt: "Você é o agente da {empresa}..."                 │
│  • Contexto: Estado atual do fluxo + histórico                      │
│  • Retorna: próxima ação + resposta                                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SWITCH: ROTEAR AÇÃO                              │
│  ├─ INFORMACAO → RAG Query → Responder                              │
│  ├─ AGENDAR → Listar serviços/profissionais/horários                │
│  ├─ COLETAR_DADOS → Salvar nome/telefone/nascimento                 │
│  ├─ CONFIRMAR → Criar appointment + patient                         │
│  ├─ ESCALAR → Notificar humano                                      │
│  └─ RESPONDER → Só envia mensagem                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│               SUPABASE: REGISTRAR MENSAGEM                          │
│  • Salvar em whatsapp_messages                                      │
│  • Atualizar lead                                                   │
│  • Atualizar sessão                                                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  HTTP: ENVIAR RESPOSTA                              │
│  • POST /send/text com token                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO (ATUALIZADO)

### 🔴 BLOCO 1: Infraestrutura de Sessão (Concluído) ✅
- [x] **1.1** Criar tabela `chat_sessions` para controle de estado ✅
- [x] **1.2** Adicionar `session_id` à tabela `whatsapp_messages` ✅
- [x] **1.3** Nó n8n: Buscar/criar sessão por chatId ✅

### 🔴 BLOCO 2: AI Agent Inteligente (Concluído) ✅
- [x] **2.1** System Prompt do AI Agent (Identificação Dinâmica) ✅
- [x] **2.2** Memória Persistente Postgres (Implementado pelo Usuário) ✅
- [x] **2.3** Correção de Loop (Automação em lib/uazapi.ts) ✅
- [ ] **2.4** Interpretar ação e atualizar estado da sessão (`current_step`)

- [x] **3.1** Nó: Listar serviços/procedimentos do tenant ✅
- [x] **UI:** Criar cadastro de Especialidades ✅
- [x] **UI:** Adicionar gestão de Carga Horária em Profissionais ✅
- [/] **3.2** Nó: Listar profissionais por especialidade 🔄
- [ ] **3.4** Nó: Coletar dados do paciente (nome, tel, nascimento)
- [ ] **3.5** Nó: Criar/atualizar paciente como pré-cadastro
- [ ] **3.6** Nó: Criar appointment

### 🔴 BLOCO 4: RAG para Informações (30min)
- [ ] **4.1** Nó: Gerar embedding da pergunta (OpenAI)
- [ ] **4.2** Nó: Buscar match_documents() no Supabase
- [ ] **4.3** Nó: Gerar resposta contextual

### 🟡 BLOCO 5: Confirmação 24h (30min)
- [ ] **5.1** Criar workflow Cron (06:00 diário)
- [ ] **5.2** Query agendamentos para amanhã
- [ ] **5.3** Enviar mensagem de confirmação
- [ ] **5.4** Processar resposta (confirmar/cancelar/reagendar)

### 🟡 BLOCO 6: Registro de Mensagens (30min)
- [ ] **6.1** Nó: Salvar mensagem recebida
- [ ] **6.2** Nó: Salvar mensagem enviada
- [ ] **6.3** Nó: Atualizar lead

### 🟢 BLOCO 7: Encaminhamento Humano (15min)
- [ ] **7.1** Nó: Detectar necessidade de escalonamento
- [ ] **7.2** Nó: Notificar atendente
- [ ] **7.3** Atualizar status do lead

---

## ⏰ CRONOGRAMA ATUALIZADO

| Hora | Bloco | Entrega |
|------|-------|---------|
| 10:15-10:45 | BLOCO 1 | Tabelas de sessão e mensagens |
| 10:45-11:45 | BLOCO 2 | AI Agent com contexto |
| 11:45-13:15 | BLOCO 3 | Fluxo de agendamento completo |
| 13:15-13:45 | BLOCO 4 | RAG funcionando |
| 13:45-14:15 | BLOCO 5 | Confirmação 24h |
| 14:15-14:45 | BLOCO 6 | Registro de mensagens |
| 14:45-15:00 | BLOCO 7 | Encaminhamento humano |
| 15:00+ | Testes | Validação completa |

---

## 🚀 PRÓXIMO PASSO IMEDIATO

**BLOCO 1.1:** Criar tabela `chat_sessions`:

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  chat_id TEXT NOT NULL,  -- WhatsApp chatId
  contact_phone TEXT,
  contact_name TEXT,
  current_step TEXT DEFAULT 'inicio',  -- inicio, escolha_servico, escolha_profissional, etc
  context JSONB DEFAULT '{}',  -- Dados coletados durante a conversa
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, chat_id)
);
```

---

**Aguardando aprovação para iniciar implementação!** 🚀
