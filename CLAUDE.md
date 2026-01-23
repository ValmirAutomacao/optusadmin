# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

O Optus Admin é uma plataforma SaaS multi-tenant de agendamento e gestão operacional desenvolvida com React 19 + Vite + TypeScript + Supabase, destinada a diversos segmentos como clínicas médicas, empresas de serviços e consultórios.

### Stack Tecnológica
- **Frontend**: React 19 + Vite + TypeScript
- **Backend/Database**: Supabase (PostgreSQL + Authentication + Storage + Realtime)
- **WhatsApp**: API Uazapi (integração completa com chatbot nativo)
- **IA**: OpenRouter/OpenAI para processamento de mensagens e RAG
- **Responsive Design**: Componentes híbridos para desktop e mobile PWA

## Architecture

### Multi-Tenant Structure
O sistema opera com arquitetura multi-tenant onde cada cliente (estabelecimento) possui isolamento de dados através de `tenant_id`. Todas as operações devem sempre filtrar por tenant para garantir segurança de dados.

### Database Schema (Supabase)
Principais tabelas implementadas:
- `tenants`: Clientes do sistema (estabelecimentos)
- `users`: Usuários com diferentes roles (owner, admin, secretaria, etc.)
- `profissionais`: Profissionais que prestam serviços
- `servicos`: Catálogo de serviços oferecidos
- `clientes`: CRM de clientes finais

### Row Level Security (RLS)
Todas as tabelas possuem RLS habilitado. Sempre use políticas que garantam isolamento por tenant_id.

## Development Commands

### Build and Development
```bash
npm run dev          # Desenvolvimento local na porta 3000
npm run build        # Build para produção
npm run preview      # Preview da build
```

### Supabase Integration
- Use o MCP do Supabase disponível para interações com o banco
- Sempre que trabalhar com Supabase, utilize o MCP em vez de código direto
- Para migrations: use `mcp__supabase__apply_migration`
- Para queries: use `mcp__supabase__execute_sql`

## Code Organization

### Component Structure
```
components/
├── Login.tsx           # Componente de autenticação
├── DesktopDashboard.tsx # Dashboard para desktop
└── MobilePWA.tsx       # Interface mobile PWA
```

### Responsive Design Pattern
- `isMobile` state determina qual componente renderizar (baseado em window.innerWidth < 1024)
- Design híbrido: mesmo sistema com interfaces otimizadas

## Important Guidelines

### Multi-tenancy Requirements
1. **SEMPRE** filtrar queries por tenant_id
2. **NUNCA** permitir acesso cruzado entre tenants
3. Validar permissões de usuário antes de operações
4. Usar RLS policies adequadas

### Supabase MCP Integration
- **OBRIGATÓRIO**: Use MCPs do Supabase para todas as operações de banco
- Identifique problemas e ajuste antes de solicitar ajuda
- Se bloqueado por MCPs, pare e solicite orientação

### Data Management
- **EXCLUIR** dados mockados/localStorage quando solicitado
- Verificar e limpar dados antes de implementações
- Não usar PRD, epics ou stories no processo de refatoramento

### Development Priorities
Seguir as fases de desenvolvimento definidas no PRD:
1. **Fase 1**: MVP Core (cadastros básicos + agendamento)
2. **Fase 2**: Automação WhatsApp (Uazapi + IA) ✅ Implementado
3. **Fase 3**: Módulo financeiro
4. **Fase 4**: Gestão comercial do MVP

### Security Considerations
- Implementar autenticação via Supabase Auth
- Validar permissões por role de usuário
- Manter compliance LGPD
- Logs de auditoria para ações sensíveis

## Implemented Integrations

### WhatsApp Automation (Uazapi) ✅
- Criação automatizada de instâncias
- QR Code para conexão
- Sistema de proteção para instâncias críticas
- Chatbot com IA (OpenRouter/OpenAI)
- RAG com documentos da empresa
- Confirmações automáticas de agendamento
- Reagendamento/cancelamento via chat

### Payment Gateway
- Links de pagamento
- Confirmação via webhook
- Controle financeiro integrado

## Common Issues
1. **Tenant Isolation**: Sempre verificar se queries estão filtrando corretamente por tenant_id
2. **RLS Policies**: Certificar que políticas de segurança estão aplicadas
3. **MCP Access**: Se MCP do Supabase falhar, verificar configuração e conexão
4. **Mobile Responsiveness**: Testar comportamento em ambas as interfaces (desktop/mobile)

## Project Context
- Este é um MVP em desenvolvimento
- Dados de teste podem estar presentes mas devem ser limpos quando solicitado
- Foco atual na Fase 1 do roadmap (core functionality)
- Automações avançadas serão implementadas em fases posteriores