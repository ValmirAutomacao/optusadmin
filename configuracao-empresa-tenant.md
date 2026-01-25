# Configuração de Empresa e Tenant (Onboarding)

Este documento detalha o processo de cadastro de novas empresas (tenants) e gestores, superando os obstáculos de autenticação e comunicação do Supabase.

## 🚀 Fluxo de Cadastro (Onboarding)

1.  **Formulário de Gestão**: No `MvpManagement.tsx`, o processo inicia com a criação do `tenant` (empresa) no banco de dados.
2.  **Criação do Usuário (Edge Function `create-user`)**:
    *   Para evitar conflitos com as configurações padrão do Supabase (como a necessidade de confirmar e-mail antes de logar), utilizamos a API Admin do Supabase dentro de uma Edge Function.
    *   A função `create-user` utiliza a `SERVICE_ROLE_KEY` para criar o usuário diretamente no Auth, ignorando proteções de e-mail pendente.
3.  **Geração de Fluxo de Senha**:
    *   Em vez de um simples e-mail de boas-vindas, geramos um link de "Recuperação de Senha" (`recovery link`) ou "Convite" via `supabase.auth.admin.generateLink`.
    *   Isso garante que o usuário receba um e-mail com um token válido para definir sua senha inicial e entrar no sistema já autenticado.

## ⚠️ Obstáculos Superados

### 1. Conflito de Validação de E-mail
*   **Problema**: Por padrão, o Supabase bloqueia o acesso de novos usuários até que eles cliquem em um link de confirmação enviado pelo sistema. Isso quebrava o fluxo de onboarding fluido.
*   **Solução**: Desativamos o uso do fluxo de e-mail automático do Supabase para este processo. Criamos a Edge Function `send-email` que utiliza o provedor configurado (Resend/SMTP) para enviar um e-mail personalizado com as instruções e o link gerado manualmente.

### 2. Políticas de RLS (Row Level Security)
*   **Problema**: Usuários novos não conseguiam ler seus próprios dados de perfil no momento do primeiro login porque a tabela `users` estava protegida.
*   **Solução**: Ajustamos as políticas RLS para permitir que:
    *   Usuários autenticados possam ler seu próprio perfil (baseado no `auth_id`).
    *   O processo de onboarding tenha permissão de inserção inicial monitorada pelo servidor.

## 🛠️ Como Proceder para Sucesso de Primeira

1.  **Configurar Segredos**: Certifique-se que o Supabase tenha as variáveis `RESEND_API_KEY` (se usar Resend) ou configurações de SMTP ativas.
2.  **Edge Functions**: Deploye sempre as funções `create-user` e `send-email` juntas.
3.  **Tenant ID**: O `tenant_id` deve ser gerado no banco ANTES da chamada de criação do usuário para que o vínculo seja imediato.
4.  **Admin Login**: O gestor deve entrar pelo link enviado por e-mail para que a sessão seja estabelecida corretamente.
