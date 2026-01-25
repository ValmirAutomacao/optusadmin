// Painel de Estatísticas de Automação
import React from 'react';


interface AutomationStats {
  total_messages: number;
  automated_responses: number;
  human_transfers: number;
  automation_rate: number;
  avg_response_time_hours: number;
  active_conversations: number;
}

interface AutomationStatsPanelProps {
  stats: AutomationStats | null;
}

export const AutomationStatsPanel: React.FC<AutomationStatsPanelProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="p-12 text-center bg-white border-2 border-gray-100 rounded-2xl">
        <span className="material-icons-round mx-auto text-4xl text-gray-300 mb-4 animate-pulse">analytics</span>
        <p className="text-gray-400 font-medium">Carregando estatísticas...</p>
      </div>
    );
  }

  const formatResponseTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)}min`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${Math.round(hours / 24)}d`;
  };

  const calculateEfficiency = () => {
    if (stats.total_messages === 0) return 0;
    const automationScore = stats.automation_rate;
    const responseScore = Math.max(0, 100 - (stats.avg_response_time_hours * 10));
    return Math.round((automationScore + responseScore) / 2);
  };

  const efficiency = calculateEfficiency();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm">
        <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-6">
          <span className="material-icons-round text-blue-500">trending_up</span>
          Estatísticas (Últimos 30 dias)
        </h4>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 p-4 bg-blue-50/50 rounded-2xl border-2 border-blue-100/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 uppercase">Automação</span>
              <span className="material-icons-round text-blue-500 text-sm">smart_toy</span>
            </div>
            <div className="text-2xl font-black text-blue-700">{stats.automation_rate.toFixed(1)}%</div>
            <div className="w-full bg-blue-200/50 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${stats.automation_rate}%` }} />
            </div>
            <p className="text-[10px] text-blue-500 font-bold">{stats.automated_responses} mensagens</p>
          </div>

          <div className="p-4 bg-green-50/50 rounded-2xl border-2 border-green-100/50 space-y-2">
            <div className="flex items-center justify-between text-green-600 uppercase text-[10px] font-bold">
              <span>Ativas</span>
              <span className="material-icons-round text-sm">group</span>
            </div>
            <div className="text-3xl font-black text-green-700">{stats.active_conversations}</div>
            <p className="text-[10px] text-green-600 font-bold">Tickets em andamento</p>
          </div>

          <div className="p-4 bg-orange-50/50 rounded-2xl border-2 border-orange-100/50 space-y-2">
            <div className="flex items-center justify-between text-orange-600 uppercase text-[10px] font-bold">
              <span>Transferidos</span>
              <span className="material-icons-round text-sm">forum</span>
            </div>
            <div className="text-3xl font-black text-orange-700">{stats.human_transfers}</div>
            <p className="text-[10px] text-orange-600 font-bold">Aguardando humano</p>
          </div>

          <div className="p-4 bg-purple-50/50 rounded-2xl border-2 border-purple-100/50 space-y-2">
            <div className="flex items-center justify-between text-purple-600 uppercase text-[10px] font-bold">
              <span>Tempo Médio</span>
              <span className="material-icons-round text-sm">schedule</span>
            </div>
            <div className="text-3xl font-black text-purple-700">{formatResponseTime(stats.avg_response_time_hours)}</div>
            <p className="text-[10px] text-purple-600 font-bold">Velocidade da IA</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white p-5 rounded-2xl border-2 border-gray-100">
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-icons-round text-xs">track_changes</span> Eficiência Geral
          </h5>
          <div className="text-3xl font-black text-gray-900 mb-2">{efficiency}%</div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full" style={{ width: `${efficiency}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-gray-100">
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-icons-round text-xs">analytics</span> Volume Total
          </h5>
          <div className="text-3xl font-black text-gray-900 mb-1">{stats.total_messages}</div>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold">IA</span>
              <span className="text-xs font-black text-blue-600">{stats.automated_responses}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold">HUMANO</span>
              <span className="text-xs font-black text-orange-600">{stats.human_transfers}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-gray-100">
          <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <span className="material-icons-round text-xs">payments</span> ROI Estimado
          </h5>
          <div className="text-3xl font-black text-green-600 mb-1">R$ {Math.round(stats.automated_responses * 2.5)}</div>
          <p className="text-[10px] text-gray-400 font-bold">Economia em horas de suporte</p>
        </div>
      </div>

      {/* Indicadores de Status */}
      <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-sm">
        <h4 className="font-bold text-gray-900 mb-6">Indicadores de Performance</h4>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${stats.automation_rate >= 70 ? 'bg-green-500' : 'bg-red-500'
              }`} />
            <div>
              <div className="text-sm font-medium">
                Automação {stats.automation_rate >= 70 ? 'Excelente' : 'Precisa Melhorar'}
              </div>
              <div className="text-xs text-gray-500">
                Meta: ≥70%
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${stats.avg_response_time_hours <= 1 ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            <div>
              <div className="text-sm font-medium">
                Resposta {stats.avg_response_time_hours <= 1 ? 'Rápida' : 'Moderada'}
              </div>
              <div className="text-xs text-gray-500">
                Meta: ≤1h
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${stats.human_transfers <= stats.total_messages * 0.2 ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
            <div>
              <div className="text-sm font-medium">
                Transferências {stats.human_transfers <= stats.total_messages * 0.2 ? 'Baixas' : 'Moderadas'}
              </div>
              <div className="text-xs text-gray-500">
                Meta: ≤20%
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${efficiency >= 75 ? 'bg-green-500' : efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
            <div>
              <div className="text-sm font-medium">
                Eficiência {efficiency >= 75 ? 'Alta' : efficiency >= 60 ? 'Média' : 'Baixa'}
              </div>
              <div className="text-xs text-gray-500">
                Meta: ≥75%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dicas de Melhoria */}
      {(stats.automation_rate < 70 || stats.avg_response_time_hours > 1) && (
        <div className="border-2 border-yellow-200 bg-yellow-50 p-6 rounded-3xl shadow-sm">
          <h4 className="font-bold text-yellow-800 mb-4">
            💡 Dicas para Melhorar Performance
          </h4>
          <div className="space-y-2 text-sm text-yellow-700">
            {stats.automation_rate < 70 && (
              <div>
                • <strong>Taxa de Automação Baixa:</strong> Considere melhorar os prompts da IA ou adicionar mais documentos de referência.
              </div>
            )}
            {stats.avg_response_time_hours > 1 && (
              <div>
                • <strong>Tempo de Resposta Lento:</strong> Verifique a configuração dos webhooks e a performance do agente IA.
              </div>
            )}
            {stats.human_transfers > stats.total_messages * 0.3 && (
              <div>
                • <strong>Muitas Transferências:</strong> Revise os prompts para lidar melhor com perguntas comuns.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutomationStatsPanel;