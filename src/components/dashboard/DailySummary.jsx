import { CheckCircle2, Sparkles, TrendingUp, Boxes, Tag, RefreshCw, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/pricing';

function getHour() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function DailySummary({ stats, settings }) {
  if (!stats) return null;

  const { byType, totalMonthly } = stats;
  const items = [
    byType.margem_baixa > 0 && {
      icon: TrendingUp,
      color: 'text-red-500',
      text: `${byType.margem_baixa} produto${byType.margem_baixa > 1 ? 's' : ''} com margem abaixo da meta de ${settings?.min_margin || 15}%`,
    },
    byType.promocao_recomendada > 0 && {
      icon: Tag,
      color: 'text-primary',
      text: `${byType.promocao_recomendada} promoç${byType.promocao_recomendada > 1 ? 'ões recomendadas' : 'ão recomendada'} para acelerar giro`,
    },
    byType.estoque_parado > 0 && {
      icon: Boxes,
      color: 'text-amber-500',
      text: `${byType.estoque_parado} produto${byType.estoque_parado > 1 ? 's' : ''} com estoque parado e capital imobilizado`,
    },
    byType.reposicao_inteligente > 0 && {
      icon: AlertTriangle,
      color: 'text-orange-500',
      text: `${byType.reposicao_inteligente} produto${byType.reposicao_inteligente > 1 ? 's' : ''} com risco de ruptura de estoque`,
    },
  ].filter(Boolean);

  return (
    <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-5 text-primary-foreground">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-accent" />
        <span className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-wide">Resumo Inteligente do Dia</span>
      </div>
      <p className="text-lg font-bold mb-4">{getHour()}.</p>
      <p className="text-sm text-primary-foreground/80 mb-4">Hoje identifiquei:</p>
      <div className="space-y-2 mb-5">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
              <span className="text-sm text-primary-foreground/90">{item.text}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/10 border border-white/20">
        <TrendingUp className="w-5 h-5 text-accent" />
        <div>
          <span className="text-xs text-primary-foreground/70">Potencial estimado de ganho</span>
          <p className="text-lg font-black text-accent">{formatCurrency(totalMonthly)}<span className="text-sm font-medium text-primary-foreground/70">/mês</span></p>
        </div>
      </div>
    </div>
  );
}