// Sistema de Limites de Conexões WhatsApp
import React from 'react';
import { supabase } from './supabase';

// Types para o sistema de limites
interface TenantConnectionInfo {
  tenant_id: string;
  whatsapp_connection_limit: number;
  whatsapp_connections_used: number;
  can_create_more: boolean;
  remaining_connections: number;
}

interface ConnectionAttemptResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limit?: number;
  remaining?: number;
}

// Classe para gerenciar limites de conexões
export class ConnectionLimitService {

  /**
   * Verificar se tenant pode criar nova conexão
   */
  static async canCreateConnection(tenantId?: string): Promise<ConnectionAttemptResult> {
    try {
      let targetTenantId = tenantId;

      // Se não passou tenant_id, pegar do usuário atual
      if (!targetTenantId) {
        targetTenantId = await this.getCurrentTenantId();
      }

      // Consultar informações do tenant
      const { data: tenantInfo, error } = await supabase
        .from('tenants')
        .select('id, whatsapp_connection_limit, whatsapp_connections_used')
        .eq('id', targetTenantId)
        .single();

      if (error) {
        console.error('Erro ao consultar tenant:', error);
        return {
          allowed: false,
          reason: 'Erro ao verificar limite de conexões'
        };
      }

      if (!tenantInfo) {
        return {
          allowed: false,
          reason: 'Tenant não encontrado'
        };
      }

      const limit = tenantInfo.whatsapp_connection_limit || 2; // Padrão 2
      const used = tenantInfo.whatsapp_connections_used || 0;
      const remaining = limit - used;

      // Verificar se pode criar
      if (used >= limit) {
        // Registrar tentativa bloqueada
        await this.logBlockedAttempt(targetTenantId);

        return {
          allowed: false,
          reason: `Limite de conexões atingido (${used}/${limit}). Upgrade necessário.`,
          currentUsage: used,
          limit: limit,
          remaining: 0
        };
      }

      return {
        allowed: true,
        currentUsage: used,
        limit: limit,
        remaining: remaining
      };

    } catch (error) {
      console.error('Erro ao verificar limite de conexões:', error);
      return {
        allowed: false,
        reason: 'Erro interno ao verificar limite'
      };
    }
  }

  /**
   * Obter informações detalhadas do tenant
   */
  static async getTenantConnectionInfo(tenantId?: string): Promise<TenantConnectionInfo | null> {
    try {
      let targetTenantId = tenantId;

      if (!targetTenantId) {
        targetTenantId = await this.getCurrentTenantId();
      }

      // Buscar informações atualizadas
      const { data, error } = await supabase
        .rpc('count_tenant_whatsapp_connections', { p_tenant_id: targetTenantId });

      if (error) {
        console.error('Erro ao contar conexões:', error);
        return null;
      }

      const actualCount = data || 0;

      // Buscar dados do tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('id, whatsapp_connection_limit, whatsapp_connections_used')
        .eq('id', targetTenantId)
        .single();

      if (tenantError || !tenantData) {
        console.error('Erro ao buscar tenant:', tenantError);
        return null;
      }

      const limit = tenantData.whatsapp_connection_limit || 2;
      const remaining = Math.max(0, limit - actualCount);

      return {
        tenant_id: targetTenantId,
        whatsapp_connection_limit: limit,
        whatsapp_connections_used: actualCount,
        can_create_more: actualCount < limit,
        remaining_connections: remaining
      };

    } catch (error) {
      console.error('Erro ao obter info do tenant:', error);
      return null;
    }
  }

  /**
   * Atualizar limite de um tenant (apenas para admins)
   */
  static async updateTenantLimit(tenantId: string, newLimit: number): Promise<boolean> {
    try {
      // Verificar se usuário é admin/developer
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Erro ao verificar permissões');
      }

      if (!['developer', 'admin', 'system_owner'].includes(userData.role)) {
        throw new Error('Permissão negada');
      }

      // Atualizar limite
      const { error } = await supabase
        .from('tenants')
        .update({ whatsapp_connection_limit: newLimit })
        .eq('id', tenantId);

      if (error) {
        console.error('Erro ao atualizar limite:', error);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Erro ao atualizar limite do tenant:', error);
      return false;
    }
  }

  /**
   * Listar logs de tentativas bloqueadas
   */
  static async getBlockedAttempts(tenantId?: string, limit: number = 50) {
    try {
      let targetTenantId = tenantId;

      if (!targetTenantId) {
        targetTenantId = await this.getCurrentTenantId();
      }

      const { data, error } = await supabase
        .from('connection_limit_logs')
        .select(`
          *,
          users(name, email)
        `)
        .eq('tenant_id', targetTenantId)
        .order('blocked_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Erro ao buscar logs:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Erro ao obter logs bloqueados:', error);
      return [];
    }
  }

  /**
   * Registrar tentativa bloqueada
   */
  private static async logBlockedAttempt(tenantId: string) {
    try {
      await supabase.rpc('log_blocked_connection_attempt', {
        p_tenant_id: tenantId
      });
    } catch (error) {
      console.error('Erro ao registrar tentativa bloqueada:', error);
      // Não falhar a operação principal por causa do log
    }
  }

  /**
   * Obter tenant ID do usuário atual
   */
  private static async getCurrentTenantId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { data: userData, error } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('auth_id', user.id)
      .single();

    if (error) throw error;
    return userData.tenant_id;
  }
}

// Hook React para usar o sistema de limites
export const useConnectionLimits = () => {
  const [connectionInfo, setConnectionInfo] = React.useState<TenantConnectionInfo | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadConnectionInfo = async () => {
    setLoading(true);
    try {
      const info = await ConnectionLimitService.getTenantConnectionInfo();
      setConnectionInfo(info);
    } catch (error) {
      console.error('Erro ao carregar info de conexões:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanCreate = async () => {
    return await ConnectionLimitService.canCreateConnection();
  };

  React.useEffect(() => {
    loadConnectionInfo();
  }, []);

  return {
    connectionInfo,
    loading,
    loadConnectionInfo,
    checkCanCreate
  };
};

// Export tipos
export type { TenantConnectionInfo, ConnectionAttemptResult };