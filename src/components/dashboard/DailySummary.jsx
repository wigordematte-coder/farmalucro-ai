import { TrendingUp, Tag, Boxes, AlertTriangle, DollarSign, Sparkles, ArrowRight, Brain, Star } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getDateStr() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export default function DailySummary({ stats, settings, farmaScore }) {
  if (!stats) return null;

  const { byType, totalMonthly } = stats;

  const highlights = [
    totalMonthly > 0 && {
      icon: DollarSign,
      value: formatCurrency(totalMonthly),
      label: 'em lucro potencial/mês',
      color: 'text-accent',
      bg: 'bg-accent/15',
    },
    byType.margem_baixa > 0 && {
      icon: TrendingUp,
      value: byType.margem_baixa,
      label: `produto${byType.margem_baixa > 1 ? 's' : ''} com margem abaixo da meta`,
      color: 'text-red-400',
      bg: 'bg-red-500/15',
    },
    byType.promocao_recomendada > 0 && {
      icon: Tag,
      value: byType.promocao_recomendada,
      label: `promoç${byType.promocao_recomendada > 1 ? 'ões recomendadas' : 'ão recomendada'}`,
      color: 'text-blue-300',
      bg: 'bg-blue-500/15',
    },
    byType.estoque_parado > 0 && {
      icon: Boxes,
      value: byType.estoque_parado,
      label: `produto${byType.estoque_parado > 1 ? 's' : ''} com estoque parado`,
      color: 'text-amber-300',
      bg: 'bg-amber-500/15',
    },
  ].filter(Boolean).slice(0, 4);

  const scoreColor = !farmaScore ? 'text-white/60'
    : farmaScore >= 85 ? 'text-accent'
    : farmaScore >= 70 ? 'text-blue-300'
    : farmaScore >= 50 ? 'text-amber-300'
    : 'text-red-400';

  const scoreLabel = !farmaScore ? '—'
    : farmaScore >= 85 ? 'Excelente'
    : farmaScore >= 70 ? 'Bom'
    : farmaScore >= 50 ? 'Regular'
    : 'Crítico';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-[hsl(243,75%,32%)] text-white shadow-xl shadow-primary/20">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full bg-accent/10 translate-y-1/2" />

      <div className="relative p-5 sm:p-6">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-inner">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-white text-base">FarmaLucro AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/30 text-accent-foreground font-semibold border border-accent/30">PRO</span>
              </div>
              <p className="text-xs text-white/60 capitalize">{getDateStr()}</p>
            </div>
          </div>

          {/* Farma Score compacto */}
          {farmaScore !== undefined && (
            <div className="text-right">
              <div className={cn("text-2xl font-black leading-none", scoreColor)}>{farmaScore || '—'}</div>
              <div className="text-[10px] text-white/50 mt-0.5">Farma Score</div>
              <div className={cn("text-[10px] font-semibold", scoreColor)}>{scoreLabel}</div>
            </div>
          )}
        </div>

        {/* Saudação */}
        <div className="mb-4">
          <p className="text-lg font-bold text-white mb-1">{getGreeting()}, {settings?.name || 'Farmácia'}.</p>
          <p className="text-sm text-white/70">Analisei sua farmácia e encontrei:</p>
        </div>

        {/* Highlights */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {highlights.map((h, i) => {
            const Icon = h.icon;
            return (
              <div key={i} className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 px-3 py-2.5">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", h.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", h.color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-bold leading-none truncate", h.color)}>{h.value}</p>
                  <p className="text-[10px] text-white/60 leading-tight mt-0.5 truncate">{h.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA para o consultor */}
        <Link
          to="/consultor-ia"
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl bg-accent hover:bg-accent-dark transition-colors shadow-lg shadow-accent/25 group"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">Consultar o FarmaLucro AI</span>
          </div>
          <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}