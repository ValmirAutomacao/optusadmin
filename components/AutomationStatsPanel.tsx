// Painel de Estatísticas de Automação
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  MessageSquare,
  Bot,
  Users,
  Clock,
  DollarSign,
  Activity,
  Target
} from 'lucide-react';

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
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Carregando estatísticas...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAutomationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatResponseTime = (hours: number) => {
    if (hours < 1) {
      const minutes = Math.round(hours * 60);
      return `${minutes}min`;
    }
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    const days = Math.round(hours / 24);
    return `${days}d`;
  };

  const calculateEfficiency = () => {
    if (stats.total_messages === 0) return 0;

    // Eficiência baseada em: taxa de automação + tempo de resposta
    const automationScore = stats.automation_rate;
    const responseScore = Math.max(0, 100 - (stats.avg_response_time_hours * 10));

    return Math.round((automationScore + responseScore) / 2);
  };

  const efficiency = calculateEfficiency();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Estatísticas de Automação (Últimos 30 dias)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Taxa de Automação */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Taxa de Automação</span>
                </div>
                <span className={`text-sm font-bold ${getAutomationColor(stats.automation_rate)}`}>
                  {stats.automation_rate.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={stats.automation_rate}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {stats.automated_responses} de {stats.total_messages} mensagens
              </div>
            </div>

            {/* Conversas Ativas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Conversas Ativas</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.active_conversations}
                </span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.active_conversations}
              </div>
              <div className="text-xs text-muted-foreground">
                Conversas em andamento
              </div>
            </div>

            {/* Transferências Humanas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Transferências</span>
                </div>
                <span className="text-sm font-bold">
                  {stats.human_transfers}
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.human_transfers}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.total_messages > 0
                  ? `${((stats.human_transfers / stats.total_messages) * 100).toFixed(1)}% do total`
                  : 'Nenhuma transferência'
                }
              </div>
            </div>

            {/* Tempo de Resposta */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Tempo Resposta</span>
                </div>
                <span className="text-sm font-bold">
                  {formatResponseTime(stats.avg_response_time_hours)}
                </span>
              </div>
              <div className="text-2xl font-bold text-purple-600">
                {formatResponseTime(stats.avg_response_time_hours)}
              </div>
              <div className="text-xs text-muted-foreground">
                Tempo médio de resposta
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Detalhadas */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Eficiência Geral */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Eficiência Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {efficiency}%
              </div>
              <Progress value={efficiency} className="h-2" />
              <div className="text-xs text-muted-foreground">
                Baseado em automação e tempo de resposta
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Volume de Mensagens */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              Volume de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {stats.total_messages}
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Automatizadas:</span>
                  <span className="font-medium text-blue-600">
                    {stats.automated_responses}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Transferidas:</span>
                  <span className="font-medium text-orange-600">
                    {stats.human_transfers}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <DollarSign className="mr-2 h-4 w-4" />
              Economia Estimada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(stats.automated_responses * 0.5)} min
              </div>
              <div className="text-xs text-muted-foreground">
                Tempo economizado em atendimento
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">~</span>
                <span className="font-medium text-green-600">
                  R$ {Math.round(stats.automated_responses * 2.5)}
                </span>
                <span className="text-muted-foreground"> em custos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Indicadores de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                stats.automation_rate >= 70 ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <div>
                <div className="text-sm font-medium">
                  Automação {stats.automation_rate >= 70 ? 'Excelente' : 'Precisa Melhorar'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta: ≥70%
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                stats.avg_response_time_hours <= 1 ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <div>
                <div className="text-sm font-medium">
                  Resposta {stats.avg_response_time_hours <= 1 ? 'Rápida' : 'Moderada'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta: ≤1h
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                stats.human_transfers <= stats.total_messages * 0.2 ? 'bg-green-500' : 'bg-yellow-500'
              }`} />
              <div>
                <div className="text-sm font-medium">
                  Transferências {stats.human_transfers <= stats.total_messages * 0.2 ? 'Baixas' : 'Moderadas'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta: ≤20%
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                efficiency >= 75 ? 'bg-green-500' : efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <div>
                <div className="text-sm font-medium">
                  Eficiência {efficiency >= 75 ? 'Alta' : efficiency >= 60 ? 'Média' : 'Baixa'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Meta: ≥75%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dicas de Melhoria */}
      {(stats.automation_rate < 70 || stats.avg_response_time_hours > 1) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-sm text-yellow-800">
              💡 Dicas para Melhorar Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AutomationStatsPanel;