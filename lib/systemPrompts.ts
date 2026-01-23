// Sistema de Prompts Centralizados para Owner/Developer
import { supabase } from './supabase';

// Types para o sistema de prompts
interface SystemPrompt {
  id: string;
  name: string;
  version: string;
  system_prompt: string;
  variables: string[];
  description?: string;
  active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

interface PromptUsageLog {
  id: string;
  prompt_id: string;
  tenant_id: string;
  whatsapp_instance_id?: string;
  used_at: string;
  variables_used: Record<string, any>;
  final_prompt: string;
}

interface TenantPromptData {
  empresa_nome?: string;
  area_atuacao?: string;
  servicos_disponiveis?: string;
  endereco_empresa?: string;
  telefone_empresa?: string;
  horario_funcionamento?: string;
}

interface ProcessedPrompt {
  prompt_id: string;
  final_prompt: string;
  variables_replaced: Record<string, any>;
}

// Classe principal para gerenciamento de prompts
export class SystemPromptService {

  /**
   * 📝 Listar todos os prompts (apenas developer)
   */
  static async listAllPrompts(): Promise<SystemPrompt[]> {
    try {
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erro ao listar prompts:', error);
      throw error;
    }
  }

  /**
   * ✅ Obter prompt ativo
   */
  static async getActivePrompt(): Promise<SystemPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Erro ao obter prompt ativo:', error);
      return null;
    }
  }

  /**
   * 🆕 Criar novo prompt (apenas developer)
   */
  static async createPrompt(data: {
    name: string;
    system_prompt: string;
    description?: string;
    variables?: string[];
    version?: string;
  }): Promise<SystemPrompt> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data: promptData, error } = await supabase
        .from('system_prompts')
        .insert({
          name: data.name,
          system_prompt: data.system_prompt,
          description: data.description,
          variables: data.variables || [],
          version: data.version || '1.0.0',
          created_by: user.id,
          updated_by: user.id,
          active: false // Novo prompt sempre inativo inicialmente
        })
        .select()
        .single();

      if (error) throw error;
      return promptData;

    } catch (error) {
      console.error('Erro ao criar prompt:', error);
      throw error;
    }
  }

  /**
   * ✏️ Atualizar prompt existente (apenas developer)
   */
  static async updatePrompt(id: string, updates: Partial<{
    system_prompt: string;
    description: string;
    variables: string[];
    version: string;
  }>): Promise<SystemPrompt> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('system_prompts')
        .update({
          ...updates,
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Erro ao atualizar prompt:', error);
      throw error;
    }
  }

  /**
   * 🎯 Ativar prompt (apenas developer)
   */
  static async activatePrompt(id: string): Promise<SystemPrompt> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('system_prompts')
        .update({
          active: true,
          updated_by: user.id
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (error) {
      console.error('Erro ao ativar prompt:', error);
      throw error;
    }
  }

  /**
   * 🗑️ Deletar prompt (apenas developer)
   */
  static async deletePrompt(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;

    } catch (error) {
      console.error('Erro ao deletar prompt:', error);
      throw error;
    }
  }

  /**
   * 🏢 Obter prompt processado para tenant específico
   */
  static async getPromptForTenant(tenantId: string, data: TenantPromptData): Promise<ProcessedPrompt | null> {
    try {
      const { data: result, error } = await supabase
        .rpc('get_active_prompt_for_tenant', {
          p_tenant_id: tenantId,
          p_empresa_nome: data.empresa_nome || null,
          p_area_atuacao: data.area_atuacao || null,
          p_servicos_disponiveis: data.servicos_disponiveis || null,
          p_endereco_empresa: data.endereco_empresa || null,
          p_telefone_empresa: data.telefone_empresa || null,
          p_horario_funcionamento: data.horario_funcionamento || null
        });

      if (error) throw error;
      if (!result || result.length === 0) return null;

      return result[0];

    } catch (error) {
      console.error('Erro ao processar prompt para tenant:', error);
      return null;
    }
  }

  /**
   * 📊 Obter logs de uso dos prompts
   */
  static async getUsageLogs(tenantId?: string, limit: number = 50): Promise<PromptUsageLog[]> {
    try {
      let query = supabase
        .from('system_prompt_usage_logs')
        .select('*')
        .order('used_at', { ascending: false })
        .limit(limit);

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Erro ao obter logs de uso:', error);
      return [];
    }
  }

  /**
   * 🔍 Buscar prompt por nome
   */
  static async findPromptByName(name: string): Promise<SystemPrompt | null> {
    try {
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('name', name)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;

    } catch (error) {
      console.error('Erro ao buscar prompt por nome:', error);
      return null;
    }
  }

  /**
   * 🔄 Duplicar prompt existente (para criar nova versão)
   */
  static async duplicatePrompt(id: string, newName: string, newVersion: string): Promise<SystemPrompt> {
    try {
      // Buscar prompt original
      const { data: original, error: fetchError } = await supabase
        .from('system_prompts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Criar cópia
      return await this.createPrompt({
        name: newName,
        system_prompt: original.system_prompt,
        description: `${original.description} (cópia de ${original.name})`,
        variables: original.variables,
        version: newVersion
      });

    } catch (error) {
      console.error('Erro ao duplicar prompt:', error);
      throw error;
    }
  }

  /**
   * 📈 Estatísticas de uso dos prompts
   */
  static async getPromptStats(promptId?: string) {
    try {
      let query = supabase
        .from('system_prompt_usage_logs')
        .select('prompt_id, used_at, tenant_id', { count: 'exact' });

      if (promptId) {
        query = query.eq('prompt_id', promptId);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      // Calcular estatísticas
      const stats = {
        total_uses: count || 0,
        unique_tenants: new Set(data?.map(log => log.tenant_id) || []).size,
        recent_uses: data?.filter(log => {
          const logDate = new Date(log.used_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return logDate > weekAgo;
        }).length || 0
      };

      return stats;

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { total_uses: 0, unique_tenants: 0, recent_uses: 0 };
    }
  }

  /**
   * 🔧 Validar sintaxe do prompt
   */
  static validatePrompt(prompt: string, variables: string[]): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Verificar tamanho mínimo
    if (prompt.length < 50) {
      errors.push('Prompt muito curto (mínimo 50 caracteres)');
    }

    // Verificar variáveis não utilizadas
    variables.forEach(variable => {
      if (!prompt.includes(`{${variable}}`)) {
        warnings.push(`Variável {${variable}} não utilizada no prompt`);
      }
    });

    // Verificar variáveis no prompt que não estão na lista
    const usedVariables = prompt.match(/\{([^}]+)\}/g) || [];
    usedVariables.forEach(variable => {
      const cleanVariable = variable.replace(/[{}]/g, '');
      if (!variables.includes(cleanVariable)) {
        errors.push(`Variável ${variable} usada no prompt mas não declarada na lista`);
      }
    });

    // Verificar estrutura básica
    if (!prompt.toLowerCase().includes('assistente') && !prompt.toLowerCase().includes('atendimento')) {
      warnings.push('Prompt pode não ter identificação clara de assistente virtual');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Hook React para usar sistema de prompts
export const useSystemPrompts = () => {
  const [prompts, setPrompts] = React.useState<SystemPrompt[]>([]);
  const [activePrompt, setActivePrompt] = React.useState<SystemPrompt | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loadPrompts = async () => {
    setLoading(true);
    try {
      const [allPrompts, active] = await Promise.all([
        SystemPromptService.listAllPrompts(),
        SystemPromptService.getActivePrompt()
      ]);
      setPrompts(allPrompts);
      setActivePrompt(active);
    } catch (error) {
      console.error('Erro ao carregar prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadPrompts();
  }, []);

  return {
    prompts,
    activePrompt,
    loading,
    loadPrompts,
    createPrompt: SystemPromptService.createPrompt,
    updatePrompt: SystemPromptService.updatePrompt,
    activatePrompt: SystemPromptService.activatePrompt,
    deletePrompt: SystemPromptService.deletePrompt
  };
};

// Importar React para o hook
import React from 'react';

// Export tipos
export type { SystemPrompt, TenantPromptData, ProcessedPrompt, PromptUsageLog };