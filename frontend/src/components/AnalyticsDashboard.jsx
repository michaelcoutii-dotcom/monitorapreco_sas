import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAnalytics, cleanupHistory } from '../api/products';

const StatCard = ({ title, value, icon, color }) => (
  <div className={`p-4 rounded-xl border-2 ${color.border} ${color.bg}`}>
    <div className="flex items-center gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <p className={`text-xs font-medium ${color.text}`}>{title}</p>
        <p className={`text-xl font-bold ${color.textDark}`}>{value}</p>
      </div>
    </div>
  </div>
);

// Gráfico de barras horizontais (mais fácil de ler)
const HorizontalBarChart = ({ data, maxValue, color }) => (
  <div className="space-y-2">
    {data.map((item, index) => {
      const width = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
      return (
        <div key={index} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-12 text-right flex-shrink-0">
            {item.label}
          </span>
          <div className="flex-1 h-6 bg-slate-700/50 rounded overflow-hidden">
            <div 
              className={`h-full ${color} rounded transition-all duration-500`}
              style={{ width: `${Math.max(width, 0)}%` }}
            />
          </div>
          <span className="text-xs text-slate-300 w-8 text-right flex-shrink-0 font-medium">
            {item.value}
          </span>
        </div>
      );
    })}
  </div>
);

// Gráfico de períodos do dia (Madrugada, Manhã, Tarde, Noite)
const TimePeriodsChart = ({ hourData }) => {
  // Agrupar horas em períodos
  const periods = [
    { name: '🌙 Madrugada', range: '0h - 5h', hours: [0, 1, 2, 3, 4, 5], color: 'bg-indigo-500' },
    { name: '🌅 Manhã', range: '6h - 11h', hours: [6, 7, 8, 9, 10, 11], color: 'bg-amber-500' },
    { name: '☀️ Tarde', range: '12h - 17h', hours: [12, 13, 14, 15, 16, 17], color: 'bg-orange-500' },
    { name: '🌆 Noite', range: '18h - 23h', hours: [18, 19, 20, 21, 22, 23], color: 'bg-purple-500' },
  ];

  const periodData = periods.map(period => {
    const total = period.hours.reduce((sum, hour) => {
      const hourEntry = hourData.find(h => parseInt(h.label) === hour);
      return sum + (hourEntry?.value || 0);
    }, 0);
    return { ...period, total };
  });

  const maxValue = Math.max(...periodData.map(p => p.total), 1);

  return (
    <div className="space-y-3">
      {periodData.map((period, index) => {
        const width = (period.total / maxValue) * 100;
        return (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white font-medium">{period.name}</span>
              <span className="text-xs text-slate-400">{period.range}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-8 bg-slate-700/50 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${period.color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${Math.max(width, 0)}%` }}
                >
                  {width > 20 && (
                    <span className="text-xs text-white font-bold">{period.total}</span>
                  )}
                </div>
              </div>
              {width <= 20 && (
                <span className="text-xs text-slate-300 font-medium w-8">{period.total}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function AnalyticsDashboard({ onClose }) {
  const [days, setDays] = useState(30);
  const [cleaning, setCleaning] = useState(false);
  const queryClient = useQueryClient();
  
  const { data: analytics, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics', days],
    queryFn: () => getAnalytics(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleCleanup = async () => {
    if (cleaning) return;
    setCleaning(true);
    try {
      const result = await cleanupHistory();
      alert(`✅ ${result.message}`);
      // Refresh analytics after cleanup
      refetch();
      queryClient.invalidateQueries(['products']);
    } catch (error) {
      alert('❌ Erro ao limpar histórico');
    } finally {
      setCleaning(false);
    }
  };

  const formatHour = (hour) => `${hour}`;
  
  const hourData = analytics?.changesByHour 
    ? Object.entries(analytics.changesByHour).map(([hour, count]) => ({
        label: formatHour(parseInt(hour)),
        value: count
      }))
    : [];
  
  const dayOfWeekData = analytics?.changesByDayOfWeek
    ? Object.entries(analytics.changesByDayOfWeek).map(([day, count]) => ({
        label: day.substring(0, 3),
        value: count
      }))
    : [];

  const maxDayValue = Math.max(...dayOfWeekData.map(d => d.value), 1);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col border border-slate-700">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 z-10 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                📊 Analytics de Preços
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                Análise das mudanças de preço dos seus produtos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCleanup}
                disabled={cleaning}
                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                title="Limpar registros duplicados"
              >
                {cleaning ? '🔄 Limpando...' : '🧹 Limpar Duplicados'}
              </button>
              <select 
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                className="bg-slate-800 text-white border border-slate-600 rounded-lg px-3 py-2 text-sm"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={60}>Últimos 60 dias</option>
                <option value={90}>Últimos 90 dias</option>
              </select>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-red-400">❌ Erro ao carregar analytics</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard 
                  title="Total de Mudanças"
                  value={analytics.totalChanges || 0}
                  icon="📈"
                  color={{ bg: 'bg-blue-900/30', border: 'border-blue-500/50', text: 'text-blue-400', textDark: 'text-blue-300' }}
                />
                <StatCard 
                  title="Produtos Monitorados"
                  value={analytics.totalProducts || 0}
                  icon="📦"
                  color={{ bg: 'bg-purple-900/30', border: 'border-purple-500/50', text: 'text-purple-400', textDark: 'text-purple-300' }}
                />
                <StatCard 
                  title="Média por Dia"
                  value={analytics.avgChangesPerDay || 0}
                  icon="📊"
                  color={{ bg: 'bg-green-900/30', border: 'border-green-500/50', text: 'text-green-400', textDark: 'text-green-300' }}
                />
                <StatCard 
                  title="Horário Mais Ativo"
                  value={`${analytics.peakHour || 0}h`}
                  icon="⏰"
                  color={{ bg: 'bg-amber-900/30', border: 'border-amber-500/50', text: 'text-amber-400', textDark: 'text-amber-300' }}
                />
              </div>

              {/* Charts Row */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Mudanças por Período do Dia */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    ⏰ Mudanças por Período do Dia
                  </h4>
                  <TimePeriodsChart hourData={hourData} />
                  <p className="text-xs text-slate-400 mt-3 text-center">
                    Horário pico: <span className="text-blue-400 font-bold">{analytics.peakHour}h</span>
                  </p>
                </div>

                {/* Mudanças por Dia da Semana */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    📅 Mudanças por Dia da Semana
                  </h4>
                  <HorizontalBarChart 
                    data={dayOfWeekData} 
                    maxValue={maxDayValue}
                    color="bg-purple-500"
                  />
                  <p className="text-xs text-slate-400 mt-3 text-center">
                    Dia com mais alterações: <span className="text-purple-400 font-bold">{analytics.peakDayOfWeek}</span>
                  </p>
                </div>
              </div>

              {/* Top Produtos */}
              {analytics.topChangingProducts && analytics.topChangingProducts.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    🏆 Produtos que Mais Mudaram de Preço
                  </h4>
                  <div className="space-y-2">
                    {analytics.topChangingProducts.map((product, index) => (
                      <div 
                        key={product.productId}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0 ? 'bg-yellow-500 text-yellow-900' :
                            index === 1 ? 'bg-slate-400 text-slate-900' :
                            index === 2 ? 'bg-amber-600 text-amber-100' :
                            'bg-slate-700 text-slate-300'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-sm text-slate-300 truncate max-w-[300px]">
                            {product.productName}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-400">
                          {product.changeCount} mudanças
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mudanças por Data */}
              {analytics.changesByDate && analytics.changesByDate.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    📆 Histórico de Mudanças por Dia
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {analytics.changesByDate.slice().reverse().map((day) => (
                      <div 
                        key={day.date}
                        className="flex items-center justify-between p-2 rounded bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
                      >
                        <span className="text-sm text-slate-400">
                          {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 bg-green-500 rounded"
                            style={{ width: `${Math.min(day.count * 10, 100)}px` }}
                          />
                          <span className="text-sm font-medium text-green-400 w-12 text-right">
                            {day.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {analytics.totalChanges === 0 && (
                <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700">
                  <span className="text-4xl mb-4 block">📭</span>
                  <p className="text-slate-400">Nenhuma mudança de preço registrada no período.</p>
                  <p className="text-sm text-slate-500 mt-2">As mudanças aparecerão aqui conforme os preços forem alterados.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-800/50 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="w-full px-4 py-2 rounded-lg font-medium text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
