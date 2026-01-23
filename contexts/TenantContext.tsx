import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  active: boolean;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: any;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  switchTenant: (tenantId: string) => void;
  canAccessTenant: (tenantId: string) => boolean;
  isSystemOwner: boolean;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: React.ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Verifica se o usuário é system owner (developer role)
  const isSystemOwner = userProfile?.role === 'developer';

  useEffect(() => {
    if (userProfile) {
      initializeTenant();
    }
  }, [userProfile]);

  const initializeTenant = () => {
    setLoading(true);

    // Para developers (system owners), usar tenant master
    if (userProfile?.role === 'developer') {
      const masterTenant: Tenant = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Optus Admin - Master',
        domain: 'master.optusadmin.com',
        active: true,
        plan: 'enterprise',
        status: 'active',
        settings: {
          can_manage_all_tenants: true,
          bypass_restrictions: true
        }
      };

      setCurrentTenant(masterTenant);
      setAvailableTenants([masterTenant]);
    } else {
      // Para usuários normais, usar o tenant do perfil
      if (userProfile?.tenants) {
        const tenant: Tenant = {
          id: userProfile.tenants.id,
          name: userProfile.tenants.name,
          domain: userProfile.tenants.domain || '',
          active: userProfile.tenants.active ?? true,
          plan: userProfile.tenants.plan || 'basic',
          status: userProfile.tenants.status || 'active',
          settings: userProfile.tenants.settings || {}
        };

        setCurrentTenant(tenant);
        setAvailableTenants([tenant]);
      } else if (userProfile?.tenant_id) {
        // Fallback se os dados do tenant não estiverem incluídos
        const tenant: Tenant = {
          id: userProfile.tenant_id,
          name: 'Tenant Principal',
          domain: '',
          active: true,
          plan: 'basic',
          status: 'active',
          settings: {}
        };

        setCurrentTenant(tenant);
        setAvailableTenants([tenant]);
      }
    }

    setLoading(false);
  };

  const switchTenant = (tenantId: string) => {
    if (!isSystemOwner) {
      console.warn('Only system owners can switch tenants');
      return;
    }

    // TODO: Implementar switch de tenant para system owners
    // Por enquanto, apenas log
    console.log('Switching to tenant:', tenantId);
  };

  const canAccessTenant = (tenantId: string): boolean => {
    if (isSystemOwner) {
      return true; // System owners podem acessar qualquer tenant
    }

    // Usuários normais só podem acessar seu próprio tenant
    return currentTenant?.id === tenantId;
  };

  const value = {
    currentTenant,
    availableTenants,
    switchTenant,
    canAccessTenant,
    isSystemOwner,
    loading
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};