import { Loader2, CheckCircle2, Calculator, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency, formatPercent, detectPricingProblems, getPricingRecommendation } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const STRATEGY_BADGES = {
  aggressive: 'bg-blue-50 text-blue-600',
  balanced: 'bg-accent/10 text-accent-dark',
  premium: 'bg-purple-50 text-purple-600',
};

const STRATEGY_LABELS = { aggressive: 'Agressivo', balanced: 'Equilibrado', premium: 'Premium' };

const PROBLEM_ICONS = {
  margem_baixa: AlertTriangle,
  preco_alto: AlertCircle,
  sem_atualizacao: Clock,
};

const PROBLEM_STYLES = {
  margem_baixa: 'text-red-600 bg-red-50',
  preco_alto: 'text-amber-600 bg-amber-50',
  sem_atualizacao: 'text-blue-600 bg-blue-50',
};

export default function PricingTable({ products, settings, margins, onSimulate, onPriceChange, saving, saved }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Produto</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Custo</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Preço Atual</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-center whitespace-nowrap">Margem Atual</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-center whitespace-nowrap">Margem Meta</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right whitespace-nowrap">Preço Recomendado</th>
              <th className="px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Justificativa</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-center whitespace-nowrap">Ação</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const problems = detectPricingProblems(p, settings, margins);
              const rec = getPricingRecommendation(p, settings, margins);
              return (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-medium text-foreground truncate">{p.name}</p>
                    {p.category && <span className="text-xs text-muted-foreground">{p.category}</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">{formatCurrency(p.cost || 0)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {saving === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground inline" />
                    ) : saved === p.id ? (
                      <CheckCircle2 className="w-4 h-4 text-accent inline" />
                    ) : (
                      <input type="number" step="0.01" defaultValue={p.selected_price || 0}
                        onBlur={e => e.target.value != p.selected_price && onPriceChange(p, 'selected_price', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-border text-right text-sm bg-background" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                      (p.margin_pct || 0) >= 35 ? "bg-accent/10 text-accent-dark" :
                      (p.margin_pct || 0) >= 15 ? "bg-blue-50 text-blue-600" :
                      "bg-red-50 text-red-600")}>
                      {formatPercent(p.margin_pct || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground whitespace-nowrap">{rec.categoryMargin}%</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <span className="font-medium text-foreground">{formatCurrency(rec.recommendedPrice)}</span>
                    <span className={cn("ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium", STRATEGY_BADGES[rec.strategy])}>
                      {STRATEGY_LABELS[rec.strategy]}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[260px]">
                    <p className="text-xs text-muted-foreground leading-snug">{rec.reason}</p>
                    {problems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {problems.map((prob, i) => {
                          const PIcon = PROBLEM_ICONS[prob.type];
                          return (
                            <span key={i} className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", PROBLEM_STYLES[prob.type])} title={prob.description}>
                              <PIcon className="w-2.5 h-2.5" /> {prob.label}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {rec.potentialMonthlyGain > 0 && (
                      <p className="text-[10px] text-accent-dark font-medium mt-1">+{formatCurrency(rec.potentialMonthlyGain)}/mês</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => onSimulate(p)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 text-accent-dark hover:bg-accent/20 text-xs font-medium transition-colors">
                      <Calculator className="w-3.5 h-3.5" /> Simular
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}