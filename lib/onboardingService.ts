/**
 * Serviço de Onboarding
 * Gerencia o fluxo de convite e cadastro de usuários
 */

import { supabase } from './supabase';

const EMAIL_FROM = 'OptusAdmin <noreply@optuagentiasaas.shop>';
const APP_URL = import.meta.env.VITE_APP_URL || 'https://www.optuagentiasaas.shop';

export interface OnboardingData {
  tenantId: string;
  email: string;
  name: string;
  role: 'manager' | 'collaborator' | 'professional';
  token: string;
}

/**
 * Envia email via Edge Function (evita CORS)
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
        from: EMAIL_FROM
      }
    });

    if (error) {
      console.error('Erro ao enviar email via Edge Function:', error);
      return false;
    }

    console.log('Email enviado com sucesso:', data);
    return data?.success === true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Envia email de onboarding para gestor de tenant
 */
export async function sendManagerOnboardingEmail(data: {
  tenantName: string;
  managerName: string;
  managerEmail: string;
  token: string;
}): Promise<boolean> {
  const onboardingUrl = `${APP_URL}/onboarding/manager?token=${data.token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333; margin-top: 0; }
        .content p { color: #666; line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Bem-vindo ao OptusAdmin!</h1>
        </div>
        <div class="content">
          <h2>Olá, ${data.managerName}!</h2>
          <p>Sua empresa <strong>${data.tenantName}</strong> foi cadastrada no OptusAdmin.</p>
          <p>Você foi designado como gestor administrativo. Clique no botão abaixo para criar sua senha e começar a usar o sistema:</p>
          <p style="text-align: center;">
            <a href="${onboardingUrl}" class="button">Criar Minha Conta</a>
          </p>
          <p><small>Este link é válido por 7 dias.</small></p>
        </div>
        <div class="footer">
          <p>© 2026 OptusAdmin. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const sent = await sendEmail(
    data.managerEmail,
    `🎉 Bem-vindo ao OptusAdmin - ${data.tenantName}`,
    html
  );

  if (sent) {
    // Atualiza data de envio
    await supabase
      .from('tenants')
      .update({ onboarding_sent_at: new Date().toISOString() })
      .eq('onboarding_token', data.token);
  }

  return sent;
}

/**
 * Envia email de onboarding para colaborador
 */
export async function sendCollaboratorOnboardingEmail(data: {
  tenantName: string;
  name: string;
  email: string;
  role: string;
  token: string;
}): Promise<boolean> {
  const onboardingUrl = `${APP_URL}/onboarding/collaborator?token=${data.token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333; margin-top: 0; }
        .content p { color: #666; line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👋 Você foi convidado!</h1>
        </div>
        <div class="content">
          <h2>Olá, ${data.name}!</h2>
          <p>Você foi adicionado como <strong>${data.role}</strong> na empresa <strong>${data.tenantName}</strong>.</p>
          <p>Clique no botão abaixo para criar sua senha e acessar o sistema:</p>
          <p style="text-align: center;">
            <a href="${onboardingUrl}" class="button">Criar Minha Conta</a>
          </p>
          <p><small>Este link é válido por 7 dias.</small></p>
        </div>
        <div class="footer">
          <p>© 2026 OptusAdmin. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(data.email, `👋 Convite para ${data.tenantName}`, html);
}

/**
 * Envia email de onboarding para profissional
 */
export async function sendProfessionalOnboardingEmail(data: {
  tenantName: string;
  name: string;
  email: string;
  specialty: string;
  token: string;
}): Promise<boolean> {
  const onboardingUrl = `${APP_URL}/onboarding/professional?token=${data.token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 40px 30px; }
        .content h2 { color: #333; margin-top: 0; }
        .content p { color: #666; line-height: 1.6; }
        .button { display: inline-block; background: linear-gradient(135deg, #fc466b 0%, #3f5efb 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .footer { background: #f9f9f9; padding: 20px 30px; text-align: center; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🩺 Acesso Profissional</h1>
        </div>
        <div class="content">
          <h2>Olá, ${data.name}!</h2>
          <p>Você foi cadastrado como <strong>${data.specialty || 'Profissional'}</strong> na empresa <strong>${data.tenantName}</strong>.</p>
          <p>Clique no botão abaixo para criar sua senha e acessar sua agenda e atendimentos:</p>
          <p style="text-align: center;">
            <a href="${onboardingUrl}" class="button">Criar Minha Conta</a>
          </p>
          <p><small>Este link é válido por 7 dias.</small></p>
        </div>
        <div class="footer">
          <p>© 2026 OptusAdmin. Todos os direitos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail(data.email, `🩺 Acesso Profissional - ${data.tenantName}`, html);
}

/**
 * Valida token de onboarding
 */
export async function validateOnboardingToken(
  token: string,
  type: 'manager' | 'collaborator' | 'professional'
): Promise<{ valid: boolean; data?: Record<string, unknown> }> {
  let table = '';

  switch (type) {
    case 'manager':
      table = 'tenants';
      break;
    case 'collaborator':
      table = 'collaborators';
      break;
    case 'professional':
      table = 'professionals';
      break;
  }

  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('onboarding_token', token)
    .eq('onboarding_completed', false)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  return { valid: true, data };
}

/**
 * Completa o onboarding criando usuário no auth
 * NOTA: A confirmação de email do Supabase deve estar DESABILITADA nas configurações
 * do projeto ou configurada com "Confirm email = false" para este fluxo funcionar
 * sem enviar email de confirmação adicional.
 */
export async function completeOnboarding(data: {
  token: string;
  type: 'manager' | 'collaborator' | 'professional';
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  // Validar token
  const validation = await validateOnboardingToken(data.token, data.type);

  if (!validation.valid || !validation.data) {
    return { success: false, error: 'Token inválido ou expirado' };
  }

  const record = validation.data;
  const email = data.type === 'manager'
    ? (record.manager_email as string)
    : (record.email as string);
  const name = data.type === 'manager'
    ? (record.manager_name as string)
    : (record.name as string);
  const tenantId = data.type === 'manager'
    ? (record.id as string)
    : (record.tenant_id as string);

  // Criar usuário no auth (sem confirmação de email adicional)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: {
      emailRedirectTo: `${APP_URL}/`, // Redireciona para login após confirmação se necessário
      data: {
        name,
        role: data.type === 'manager' ? 'admin' : data.type,
        tenant_id: tenantId
      }
    }
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  // Se não confirmou automaticamente, ainda pode funcionar dependendo das configs do Supabase
  if (!authData.user) {
    return { success: false, error: 'Erro ao criar usuário. Verifique as configurações de confirmação de email.' };
  }

  // Criar perfil de usuário na tabela user_profiles
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      auth_id: authData.user.id,
      tenant_id: tenantId,
      email: email,
      name: name,
      role: data.type === 'manager' ? 'admin' : data.type,
      status: 'active'
    });

  if (profileError) {
    console.error('Erro ao criar perfil:', profileError);
    // Não retorna erro, pois o usuário foi criado no auth
  }

  // Atualizar registro de onboarding
  let table = '';
  switch (data.type) {
    case 'manager': table = 'tenants'; break;
    case 'collaborator': table = 'collaborators'; break;
    case 'professional': table = 'professionals'; break;
  }

  await supabase
    .from(table)
    .update({
      onboarding_completed: true,
      status: 'active',
      auth_id: authData.user.id
    })
    .eq('onboarding_token', data.token);

  return { success: true };
}
