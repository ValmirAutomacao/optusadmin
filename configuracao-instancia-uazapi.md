# Configuração de Instância Uazapi (Proxy Seguro)

Este documento descreve a arquitetura final utilizada para conectar a API Uazapi ao frontend de forma segura e resiliente, superando as falhas de autenticação JWT e headers.

## 🏗️ Arquitetura do Proxy

O frontend não chama a Uazapi diretamente para proteger o `ADMIN_TOKEN`. Todas as chamadas passam pela Edge Function `uazapi-proxy`.

### 🛡️ A Solução Definitiva (Versão 17)
O maior desafio foi o erro **"Invalid JWT"**. Descobrimos que o gateway do Supabase tentava validar o token do usuário como se fosse para a Uazapi, gerando conflitos.

**Ajustes Críticos Aplicados:**
1.  **Bypass de Gateway (`verify_jwt: false`)**: Configuramos a Edge Function para não validar o JWT automaticamente no nível de rede.
2.  **Autenticação Manual**: No início do código, validamos o usuário manualmente via `supabase.auth.getUser()`. Isso garante segurança sem interferir nos headers da Uazapi.
3.  **Limpeza de Headers**: Removemos o `Authorization: Bearer` antes de repassar a requisição. A Uazapi exige cabeçalhos específicos (`admintoken` para administração e `token` para instâncias).

## 🚩 Problemas Identificados e Superados

| Problema | Causa Raiz | Solução |
| :--- | :--- | :--- |
| **Erro 401 (Invalid JWT)** | O Supabase Gateway tentava validar o token antes do nosso código. | Desativar `verify_jwt` no deploy da função. |
| **AdminToken Missing** | A Uazapi não reconhece o padrão `Bearer` para o token admin. | Usar especificamente o header `admintoken` em minúsculas. |
| **Path Corrompido** | O prefixo `/functions/v1/uazapi-proxy` estava sendo enviado para a Uazapi. | Implementamos um parser de URL para extrair apenas o sub-caminho real (ex: `/instance/init`). |

## ✅ Checklist de Configuração Assertiva

1.  **Variáveis de Ambiente**:
    *   `UAZAPI_ADMIN_TOKEN`: Deve estar exatamente igual ao painel da Uazapi (sem espaços ou "Bearer").
    *   `UAZAPI_BASE_URL`: `https://optus.uazapi.com`
2.  **Headers no Frontend**:
    *   Sempre enviar o token do Supabase no `Authorization: Bearer`.
    *   Para operações de instância (como QR Code), enviar o token da instância no header `x-instance-token`.
3.  **Logs**: Em caso de falha, verifique o log da Edge Function. O código v17 loga o prefixo do token usado, facilitando a conferência do segredo configurado.
