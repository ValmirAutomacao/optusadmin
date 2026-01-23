# Fases de Desenvolvimento - Optus Admin

## Status Atual do Projeto

### ✅ Implementado
- Estrutura base do projeto (React 19 + Vite + TypeScript)
- Banco de dados Supabase com tabelas fundamentais:
  - `tenants` (estabelecimentos)
  - `users` (usuários multi-role)
  - `profissionais` (prestadores de serviços)
  - `servicos` (catálogo de serviços)
  - `clientes` (CRM básico)
- Sistema de autenticação inicial
- Interface responsiva básica (Desktop/Mobile PWA)
- Row Level Security (RLS) configurado
- Migrations aplicadas

### ⚠️ Pendente/Incompleto
- Integração completa com Supabase Auth
- Módulos funcionais do sistema
- Interface de usuário funcional
- Integração n8n
- Automação WhatsApp

---

## FASE 1 - MVP CORE (4-6 semanas)
**Objetivo**: Sistema funcional básico para agendamento manual

### Sprint 1 - Fundações (1-2 semanas)
**Prioridade: CRÍTICA**

#### Frontend Base
- [ ] Sistema de autenticação completo com Supabase Auth
- [ ] Layout principal responsivo (sidebar, header, navegação)
- [ ] Componentes base (botões, inputs, modais, tabelas)
- [ ] Sistema de roteamento
- [ ] Estados globais (Context/Zustand)
- [ ] Tratamento de erros e loading states

#### Backend/Database
- [ ] Completar schema do banco (adicionar tabelas faltantes)
- [ ] Implementar triggers e functions necessárias
- [ ] Configurar policies RLS mais granulares
- [ ] Sistema de auditoria básico
- [ ] Validações de dados

#### Sistema Multi-tenant
- [ ] Middleware de tenant isolation
- [ ] Seletor/contexto de tenant
- [ ] Validações de acesso cruzado
- [ ] Dashboard inicial por tenant

### Sprint 2 - Cadastros Básicos (1 semana)
**Prioridade: CRÍTICA**

#### Módulos de Cadastro
- [ ] **Profissionais**: CRUD completo com especialidades e disponibilidade
- [ ] **Serviços**: CRUD com duração, preços e categorias
- [ ] **Clientes**: CRM básico com dados pessoais e contatos
- [ ] **Usuários**: Gestão de equipe com permissões por role

#### Funcionalidades
- [ ] Upload de imagens (avatar profissionais)
- [ ] Validação de CPF/CNPJ
- [ ] Máscaras de entrada para telefones/documentos
- [ ] Busca e filtros em listas
- [ ] Paginação

### Sprint 3 - Agendamento Core (2 semanas)
**Prioridade: CRÍTICA**

#### Calendário/Agenda
- [ ] **Visualização**: Calendário estilo Google Calendar (dia/semana/mês)
- [ ] **Criação**: Formulário de novo agendamento
- [ ] **Gestão**: Edição, cancelamento, reagendamento
- [ ] **Disponibilidade**: Sistema de horários livres/ocupados
- [ ] **Validações**: Conflitos de horário, limites de profissional

#### Funcionalidades Agendamento
- [ ] Seleção cliente → serviço → profissional → horário
- [ ] Status de agendamentos (agendado/confirmado/cancelado/concluído/faltou)
- [ ] Filtros por profissional/serviço/período
- [ ] Lista de agendamentos do dia
- [ ] Busca rápida de agendamentos

### Sprint 4 - Atendimento e WhatsApp Básico (1 semana)
**Prioridade: ALTA**

#### Módulo de Atendimento
- [ ] Check-in de clientes
- [ ] Visualização de agenda do dia por profissional
- [ ] Status de atendimento em tempo real
- [ ] Registro de observações básicas
- [ ] Histórico de atendimentos por cliente

#### WhatsApp Configuração
- [ ] **Configuração**: Cadastro de instância Uazapi
- [ ] **Teste**: Envio de mensagem simples
- [ ] **Confirmação**: Automação básica de confirmação de agendamento
- [ ] Interface de configuração WhatsApp

---

## FASE 2 - AUTOMAÇÃO E INTELIGÊNCIA (4-6 semanas)
**Objetivo**: Automação completa via WhatsApp com inteligência

### Sprint 5 - Integração n8n Base (2 semanas)
**Prioridade: ALTA**

#### Setup n8n
- [ ] **Configuração**: Conectar n8n com Supabase
- [ ] **Webhooks**: Bidirecionais (Supabase ↔ n8n)
- [ ] **Workflows básicos**: Confirmação automática
- [ ] **Monitoramento**: Logs de execução e erros

#### Automações Básicas
- [ ] Confirmação de agendamento via WhatsApp
- [ ] Lembrete 24h antes
- [ ] Lembrete no dia (2h antes)
- [ ] Notificação de cancelamento

### Sprint 6 - RAG e Atendimento Inteligente (2 semanas)
**Prioridade: MÉDIA**

#### Base de Conhecimento
- [ ] **Setup RAG**: Integração com LLM no n8n
- [ ] **Conhecimento**: Base sobre serviços/profissionais/horários
- [ ] **FAQ**: Perguntas frequentes automáticas
- [ ] **Contexto**: Histórico do cliente

#### Atendimento Automatizado
- [ ] **Reconhecimento**: Identificação de intenções
- [ ] **Respostas**: Contextuais e personalizadas
- [ ] **Escalação**: Para humano quando necessário
- [ ] **Aprendizado**: Melhoria contínua das respostas

### Sprint 7 - Agendamento via WhatsApp (2 semanas)
**Prioridade: ALTA**

#### Agendamento Conversacional
- [ ] **Disponibilidade**: Consulta de horários vagos
- [ ] **Agendamento**: Criação via chat
- [ ] **Reagendamento**: Alteração via WhatsApp
- [ ] **Cancelamento**: Via conversa com confirmação

#### SDR Automatizado
- [ ] **Qualificação**: Novos clientes via WhatsApp
- [ ] **Cadastro**: Automático de leads
- [ ] **Nutrição**: Sequências de mensagens
- [ ] **Conversão**: Para agendamento

---

## FASE 3 - FINANCEIRO E GESTÃO (4 semanas)
**Objetivo**: Controle financeiro e operacional completo

### Sprint 8 - Módulo Financeiro (2 semanas)
**Prioridade: MÉDIA**

#### Sistema Financeiro
- [ ] **Transações**: CRUD de recebimentos e pagamentos
- [ ] **Formas de pagamento**: PIX, cartão, dinheiro, boleto
- [ ] **Caixa**: Abertura/fechamento diário
- [ ] **Contas a receber**: Controle de inadimplência

#### Gateway de Pagamento
- [ ] **Integração**: Com gateway (Stripe/PagSeguro/Mercado Pago)
- [ ] **Links**: Geração de links de pagamento
- [ ] **Webhooks**: Confirmação automática
- [ ] **Parcelamento**: Opções de divisão

### Sprint 9 - KPIs e Relatórios (2 semanas)
**Prioridade: BAIXA**

#### Dashboard Executivo
- [ ] **KPIs**: Métricas principais (ocupação, faturamento, etc.)
- [ ] **Gráficos**: Visualizações interativas
- [ ] **Filtros**: Por período, profissional, serviço
- [ ] **Export**: PDF/Excel de relatórios

#### Métricas Avançadas
- [ ] Taxa de ocupação da agenda
- [ ] Ticket médio por atendimento
- [ ] NPS e satisfação
- [ ] Análise de churn
- [ ] Projeções financeiras

---

## FASE 4 - GESTÃO COMERCIAL DO MVP (3-4 semanas)
**Objetivo**: Plataforma comercializável com gestão de clientes

### Sprint 10 - Módulo de Gestão do MVP (2 semanas)
**Prioridade: BAIXA**

#### Área do Owner
- [ ] **Dashboard**: KPIs globais da plataforma
- [ ] **Clientes**: Lista de tenants e status
- [ ] **Planos**: Criação e gestão de plans
- [ ] **Financeiro**: MRR, ARR, inadimplência

#### Onboarding Automatizado
- [ ] **Cadastro**: Formulário para novos tenants
- [ ] **Setup**: Token único de configuração
- [ ] **Email**: Automático de boas-vindas
- [ ] **Trial**: Período de teste configurável

### Sprint 11 - Gestão de Planos e Pagamentos (2 semanas)
**Prioridade: BAIXA**

#### Sistema de Planos
- [ ] **Limitações**: Por profissionais/usuários/agendamentos
- [ ] **Upgrade/Downgrade**: Automático de planos
- [ ] **Bloqueios**: Por inadimplência
- [ ] **Trial**: Gestão de períodos de teste

#### Cobrança de Tenants
- [ ] **Faturamento**: Automático por plano
- [ ] **Cobrança**: Via gateway integrado
- [ ] **Inadimplência**: Alertas e bloqueios
- [ ] **Relatórios**: Financeiros da plataforma

---

## CRONOGRAMA CONSOLIDADO

### Mês 1-2: FASE 1 - MVP CORE
- **Semanas 1-2**: Fundações + Auth
- **Semana 3**: Cadastros básicos
- **Semanas 4-5**: Sistema de agendamento
- **Semana 6**: Atendimento + WhatsApp básico

### Mês 3-4: FASE 2 - AUTOMAÇÃO
- **Semanas 7-8**: Integração n8n
- **Semanas 9-10**: RAG e inteligência
- **Semanas 11-12**: Agendamento via WhatsApp

### Mês 5: FASE 3 - FINANCEIRO
- **Semanas 13-14**: Módulo financeiro
- **Semanas 15-16**: KPIs e relatórios

### Mês 6: FASE 4 - COMERCIAL
- **Semanas 17-18**: Gestão do MVP
- **Semanas 19-20**: Planos e cobrança

---

## DEPENDÊNCIAS EXTERNAS

### Integrações Necessárias
1. **n8n Cloud**: Configuração na VPS Hostinger
2. **Uazapi**: API WhatsApp não oficial
3. **Gateway de Pagamento**: Escolha e configuração
4. **LLM API**: Para RAG (OpenAI/Anthropic/Google)
5. **Email Service**: Para onboarding (SendGrid/AWS SES)

### Infraestrutura
- [x] **Supabase**: Configurado e funcionando
- [ ] **n8n**: Deploy na VPS Hostinger
- [ ] **Domain/SSL**: Para webhooks seguros
- [ ] **CDN**: Para assets estáticos (opcional)

---

## RISCOS E MITIGAÇÕES

### Técnicos
- **Integração n8n**: Complexa → Testes incrementais, POCs
- **WhatsApp API**: Instabilidade → Fallback para SMS
- **Performance**: Grande volume → Otimizações, caching

### Produto
- **Scope creep**: Recursos desnecessários → Foco no MVP
- **UX complexa**: Interface confusa → Testes de usuário
- **Feedback tardio**: Sem validação → Releases frequentes

### Negócio
- **Concorrência**: Mercado competitivo → Diferenciação clara
- **Adoção**: Baixa aceitação → Marketing direcionado
- **Churn**: Alta rotatividade → Suporte proativo

---

## PRÓXIMOS PASSOS IMEDIATOS

### Semana Atual
1. **Finalizar Sprint 1**: Autenticação e layout base
2. **Setup Ambiente**: Configuração completa de desenvolvimento
3. **Definir Prioridades**: Validar roadmap com stakeholders
4. **Iniciar Sprint 2**: Módulos de cadastro

### Configurações Urgentes
- [ ] Configurar Supabase Auth adequadamente
- [ ] Implementar sistema de roteamento
- [ ] Criar components library básica
- [ ] Setup do n8n na VPS
- [ ] Testar conectividade Supabase ↔ n8n