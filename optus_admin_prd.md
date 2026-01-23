# PRD - Optus Admin MVP

## 1. Visão Geral do Produto

### 1.1 Nome do Produto
**Optus Admin** - Sistema de Agendamento e Gestão Multi-segmento

### 1.2 Descrição
O Optus Admin é uma plataforma SaaS multi-tenant de agendamento e gestão operacional para diversos segmentos (clínicas médicas, empresas de serviços, consultórios, etc.). O sistema integra agendamento inteligente, CRM, automação via WhatsApp com IA, gestão financeira e ferramentas de follow-up, utilizando a API Uazapi para WhatsApp e OpenRouter/OpenAI para processamento inteligente de mensagens com RAG.

### 1.3 Objetivo do MVP
Criar uma solução completa de agendamento e gestão que permita aos estabelecimentos gerenciar seus clientes, profissionais, serviços e agenda de forma integrada, com automação de atendimento via WhatsApp e gestão comercial para vendas de novas licenças.

---

## 2. Arquitetura do Sistema

### 2.1 Stack Tecnológico
React 19 + Vite + Tailwind + shadcn/ui + Capacitor 7 + Supabase
- **Frontend**: Interface web responsiva
- **Backend/Database**: Supabase (PostgreSQL + Authentication + Storage + Realtime)
- **WhatsApp**: API Uazapi (não-oficial) com chatbot nativo
- **Inteligência Artificial**: OpenRouter/OpenAI para processamento de mensagens
- **Pagamentos**: Gateway de pagamento integrado
- **Calendário**: Sistema próprio inspirado no Google Calendar

### 2.2 Modelo Multi-Tenant
O sistema opera em arquitetura multi-tenant onde:
- Cada cliente (estabelecimento) possui seu próprio tenant isolado
- Os dados são segregados por tenant_id em todas as tabelas
- A autenticação é centralizada no Supabase Authentication
- Cada tenant tem suas próprias configurações, profissionais, serviços e clientes

### 2.3 Integração WhatsApp + IA (✅ Implementado)
- API Uazapi para gestão de instâncias WhatsApp
- Criação automatizada com QR Code
- Sistema de proteção para instâncias críticas
- Chatbot com IA (OpenRouter/OpenAI)
- RAG (Retrieval-Augmented Generation) para respostas inteligentes
- Sistema de prompts centralizado para owner/developer
- Confirmações automáticas e lembretes

---

## 3. Módulos e Funcionalidades

### 3.1 Módulo de Gestão do MVP (Administração Principal)

#### 3.1.1 Objetivo
Área exclusiva do owner/developer para gerenciar clientes que contratam o Optus Admin, controlar planos, pagamentos e acessos.

#### 3.1.2 Funcionalidades

**Cadastro de Novos Clientes (Tenants)**
- Formulário de cadastro com dados do estabelecimento
- Campos: Nome empresarial, CNPJ/CPF, Email, Telefone, Endereço
- Seleção de plano contratado
- Ao finalizar cadastro, sistema gera:
  - Tenant_id único
  - Token de setup único e temporário
  - Envio automático de email de boas-vindas

**Fluxo de Onboarding do Cliente**
- Email contém link com token de setup
- Cliente acessa página de finalização de cadastro
- Define senha de acesso
- Sistema cria usuário no Supabase Authentication
- Associa usuário ao tenant correspondente
- Redireciona para área administrativa do tenant

**Gestão de Planos**
- Criação de diferentes planos (Básico, Profissional, Empresarial)
- Definição de limites por plano:
  - Número de profissionais
  - Número de usuários/secretárias
  - Quantidade de agendamentos mensais
  - Funcionalidades habilitadas
- Precificação e periodicidade (mensal, trimestral, anual)

**Controle Financeiro Centralizado**
- Visão geral de receita recorrente (MRR/ARR)
- Status de pagamentos de cada cliente
- Inadimplências e bloqueios automáticos
- Relatórios financeiros consolidados
- Histórico de transações por tenant

**Gestão de Acessos e Permissões**
- Ativação/desativação de tenants
- Upgrade/downgrade de planos
- Concessão de períodos de trial
- Bloqueio por inadimplência
- Log de acessos e atividades

**Dashboard Administrativo**
- KPIs globais: total de clientes ativos, MRR, churn rate
- Novos clientes no período
- Status de saúde dos tenants
- Alertas de pagamentos pendentes

---

### 3.2 Módulo Operacional (Área do Cliente/Tenant)

#### 3.2.1 Cadastro de Profissionais

**Objetivo**: Gerenciar profissionais que prestam serviços no estabelecimento.

**Funcionalidades**:
- Cadastro completo: Nome, CPF, Email, Telefone, Especialidade/Função
- Upload de foto de perfil
- Documentação profissional (CRM, CRP, registro de classe)
- Status: Ativo/Inativo
- Agenda individual por profissional
- Horários de trabalho personalizados
- Configuração de intervalo entre atendimentos
- Dias e horários de disponibilidade

**Relacionamentos**:
- Profissional vinculado ao tenant
- Profissional pode realizar múltiplos serviços
- Profissional tem agenda própria de disponibilidade
- Atendimentos associados ao profissional responsável

---

#### 3.2.2 Cadastro de Usuários (Secretárias/Atendentes)

**Objetivo**: Gerenciar usuários operacionais que acessam o sistema.

**Funcionalidades**:
- Cadastro: Nome, Email, Telefone, Cargo
- Níveis de permissão:
  - Administrador do tenant (acesso total)
  - Secretária (agendamento, atendimento, follow-up)
  - Financeiro (apenas módulo financeiro)
  - Visualizador (somente leitura)
- Senha de acesso gerenciada pelo Supabase Auth
- Ativação/desativação de usuários
- Log de atividades por usuário

**Relacionamentos**:
- Usuário vinculado ao tenant
- Permissões específicas por módulo
- Auditoria de ações realizadas

---

#### 3.2.3 Cadastro de Procedimentos e Serviços

**Objetivo**: Catalogar serviços oferecidos pelo estabelecimento.

**Funcionalidades**:
- Cadastro de serviços: Nome, Descrição, Duração, Valor
- Categorização (Consulta, Exame, Tratamento, etc.)
- Serviços podem ser executados por profissionais específicos
- Configuração de preparação necessária
- Tempo de duração estimado
- Preço por serviço
- Status: Ativo/Inativo
- Observações e instruções para o cliente

**Relacionamentos**:
- Serviço vinculado ao tenant
- Serviço pode ser realizado por múltiplos profissionais
- Agendamento vinculado a um serviço específico
- Financeiro registra valor do serviço no atendimento

---

#### 3.2.4 Módulo de Atendimento

**Objetivo**: Interface para realizar e acompanhar atendimentos presenciais ou virtuais.

**Funcionalidades**:
- Recepção de clientes (check-in)
- Visualização de agenda do dia por profissional
- Lista de atendimentos: Agendados, Em atendimento, Concluídos, Faltosos
- Registro de observações do atendimento
- Histórico completo de atendimentos do cliente
- Anexo de arquivos (exames, documentos)
- Status do atendimento: Aguardando, Em atendimento, Concluído, Cancelado
- Tempo de espera e tempo de atendimento
- Registro de procedimentos realizados
- Assinatura digital ou confirmação de presença

**Relacionamentos**:
- Atendimento vinculado ao agendamento
- Atendimento associado a cliente, profissional e serviço
- Histórico completo mantido no CRM
- Gera dados para KPIs e relatórios

---

#### 3.2.5 Módulo de Follow-Up

**Objetivo**: Acompanhamento pós-atendimento e gestão de relacionamento.

**Funcionalidades**:
- Lista de clientes que necessitam follow-up
- Agendamento de contatos de acompanhamento
- Registro de interações (ligação, WhatsApp, email)
- Lembretes automáticos de follow-up
- Status: Pendente, Em andamento, Concluído
- Notas e observações do acompanhamento
- Integração com WhatsApp para envio de mensagens
- Pesquisa de satisfação pós-atendimento
- Reagendamentos automáticos conforme necessidade
- Campanhas de retorno para procedimentos contínuos

**Relacionamentos**:
- Follow-up vinculado ao atendimento anterior
- Histórico de interações no CRM
- Pode gerar novo agendamento
- Alimenta métricas de retenção

---

#### 3.2.6 Módulo CRM

**Objetivo**: Gestão completa do relacionamento com clientes.

**Funcionalidades**:
- Cadastro completo de clientes: Nome, CPF/CNPJ, Email, Telefone, Data de nascimento
- Informações de contato e endereço completo
- Histórico completo de atendimentos
- Histórico de agendamentos (realizados, cancelados, faltosos)
- Notas e observações sobre o cliente
- Tags e categorização de clientes
- Anamnese e informações médicas/específicas (conforme segmento)
- Preferências de horário e profissional
- Documentos anexados
- Origem do cliente (indicação, mídia, busca orgânica)
- Status: Ativo, Inativo, Bloqueado
- Prontuário digital (para clínicas)
- Controle de consentimento LGPD
- Comunicações enviadas e recebidas
- Score de engajamento

**Relacionamentos**:
- Cliente vinculado ao tenant
- Cliente possui múltiplos agendamentos
- Cliente possui histórico de atendimentos
- Cliente vinculado a follow-ups
- Cliente possui transações financeiras

---

#### 3.2.7 Módulo de Agendamento

**Objetivo**: Sistema de agendamento completo estilo Google Calendar.

**Funcionalidades**:

**Visualização de Agenda**:
- Visualizações: Dia, Semana, Mês
- Calendário visual com horários ocupados e livres
- Cores diferentes por profissional ou tipo de serviço
- Filtros por profissional, serviço, status
- Busca rápida de agendamentos

**Criação de Agendamento**:
- Seleção de cliente (existente ou novo)
- Seleção de serviço
- Seleção de profissional
- Escolha de data e horário disponível
- Observações do agendamento
- Confirmação automática via WhatsApp
- Opção de agendamento recorrente
- Bloqueio automático do horário

**Abertura Semanal de Agenda**:
- Definição de horários disponíveis por profissional
- Configuração semanal recorrente
- Bloqueio de horários específicos
- Definição de intervalos entre atendimentos
- Exceções para feriados e folgas
- Capacidade máxima de atendimentos simultâneos

**Gestão de Agendamentos**:
- Reagendamento com notificação automática
- Cancelamento com registro de motivo
- Confirmação de presença
- Lista de espera para horários cancelados
- Notificações automáticas: Confirmação, lembrete 24h antes, lembrete no dia
- Status: Agendado, Confirmado, Aguardando, Em atendimento, Concluído, Cancelado, Faltou

**Criação de Eventos**:
- Eventos especiais (reuniões, treinamentos)
- Bloqueio de agenda para eventos
- Eventos com múltiplos participantes
- Eventos recorrentes
- Sincronização com profissionais envolvidos

**Relacionamentos**:
- Agendamento vinculado a cliente, profissional e serviço
- Agendamento gera atendimento ao ser confirmado
- Integração com n8n para automações de confirmação
- Alimenta dashboard de ocupação da agenda

---

#### 3.2.8 Área do Profissional

**Objetivo**: Interface dedicada para profissionais visualizarem e gerenciarem sua agenda.

**Funcionalidades**:
- Login específico para profissionais
- Visualização da própria agenda
- Detalhes dos agendamentos do dia
- Histórico de atendimentos realizados
- Perfil do cliente antes do atendimento
- Registro rápido de observações pós-atendimento
- Notificações de novos agendamentos
- Solicitação de bloqueio de horários
- Disponibilidade de horários para abertura de agenda
- Estatísticas pessoais (atendimentos realizados, avaliações)

**Relacionamentos**:
- Acesso restrito aos próprios agendamentos
- Visualização de clientes que serão atendidos
- Interface simplificada focada em operação diária

---

#### 3.2.9 Configuração de Instância WhatsApp

**Objetivo**: Gerenciar conexões com API do WhatsApp (Uazapi).

**Funcionalidades**:
- Cadastro de instâncias do WhatsApp
- Utilização da API oficial da Uazapi para criar instâncias
- Armazenamento de credenciais de API
- Registro do número de telefone vinculado
- QR Code para autenticação da instância
- Status de conexão: Conectado, Desconectado, Expirado
- Múltiplas instâncias por tenant (opcional)
- Teste de envio de mensagens
- Logs de mensagens enviadas e recebidas
- Webhook para recebimento de mensagens
- Configuração de mensagens automáticas (boas-vindas, ausência)

**Relacionamentos**:
- Instância vinculada ao tenant
- Webhook conectado ao n8n
- Mensagens sincronizadas com agendamentos e CRM

---

#### 3.2.10 Módulo Financeiro

**Objetivo**: Gestão financeira operacional do estabelecimento.

**Funcionalidades**:

**Recebimentos**:
- Registro de pagamentos de clientes
- Formas de pagamento: Dinheiro, PIX, Cartão, Boleto
- Integração com gateway de pagamento
- Geração de links de pagamento
- Confirmação automática de pagamentos
- Parcelamento de valores
- Registro de descontos e acréscimos

**Controle de Caixa**:
- Abertura e fechamento de caixa
- Lançamentos de entrada e saída
- Conciliação bancária
- Relatório de movimentação diária

**Contas a Receber**:
- Lista de valores pendentes por cliente
- Controle de inadimplência
- Envio de cobranças automáticas via WhatsApp
- Relatório de recebimentos

**Relatórios Financeiros**:
- Faturamento por período
- Faturamento por profissional
- Faturamento por serviço
- Análise de formas de pagamento
- Projeções e metas financeiras
- Gráficos de performance

**Relacionamentos**:
- Transações vinculadas ao cliente e agendamento
- Serviços possuem valor padrão
- Histórico financeiro completo no CRM
- Dados alimentam KPIs financeiros

---

#### 3.2.11 Gráficos e KPIs

**Objetivo**: Dashboard com métricas e indicadores de performance.

**KPIs Principais**:
- Total de agendamentos no período
- Taxa de ocupação da agenda
- Taxa de comparecimento vs. faltosos
- Taxa de cancelamento
- Tempo médio de atendimento
- Novos clientes no período
- Clientes recorrentes
- Ticket médio por atendimento
- Faturamento total e por período
- Faturamento por profissional
- Faturamento por serviço
- Taxa de conversão (atendimento para retorno)
- Net Promoter Score (NPS)
- Satisfação do cliente

**Visualizações**:
- Gráficos de linha (evolução temporal)
- Gráficos de barras (comparações)
- Gráficos de pizza (distribuições)
- Tabelas com rankings
- Filtros por período, profissional, serviço
- Exportação de relatórios em PDF/Excel

**Relacionamentos**:
- Dados agregados de todas as tabelas operacionais
- Atualização em tempo real com Supabase Realtime
- Histórico de métricas para análise de tendências

---

## 4. Integração WhatsApp e Automação n8n

### 4.1 Fluxo de Integração

**Cadastro de Novos Clientes via WhatsApp**:
- Cliente envia mensagem para o número do estabelecimento
- Mensagem é recebida via webhook no n8n
- n8n identifica novo contato (não cadastrado)
- Workflow de SDR inicia conversa automatizada
- Coleta informações: Nome, CPF (opcional), preferência de horário
- Utiliza RAG para responder dúvidas sobre serviços
- Oferece opções de agendamento
- Cria registro no CRM via API do Supabase
- Cliente é cadastrado automaticamente

**Agendamento via WhatsApp**:
- Cliente solicita agendamento
- n8n consulta disponibilidade no Supabase
- Apresenta horários disponíveis
- Cliente escolhe profissional, serviço e horário
- n8n cria agendamento no Supabase
- Sistema reflete agendamento no frontend em tempo real
- Confirmação enviada ao cliente via WhatsApp

**Reagendamento via WhatsApp**:
- Cliente solicita mudança de horário
- n8n identifica agendamento existente
- Consulta novos horários disponíveis
- Cliente escolhe novo horário
- n8n atualiza agendamento no Supabase
- Confirmação de reagendamento enviada
- Frontend atualizado em tempo real

**Cancelamento via WhatsApp**:
- Cliente solicita cancelamento
- n8n confirma cancelamento com cliente
- Registra motivo do cancelamento
- Atualiza status no Supabase
- Libera horário na agenda
- Confirmação enviada ao cliente
- Frontend reflete cancelamento

**Confirmação de Agendamento**:
- Sistema envia mensagem de confirmação após agendamento
- 24h antes: Lembrete automático com opções
  - Confirmar
  - Cancelar
  - Reagendar
- Cliente responde via botões interativos
- n8n processa resposta e atualiza Supabase
- Frontend reflete mudanças

**Exibição de Horários Vagos**:
- Cliente pergunta sobre disponibilidade
- n8n consulta agenda no Supabase
- Filtra por profissional e/ou serviço
- Retorna horários livres em formato amigável
- Cliente pode escolher diretamente

**Informações sobre Profissionais**:
- Cliente pergunta sobre profissionais
- n8n consulta cadastro de profissionais
- Retorna especialidades, disponibilidade
- Cliente pode filtrar por especialidade

### 4.2 RAG (Retrieval-Augmented Generation)

**Base de Conhecimento**:
- Informações sobre serviços oferecidos
- Políticas de cancelamento e reagendamento
- Horários de funcionamento
- Preparação para procedimentos
- Perguntas frequentes (FAQ)
- Informações sobre profissionais

**Funcionamento**:
- Cliente faz pergunta via WhatsApp
- n8n identifica que é uma consulta de informação
- RAG busca na base de conhecimento
- Gera resposta contextualizada
- Envia resposta ao cliente
- Registra interação no CRM

### 4.3 Sincronização Bidirecional

**Supabase → n8n**:
- Triggers do Supabase notificam n8n sobre mudanças
- Novos agendamentos disparam confirmação automática
- Cancelamentos disparam notificação ao cliente
- Alterações na agenda ativam workflows

**n8n → Supabase**:
- Ações do n8n criam/atualizam registros no Supabase
- Agendamentos criados via WhatsApp são inseridos
- Status de confirmação é atualizado
- Novos clientes são cadastrados

**Frontend ↔ Supabase (Realtime)**:
- Supabase Realtime mantém frontend sincronizado
- Mudanças no banco refletem instantaneamente na UI
- Agendamentos aparecem em tempo real no calendário
- Notificações de novos agendamentos para usuários logados

---

## 5. Arquitetura de Dados

### 5.1 Estrutura de Tabelas

A arquitetura do banco de dados segue o modelo multi-tenant com segregação total por tenant_id.

#### Tabelas Principais

**Tabela: tenants**
- Armazena informações dos clientes do Optus Admin
- Campos essenciais: id (UUID), nome_empresarial, cnpj_cpf, email, telefone, endereco_completo, plano_id, status (ativo/inativo/trial/bloqueado), data_criacao, data_vencimento_plano
- Relacionamento: 1 tenant possui N profissionais, N usuários, N clientes, N serviços, N agendamentos

**Tabela: planos**
- Define os planos comerciais disponíveis
- Campos: id, nome_plano, descricao, limite_profissionais, limite_usuarios, limite_agendamentos_mes, valor_mensal, valor_trimestral, valor_anual, funcionalidades_habilitadas (JSONB)
- Relacionamento: 1 plano possui N tenants

**Tabela: usuarios (Users/Auth)**
- Gerenciada pelo Supabase Authentication
- Campos customizados: tenant_id, tipo_usuario (owner/admin/secretaria/financeiro/profissional), nivel_permissao (JSONB), status
- Relacionamento: 1 usuário pertence a 1 tenant

**Tabela: profissionais**
- Armazena profissionais de cada estabelecimento
- Campos: id, tenant_id, nome, cpf, email, telefone, especialidade, foto_url, documentos (JSONB), status, horario_trabalho (JSONB com dias e horários), intervalo_entre_atendimentos (minutos)
- Relacionamento: 1 profissional pertence a 1 tenant, 1 profissional realiza N serviços, 1 profissional possui N agendamentos

**Tabela: servicos**
- Catálogo de serviços oferecidos
- Campos: id, tenant_id, nome, descricao, categoria, duracao_minutos, valor, preparacao_necessaria (texto), observacoes, status
- Relacionamento: 1 serviço pertence a 1 tenant, 1 serviço pode ser realizado por N profissionais, 1 serviço possui N agendamentos

**Tabela: profissionais_servicos**
- Relacionamento muitos-para-muitos entre profissionais e serviços
- Campos: profissional_id, servico_id, tenant_id
- Define quais profissionais podem realizar quais serviços

**Tabela: clientes**
- CRM completo dos clientes finais
- Campos: id, tenant_id, nome, cpf_cnpj, email, telefone, whatsapp, data_nascimento, endereco (JSONB), informacoes_medicas (JSONB), tags (array), origem, status, preferencias (JSONB com profissional preferido, horário preferido), consentimento_lgpd, data_cadastro
- Relacionamento: 1 cliente pertence a 1 tenant, 1 cliente possui N agendamentos, 1 cliente possui N atendimentos

**Tabela: agendamentos**
- Registro de todos os agendamentos
- Campos: id, tenant_id, cliente_id, profissional_id, servico_id, data_hora_inicio, data_hora_fim, status (agendado/confirmado/aguardando/em_atendimento/concluido/cancelado/faltou), observacoes, recorrencia (JSONB para agendamentos recorrentes), confirmado_em, cancelado_em, motivo_cancelamento, criado_por_usuario_id
- Relacionamento: 1 agendamento pertence a 1 tenant, 1 cliente, 1 profissional, 1 serviço

**Tabela: atendimentos**
- Registro de atendimentos realizados
- Campos: id, tenant_id, agendamento_id, cliente_id, profissional_id, servico_id, data_hora_inicio_real, data_hora_fim_real, observacoes, procedimentos_realizados (JSONB), arquivos_anexados (array de URLs), tempo_espera_minutos, assinatura_digital, status
- Relacionamento: 1 atendimento pertence a 1 agendamento, vinculado a cliente e profissional

**Tabela: follow_ups**
- Gestão de acompanhamentos pós-atendimento
- Campos: id, tenant_id, atendimento_id, cliente_id, usuario_responsavel_id, data_programada, tipo_contato (ligacao/whatsapp/email), status (pendente/em_andamento/concluido), notas, data_conclusao
- Relacionamento: 1 follow-up vinculado a 1 atendimento e 1 cliente

**Tabela: disponibilidade_profissionais**
- Configuração de horários de trabalho
- Campos: id, tenant_id, profissional_id, dia_semana (0-6), horario_inicio, horario_fim, ativo, data_vigencia_inicio, data_vigencia_fim
- Relacionamento: Define quando profissional está disponível

**Tabela: bloqueios_agenda**
- Bloqueios e eventos especiais
- Campos: id, tenant_id, profissional_id (null para bloqueio geral), data_hora_inicio, data_hora_fim, motivo, tipo (folga/feriado/evento/manutencao), recorrente
- Relacionamento: Bloqueia horários na agenda

**Tabela: eventos**
- Eventos criados no calendário
- Campos: id, tenant_id, titulo, descricao, data_hora_inicio, data_hora_fim, tipo, participantes (array de profissional_ids), local, cor, recorrencia (JSONB)
- Relacionamento: Eventos podem envolver múltiplos profissionais

**Tabela: instancias_whatsapp**
- Configuração de conexões WhatsApp
- Campos: id, tenant_id, nome_instancia, numero_telefone, api_key_uazapi, instance_id_uazapi, status_conexao, qr_code_url, webhook_url, data_ultima_conexao, configuracoes (JSONB)
- Relacionamento: 1 instância por tenant (ou N se permitir múltiplas)

**Tabela: mensagens_whatsapp**
- Log de mensagens enviadas/recebidas
- Campos: id, tenant_id, instancia_id, cliente_id, numero_telefone, tipo (enviada/recebida), conteudo, timestamp, status_entrega, contexto (agendamento/confirmacao/cobranca/follow-up)
- Relacionamento: Mensagens vinculadas a cliente e instância

**Tabela: transacoes_financeiras**
- Registro de movimentações financeiras
- Campos: id, tenant_id, cliente_id, agendamento_id, tipo (recebimento/pagamento), valor, forma_pagamento, status (pendente/confirmado/cancelado), data_vencimento, data_pagamento, desconto, acrescimo, observacoes, link_pagamento
- Relacionamento: Transações vinculadas a clientes e agendamentos

**Tabela: caixa**
- Controle de caixa diário
- Campos: id, tenant_id, usuario_id, data_abertura, data_fechamento, valor_abertura, valor_fechamento, status (aberto/fechado)
- Relacionamento: Movimentações financeiras vinculadas ao caixa

**Tabela: pagamentos_tenants**
- Controle de pagamentos dos clientes do Optus Admin
- Campos: id, tenant_id, plano_id, valor, data_vencimento, data_pagamento, status, forma_pagamento, nota_fiscal, periodo_referencia
- Relacionamento: Pagamentos do tenant para uso da plataforma

**Tabela: auditoria**
- Log de ações no sistema
- Campos: id, tenant_id, usuario_id, acao, tabela_afetada, registro_id, dados_anteriores (JSONB), dados_novos (JSONB), timestamp, ip_address
- Relacionamento: Rastreabilidade completa de mudanças

### 5.2 Relacionamentos Principais

**Multi-tenancy**:
- Todas as tabelas operacionais possuem tenant_id
- Queries sempre filtram por tenant_id
- Row Level Security (RLS) do Supabase força isolamento
- Índices compostos com tenant_id para performance

**Cascatas e Integridade**:
- Exclusão de tenant inativa todos os registros relacionados (soft delete)
- Exclusão de profissional mantém histórico mas impede novos agendamentos
- Cancelamento de agendamento não exclui registro, apenas muda status
- Atendimentos são imutáveis após conclusão

**Dados Temporais**:
- Todas as tabelas possuem created_at e updated_at
- Triggers automáticos atualizam timestamps
- Supabase Realtime notifica mudanças em tempo real

---

## 6. Fluxos de Trabalho Principais

### 6.1 Fluxo de Onboarding de Novo Tenant

1. Owner acessa módulo de Gestão do MVP
2. Preenche formulário de novo cliente
3. Seleciona plano contratado
4. Sistema gera tenant_id e token de setup
5. Email automático enviado com link de setup
6. Cliente acessa link, define senha
7. Supabase Authentication cria usuário
8. Usuário associado ao tenant como admin
9. Cliente redireccionado para dashboard do tenant
10. Tutorial de boas-vindas e configuração inicial
11. Cliente configura instância do WhatsApp
12. Cliente cadastra primeiro profissional e serviço
13. Sistema está pronto para uso

### 6.2 Fluxo de Agendamento Completo (Frontend)

1. Secretária/usuário acessa módulo de Agendamento
2. Seleciona ou cadastra cliente
3. Escolhe serviço desejado
4. Sistema filtra profissionais que realizam o serviço
5. Secretária escolhe profissional
6. Calendário exibe horários disponíveis do profissional
7. Secretária seleciona data e horário
8. Adiciona observações se necessário
9. Confirma agendamento
10. Sistema registra no Supabase
11. Trigger dispara webhook para n8n
12. n8n envia mensagem de confirmação via WhatsApp
13. Agendamento aparece no calendário em tempo real
14. Notificação enviada ao profissional

### 6.3 Fluxo de Agendamento via WhatsApp (Automação)

1. Cliente envia mensagem solicitando agendamento
2. Webhook entrega mensagem ao n8n
3. n8n identifica intenção de agendar (via RAG/NLP)
4. Verifica se cliente está cadastrado no CRM
   - Se não: Coleta dados e cadastra
   - Se sim: Prossegue
5. n8n pergunta qual serviço deseja
6. Cliente responde ou escolhe opção
7. n8n consulta profissionais que realizam o serviço
8. Apresenta opções de profissionais
9. Cliente escolhe profissional (ou aceita qualquer)
10. n8n consulta disponibilidade no Supabase
11. Retorna próximos horários disponíveis
12. Cliente escolhe data e horário
13. n8n valida disponibilidade em tempo real
14. Cria registro de agendamento no Supabase
15. Envia confirmação ao cliente com detalhes
16. Agendamento reflete no frontend instantaneamente
17. Lembrete automático agendado para 24h antes

### 6.4 Fluxo de Confirmação de Agendamento

1. Sistema identifica agendamentos para próximas 24h
2. Trigger ou cron job dispara n8n
3. n8n envia mensagem de lembrete via WhatsApp
4. Mensagem contém botões: Confirmar | Cancelar | Reagendar
5. Cliente clica em botão
6. n8n recebe callback da escolha
   - **Confirmar**: Atualiza status para "confirmado", envia confirmação
   - **Cancelar**: Coleta motivo, atualiza status, libera horário, confirma cancelamento
   - **Reagendar**: Inicia fluxo de reagendamento
7. Supabase é atualizado
8. Frontend reflete mudança em tempo real
9. Profissional recebe notificação da confirmação/alteração

### 6.5 Fluxo de Atendimento Presencial

1. Cliente chega ao estabelecimento
2. Secretária faz check-in no sistema
3. Status do agendamento muda para "aguardando"
4. Profissional visualiza na Área do Profissional
5. Profissional inicia atendimento
6. Status muda para "em atendimento"
7. Durante atendimento, profissional acessa histórico do cliente
8. Ao finalizar, profissional registra observações
9. Anexa arquivos se necessário
10. Marca atendimento como "concluído"
11. Sistema gera registro de atendimento vinculado ao agendamento
12. Financeiro registra pagamento ou gera cobrança
13. Follow-up automático é agendado se configurado
14. Cliente recebe agradecimento via WhatsApp
15. Sistema sugere próximo retorno se aplicável

### 6.6 Fluxo de Follow-Up

1. Sistema identifica atendimentos que necessitam follow-up
2. Cria registros na tabela de follow-ups
3. Usuário acessa módulo de Follow-Up
4. Visualiza lista de pendências
5. Seleciona cliente para contato
6. Acessa histórico completo do cliente
7. Realiza contato via WhatsApp, telefone ou email
8. Registra notas da conversa
9. Define ações: Reagendar, Marcar como concluído, Adiar follow-up
10. Sistema atualiza status
11. Se necessário, inicia novo agendamento
12. KPIs de retenção são atualizados

### 6.7 Fluxo de Cobrança e Pagamento

1. Atendimento é concluído
2. Sistema verifica se há pagamento registrado
3. Se não pago:
   - Gera transação financeira "pendente"
   - Se configurado, gera link de pagamento
   - Envia cobrança via WhatsApp
4. Cliente realiza pagamento
   - Via gateway: Confirmação automática via webhook
   - Presencial: Secretária registra manualmente
5. Status da transação muda para "confirmado"
6. Registro financeiro atualizado
7. Cliente recebe recibo/comprovante
8. Dados alimentam relatórios financeiros

### 6.8 Fluxo de Abertura Semanal de Agenda

1. Administrador/secretária acessa configuração de disponibilidade
2. Seleciona profissional
3. Define padrão semanal:
   - Dias da semana disponíveis
   - Horário de início e fim
   - Intervalo entre atendimentos
   - Horário de almoço/pausas
4. Sistema gera slots de horário automaticamente
5. Exceções podem ser configuradas (feriados, folgas)
6. Bloqueios específicos podem ser adicionados
7. Agenda fica disponível para agendamentos
8. Alterações refletem imediatamente no calendário
9. n8n sincroniza disponibilidade para consultas via WhatsApp

---

## 7. Segurança e Autenticação

### 7.1 Supabase Authentication

**Autenticação de Usuários**:
- Email e senha gerenciados pelo Supabase Auth
- Confirmação de email obrigatória
- Recuperação de senha via email
- Tokens JWT para autenticação de sessão
- Refresh tokens para manter sessão

**Níveis de Acesso**:
- Owner: Acesso total ao módulo de Gestão do MVP
- Admin do Tenant: Acesso total às funcionalidades operacionais
- Secretária: Acesso a agendamento, atendimento, CRM, follow-up
- Financeiro: Acesso apenas ao módulo financeiro e relatórios
- Profissional: Acesso à Área do Profissional
- Visualizador: Somente leitura

### 7.2 Row Level Security (RLS)

**Isolamento Multi-Tenant**:
- Políticas RLS garantem que cada tenant vê apenas seus dados
- Queries automáticas filtram por tenant_id do usuário autenticado
- Impossibilidade de acesso cruzado entre tenants
- Profissionais veem apenas seus próprios agendamentos na área restrita

**Políticas por Tabela**:
- SELECT: Usuário só acessa registros do próprio tenant
- INSERT: Registros criados com tenant_id do usuário
- UPDATE: Apenas registros do próprio tenant
- DELETE: Soft delete com validação de tenant

### 7.3 Segurança de APIs

**Webhooks n8n**:
- Assinatura de requisições com token secreto
- Validação de origem das requisições
- Rate limiting para prevenir abuso
- Logs de todas as interações

**API Uazapi**:
- Credenciais armazenadas de forma criptografada
- Tokens com expiração
- Rotação periódica de credenciais
- Validação de números de telefone

**Gateway de Pagamento**:
- Conformidade PCI-DSS
- Dados sensíveis não armazenados localmente
- Comunicação via HTTPS
- Webhooks assinados

### 7.4 Compliance LGPD

**Consentimento**:
- Registro de consentimento do cliente
- Opção de revogação de consentimento
- Finalidades claras para uso de dados
- Política de privacidade acessível

**Direitos do Titular**:
- Exportação de dados pessoais
- Exclusão de dados (direito ao esquecimento)
- Retificação de dados incorretos
- Portabilidade de dados

**Auditoria**:
- Log de todas as ações com dados pessoais
- Rastreamento de acessos
- Registro de compartilhamentos
- Relatórios de conformidade

---

## 8. Integrações e APIs

### 8.1 Integração n8n

**Webhooks de Entrada**:
- Mensagens WhatsApp recebidas
- Status de entrega de mensagens
- Confirmações de pagamento
- Eventos externos

**Webhooks de Saída (Triggers)**:
- Novo agendamento criado
- Agendamento modificado ou cancelado
- Cliente cadastrado
- Atendimento concluído
- Follow-up programado

**Workflows Principais**:
- SDR e qualificação de leads
- Confirmação automática de agendamentos
- Lembretes pré-atendimento
- Pesquisas de satisfação
- Campanhas de reativação
- Cobranças automatizadas

### 8.2 Integração Uazapi (WhatsApp)

**Funcionalidades**:
- Envio de mensagens de texto
- Envio de mensagens com mídia (imagens, PDFs)
- Mensagens com botões interativos
- Recebimento de mensagens
- Status de leitura
- Webhooks de eventos

**Casos de Uso**:
- Confirmações de agendamento
- Lembretes
- Cobranças
- Links de pagamento
- Pesquisas de satisfação
- Atendimento automatizado (bot)
- Comunicação com clientes

### 8.3 Integração Gateway de Pagamento

**Funcionalidades**:
- Geração de links de pagamento
- Processamento de cartões
- PIX
- Boletos
- Parcelamento
- Webhook de confirmação
- Estorno e cancelamento
- Relatórios de transações

**Fluxo**:
- Sistema gera link de pagamento
- Link enviado ao cliente via WhatsApp
- Cliente paga
- Gateway envia webhook de confirmação
- Sistema atualiza status da transação
- Cliente recebe comprovante

### 8.4 API Interna (Supabase)

**Endpoints Principais**:
- CRUD de todas as entidades (via Supabase auto-generated API)
- Consultas personalizadas via Functions
- Aggregações para dashboards
- Exportação de relatórios
- Importação de dados em lote

---

## 9. Performance e Escalabilidade

### 9.1 Otimizações de Banco de Dados

**Índices**:
- Índices compostos com tenant_id em todas as tabelas
- Índices em campos de busca frequente (cpf, email, telefone)
- Índices em datas para queries temporais
- Índices para ordenação de listas

**Particionamento**:
- Considerar particionamento por tenant_id para grandes volumes
- Arquivamento de dados antigos
- Tabelas históricas separadas

**Caching**:
- Cache de consultas frequentes (disponibilidade de agenda)
- Cache de configurações do tenant
- Invalidação automática em atualizações

### 9.2 Realtime e Sincronização

**Supabase Realtime**:
- Subscriptions para mudanças em agendamentos
- Notificações instantâneas de novos registros
- Atualização automática de dashboards
- Sincronização de múltiplos usuários visualizando mesma agenda

**Otimizações**:
- Subscriptions específicas por tenant
- Filtros para reduzir tráfego
- Debouncing de atualizações de UI

### 9.3 Escalabilidade

**Horizontal**:
- Supabase gerencia escalabilidade do banco
- n8n pode escalar com múltiplas instâncias
- Load balancing para frontend

**Vertical**:
- Upgrade de plano Supabase conforme crescimento
- Otimização de queries complexas
- Monitoramento de performance

---

## 10. Roadmap de Desenvolvimento

### 10.1 Fase 1 - MVP Core (Prioridade Máxima)

**Módulos Essenciais**:
1. Autenticação e gestão de tenants
2. Cadastro de profissionais
3. Cadastro de serviços
4. CRM básico (cadastro de clientes)
5. Agendamento (criação, visualização calendário)
6. Módulo de atendimento básico
7. Configuração de instância WhatsApp
8. Integração básica com n8n (confirmação de agendamentos)

**Entregáveis Fase 1**:
- Sistema funcional para agendamento manual
- Confirmações automáticas via WhatsApp
- Cadastros completos
- Interface responsiva básica

### 10.2 Fase 2 - Automação e Inteligência

**Funcionalidades**:
1. Agendamento completo via WhatsApp (RAG)
2. SDR automatizado para novos clientes
3. Follow-up estruturado
4. Abertura semanal de agenda
5. Reagendamento e cancelamento via WhatsApp
6. Área do profissional
7. Eventos e bloqueios de agenda

**Entregáveis Fase 2**:
- Automação completa de agendamentos
- Experiência conversacional via WhatsApp
- Gestão completa de agenda

### 10.3 Fase 3 - Financeiro e Gestão

**Funcionalidades**:
1. Módulo financeiro completo
2. Integração com gateway de pagamento
3. Controle de caixa
4. Contas a receber
5. Relatórios financeiros
6. Gráficos e KPIs
7. Dashboard executivo

**Entregáveis Fase 3**:
- Gestão financeira completa
- Métricas e indicadores
- Análise de performance

### 10.4 Fase 4 - Gestão Comercial do MVP

**Funcionalidades**:
1. Módulo de gestão do MVP
2. Cadastro de planos
3. Onboarding automatizado
4. Controle de pagamentos de tenants
5. Dashboard do owner
6. Gestão de acessos

**Entregáveis Fase 4**:
- Plataforma comercializável
- Gestão de clientes do Optus Admin
- Modelo de receita recorrente

---

## 11. Métricas de Sucesso

### 11.1 Métricas do Produto

**Adoção**:
- Número de tenants ativos
- Taxa de ativação (tenants que completam onboarding)
- Tempo médio para primeiro agendamento
- Tenants com WhatsApp integrado

**Engajamento**:
- Agendamentos criados por mês
- Taxa de agendamentos via WhatsApp vs. manual
- Usuários ativos diariamente
- Mensagens enviadas via WhatsApp

**Retenção**:
- Taxa de churn mensal
- NPS dos tenants
- Renovação de planos
- Upgrades de plano

**Performance**:
- Tempo médio de resposta do sistema
- Uptime da plataforma
- Taxa de sucesso de integrações
- Latência de sincronização Realtime

### 11.2 Métricas de Negócio

**Receita**:
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- ARPU (Average Revenue Per User)
- LTV (Lifetime Value)
- CAC (Customer Acquisition Cost)

**Crescimento**:
- Novos tenants por mês
- Taxa de crescimento MRR
- Expansão de receita (upsells)
- Receita por segmento

---

## 12. Considerações Finais

### 12.1 Diferenciais do Optus Admin

1. **Integração WhatsApp Nativa**: Automação completa de agendamento via canal preferido dos clientes
2. **Multi-segmento**: Flexibilidade para atender diversos tipos de negócio
3. **RAG Inteligente**: Atendimento automatizado com contexto e personalização
4. **Multi-tenant Robusto**: Isolamento total e segurança entre clientes
5. **Realtime**: Sincronização instantânea entre usuários e canais
6. **Gestão Comercial Integrada**: Plataforma pronta para comercialização

### 12.2 Próximos Passos

1. Validação do PRD com stakeholders
2. Definição de prioridades de desenvolvimento
3. Criação de protótipos de interface (wireframes)
4. Modelagem detalhada do banco de dados no Supabase
5. Configuração inicial do ambiente de desenvolvimento
6. Desenvolvimento iterativo seguindo roadmap
7. Testes de integração n8n + Supabase
8. Testes de usabilidade
9. Lançamento beta com clientes piloto
10. Iteração baseada em feedback
11. Lançamento oficial

### 12.3 Riscos e Mitigações

**Riscos Técnicos**:
- Complexidade da integração WhatsApp → Utilizar API estabelecida (Uazapi), testes extensivos
- Performance com grande volume → Otimização de queries, índices adequados, caching
- Sincronização Realtime → Testes de carga, fallbacks para polling

**Riscos de Produto**:
- Adoção baixa → Marketing direcionado, onboarding facilitado, trial gratuito
- Churn elevado → Suporte dedicado, monitoramento de satisfação, melhorias contínuas
- Concorrência → Diferenciação pela automação WhatsApp e multi-segmento

**Riscos Operacionais**:
- Disponibilidade da API WhatsApp → Múltiplos provedores, fallback para SMS
- Compliance LGPD → Consultoria jurídica, auditorias regulares
- Escalabilidade → Arquitetura cloud-native, monitoramento proativo

---

## 13. Glossário

- **Tenant**: Cliente que contrata o Optus Admin (estabelecimento)
- **Multi-tenant**: Arquitetura onde múltiplos clientes compartilham mesma infraestrutura com dados isolados
- **RAG**: Retrieval-Augmented Generation - técnica de IA que combina busca e geração de texto
- **SDR**: Sales Development Representative - automação de prospecção e qualificação
- **Webhook**: Notificação HTTP enviada automaticamente quando ocorre um evento
- **RLS**: Row Level Security - segurança a nível de linha no banco de dados
- **MRR**: Monthly Recurring Revenue - receita recorrente mensal
- **Uazapi**: Plataforma de API não oficial para WhatsApp
- **n8n**: Ferramenta de automação de workflows
- **Supabase**: Plataforma backend-as-a-service baseada em PostgreSQL

---

**Versão**: 1.0  
**Data**: Janeiro 2026  
**Autor**: Documentação Técnica Optus Admin  
**Status**: Em Revisão
