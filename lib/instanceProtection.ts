// 🛡️ SISTEMA DE PROTEÇÃO DE INSTÂNCIAS CRÍTICAS
// Este arquivo implementa blindagem total contra operações perigosas

import { supabase } from './supabase';

// Instâncias PROTEGIDAS - NUNCA TOCAR!
const PROTECTED_INSTANCES = {
  // Cliente grande - WEBLOCAÇÃO
  'r9b63a61541c8a6': {
    name: 'relatorio_diario',
    client: 'WEBLOCAÇÃO - MKL IT SOLUTIONS',
    level: 'CRITICAL',
    reason: 'Cliente VIP em produção - ALTO RISCO FINANCEIRO'
  }
} as const;

// Types para o sistema de proteção
interface ProtectedInstance {
  uazapi_instance_id: string;
  instance_name: string;
  client_info: string;
  protection_level: 'CRITICAL' | 'HIGH' | 'NORMAL';
  protection_reason: string;
}

interface OperationResult {
  allowed: boolean;
  reason?: string;
  protectionLevel?: string;
  clientInfo?: string;
}

// Classe principal de proteção
export class InstanceProtectionService {

  /**
   * 🛡️ VERIFICAÇÃO PRINCIPAL - NUNCA PULE ESTA VERIFICAÇÃO!
   */
  static async isInstanceProtected(instanceId: string): Promise<OperationResult> {
    try {
      // 1. Verificação hard-coded (primeira barreira)
      if (instanceId in PROTECTED_INSTANCES) {
        const instance = PROTECTED_INSTANCES[instanceId as keyof typeof PROTECTED_INSTANCES];

        await this.logOperation(instanceId, 'PROTECTION_CHECK', true, {
          hard_coded_match: true,
          protection_info: instance
        });

        return {
          allowed: false,
          reason: `INSTÂNCIA PROTEGIDA: ${instance.reason}`,
          protectionLevel: instance.level,
          clientInfo: instance.client
        };
      }

      // 2. Verificação no banco (segunda barreira)
      const { data: protectedInstance, error } = await supabase
        .from('protected_instances')
        .select('*')
        .eq('uazapi_instance_id', instanceId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erro ao verificar proteção:', error);
        // Em caso de erro, BLOQUEAR por segurança
        return {
          allowed: false,
          reason: 'ERRO NA VERIFICAÇÃO DE PROTEÇÃO - OPERAÇÃO BLOQUEADA POR SEGURANÇA'
        };
      }

      if (protectedInstance) {
        await this.logOperation(instanceId, 'PROTECTION_CHECK', true, {
          database_match: true,
          protection_info: protectedInstance
        });

        return {
          allowed: false,
          reason: `INSTÂNCIA PROTEGIDA NO BANCO: ${protectedInstance.protection_reason}`,
          protectionLevel: protectedInstance.protection_level,
          clientInfo: protectedInstance.client_info
        };
      }

      // 3. Instância não protegida
      await this.logOperation(instanceId, 'PROTECTION_CHECK', false, {
        result: 'not_protected'
      });

      return { allowed: true };

    } catch (error) {
      console.error('ERRO CRÍTICO na verificação de proteção:', error);

      // EM CASO DE ERRO, SEMPRE BLOQUEAR
      await this.logOperation(instanceId, 'PROTECTION_ERROR', true, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return {
        allowed: false,
        reason: 'ERRO CRÍTICO NA VERIFICAÇÃO - OPERAÇÃO BLOQUEADA'
      };
    }
  }

  /**
   * 🚨 VERIFICAÇÃO ANTES DE DELETAR - CAMADA EXTRA DE SEGURANÇA
   */
  static async canDeleteInstance(instanceId: string): Promise<OperationResult> {
    const protection = await this.isInstanceProtected(instanceId);

    if (!protection.allowed) {
      // Log da tentativa de delete bloqueada
      await this.logOperation(instanceId, 'DELETE_ATTEMPT_BLOCKED', true, {
        protection_reason: protection.reason,
        protection_level: protection.protectionLevel
      });

      throw new Error(`🚨 OPERAÇÃO BLOQUEADA: ${protection.reason}`);
    }

    return protection;
  }

  /**
   * ⚠️ VERIFICAÇÃO ANTES DE ALTERAR - PARA OPERAÇÕES SENSÍVEIS
   */
  static async canModifyInstance(instanceId: string): Promise<OperationResult> {
    const protection = await this.isInstanceProtected(instanceId);

    if (!protection.allowed) {
      await this.logOperation(instanceId, 'MODIFY_ATTEMPT_BLOCKED', true, {
        protection_reason: protection.reason,
        protection_level: protection.protectionLevel
      });

      throw new Error(`⚠️ MODIFICAÇÃO BLOQUEADA: ${protection.reason}`);
    }

    return protection;
  }

  /**
   * 📝 Sistema de logs para auditoria
   */
  private static async logOperation(
    instanceId: string,
    operation: string,
    wasBlocked: boolean,
    payload: any = {}
  ) {
    try {
      // Tentar obter informações do usuário atual
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.rpc('log_instance_operation', {
        p_instance_id: instanceId,
        p_operation: operation,
        p_blocked: wasBlocked,
        p_payload: payload
      });

    } catch (error) {
      console.error('Erro ao registrar log de proteção:', error);
      // Não falhar a operação por causa do log
    }
  }

  /**
   * 📊 Obter todas as instâncias protegidas
   */
  static async getProtectedInstances(): Promise<ProtectedInstance[]> {
    try {
      const { data, error } = await supabase
        .from('protected_instances')
        .select('*')
        .order('protection_level', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erro ao buscar instâncias protegidas:', error);
      return [];
    }
  }

  /**
   * 🔒 Adicionar instância à proteção
   */
  static async protectInstance(data: {
    uazapiInstanceId: string;
    instanceName: string;
    clientInfo: string;
    protectionLevel: 'CRITICAL' | 'HIGH' | 'NORMAL';
    reason: string;
  }): Promise<void> {
    const { data: result, error } = await supabase
      .from('protected_instances')
      .insert({
        uazapi_instance_id: data.uazapiInstanceId,
        instance_name: data.instanceName,
        client_info: data.clientInfo,
        protection_level: data.protectionLevel,
        protection_reason: data.reason
      });

    if (error) throw error;

    await this.logOperation(data.uazapiInstanceId, 'INSTANCE_PROTECTED', false, {
      protection_level: data.protectionLevel,
      reason: data.reason
    });
  }

  /**
   * 🛡️ MÉTODO WRAPPER PARA OPERAÇÕES SEGURAS
   * Use este método para QUALQUER operação que interaja com Uazapi
   */
  static async safeOperation<T>(
    instanceId: string,
    operationType: 'READ' | 'MODIFY' | 'DELETE',
    operation: () => Promise<T>
  ): Promise<T> {
    // Verificar proteção baseada no tipo de operação
    switch (operationType) {
      case 'DELETE':
        await this.canDeleteInstance(instanceId);
        break;
      case 'MODIFY':
        await this.canModifyInstance(instanceId);
        break;
      case 'READ':
        // Leitura é sempre permitida, mas logada
        await this.logOperation(instanceId, 'SAFE_READ', false);
        break;
    }

    // Executar operação se passou na verificação
    try {
      const result = await operation();

      await this.logOperation(instanceId, `${operationType}_SUCCESS`, false, {
        operation_completed: true
      });

      return result;
    } catch (error) {
      await this.logOperation(instanceId, `${operationType}_FAILED`, false, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}

// Export da instância protegida conhecida
export const CRITICAL_INSTANCE_ID = 'r9b63a61541c8a6';

// Função helper para verificação rápida
export const isProtectedInstance = (instanceId: string): boolean => {
  return instanceId in PROTECTED_INSTANCES;
};

// Hook para React components
export const useInstanceProtection = () => {
  const checkProtection = async (instanceId: string) => {
    return await InstanceProtectionService.isInstanceProtected(instanceId);
  };

  return { checkProtection, CRITICAL_INSTANCE_ID };
};