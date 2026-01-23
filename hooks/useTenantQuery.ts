import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTenant } from '../contexts/TenantContext';

interface TenantQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export const useTenantQuery = <T = any>(options: TenantQueryOptions) => {
  const { currentTenant, canAccessTenant } = useTenant();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeQuery = async () => {
    if (!currentTenant) {
      setError('No tenant selected');
      return;
    }

    if (!canAccessTenant(currentTenant.id)) {
      setError('Access denied to tenant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from(options.table)
        .select(options.select || '*')
        .eq('tenant_id', currentTenant.id);

      // Aplicar filtros adicionais
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Aplicar ordenação
      if (options.orderBy) {
        query = query.order(options.orderBy.column, {
          ascending: options.orderBy.ascending ?? true
        });
      }

      // Aplicar limite
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      setData(result || []);
    } catch (err: any) {
      setError(err.message || 'Query failed');
      console.error('Tenant query error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentTenant) {
      executeQuery();
    }
  }, [currentTenant, options.table, JSON.stringify(options.filters)]);

  const refetch = () => {
    executeQuery();
  };

  return {
    data,
    loading,
    error,
    refetch,
    tenant: currentTenant
  };
};

// Hook específico para inserção com tenant
export const useTenantInsert = () => {
  const { currentTenant } = useTenant();

  const insert = async (table: string, data: any) => {
    if (!currentTenant) {
      throw new Error('No tenant selected');
    }

    const dataWithTenant = {
      ...data,
      tenant_id: currentTenant.id
    };

    const { data: result, error } = await supabase
      .from(table)
      .insert(dataWithTenant)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  };

  return { insert };
};

// Hook específico para atualização com verificação de tenant
export const useTenantUpdate = () => {
  const { currentTenant, canAccessTenant } = useTenant();

  const update = async (table: string, id: string, data: any) => {
    if (!currentTenant || !canAccessTenant(currentTenant.id)) {
      throw new Error('Access denied');
    }

    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .eq('tenant_id', currentTenant.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  };

  return { update };
};

// Hook específico para deleção com verificação de tenant
export const useTenantDelete = () => {
  const { currentTenant, canAccessTenant } = useTenant();

  const deleteRecord = async (table: string, id: string) => {
    if (!currentTenant || !canAccessTenant(currentTenant.id)) {
      throw new Error('Access denied');
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('tenant_id', currentTenant.id);

    if (error) {
      throw error;
    }

    return true;
  };

  return { deleteRecord };
};