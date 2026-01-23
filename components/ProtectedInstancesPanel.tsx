import React, { useState, useEffect } from 'react';
import { InstanceProtectionService } from '../lib/instanceProtection';

interface ProtectedInstance {
  id: string;
  uazapi_instance_id: string;
  instance_name: string;
  client_info: string;
  protection_level: 'CRITICAL' | 'HIGH' | 'NORMAL';
  protection_reason: string;
  created_at: string;
}

const ProtectedInstancesPanel: React.FC = () => {
  const [protectedInstances, setProtectedInstances] = useState<ProtectedInstance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProtectedInstances();
  }, []);

  const loadProtectedInstances = async () => {
    try {
      setLoading(true);
      const data = await InstanceProtectionService.getProtectedInstances();
      setProtectedInstances(data);
    } catch (error) {
      console.error('Erro ao carregar instâncias protegidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProtectionLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'NORMAL': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getProtectionIcon = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '🚨';
      case 'HIGH': return '⚠️';
      case 'NORMAL': return '🛡️';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Carregando instâncias protegidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">🛡️</span>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Instâncias Protegidas</h2>
          <p className="text-gray-600 text-sm">Instâncias que não podem ser deletadas ou alteradas</p>
        </div>
      </div>

      {protectedInstances.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">🔓</span>
          <p className="text-gray-500">Nenhuma instância protegida encontrada</p>
        </div>
      ) : (
        <div className="space-y-4">
          {protectedInstances.map((instance) => (
            <div key={instance.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{instance.instance_name}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getProtectionLevelColor(instance.protection_level)}`}>
                      {getProtectionIcon(instance.protection_level)} {instance.protection_level}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">ID Uazapi:</span> {instance.uazapi_instance_id}
                    </div>
                    <div>
                      <span className="font-medium">Cliente:</span> {instance.client_info}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Motivo:</span> {instance.protection_reason}
                    </div>
                    <div>
                      <span className="font-medium">Protegida em:</span> {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Avisos baseados no nível */}
              {instance.protection_level === 'CRITICAL' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <span className="text-lg">🚨</span>
                    <div>
                      <p className="font-semibold text-sm">PROTEÇÃO CRÍTICA ATIVA</p>
                      <p className="text-xs">Esta instância NÃO PODE ser deletada sob nenhuma circunstância. Cliente em produção.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Informações sobre o sistema de proteção */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Sobre a Proteção</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>CRITICAL:</strong> Instâncias em produção - bloqueio total</li>
          <li>• <strong>HIGH:</strong> Instâncias importantes - cuidado extremo</li>
          <li>• <strong>NORMAL:</strong> Proteção padrão - verificação antes de ações</li>
          <li>• Todas as tentativas de operação são logadas para auditoria</li>
        </ul>
      </div>
    </div>
  );
};

export default ProtectedInstancesPanel;