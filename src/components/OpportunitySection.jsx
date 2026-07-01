import { ArrowRight, TrendingUp, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const PRIORITY_STYLES = {
  alta: 'bg-red-50 text-red-600 border-red-200',
  media: 'bg-amber-50 text-amber-600 border-amber-200',
  baixa: 'bg-blue-50 text-blue-600 border-blue-200',
};

const PRIORITY_LABELS = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

export default function OpportunitySection({ title, icon: Icon, iconColor, opportunities, to, cta }) {
  if (!opportunities || opportunities.length === 0) return null;
  const totalMonthly = opportunities.reduce((sum, opp) => sum + (opp.financial_impact_monthly || 0), 0);
  const highPriority = opportunities.filter(opp => opp.priority === 'alta').length;

  return (
    <section className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
              <Icon className={cn("w-5 h-5", iconColor)} />
            </span>
            {title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 text-accent-dark px-2 py-1 font-medium">
              <TrendingUp className="w-3 h-3" /> {formatCurrency(totalMonthly)}/mês
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 px-2 py-1 font-medium">
              <Zap className="w-3 h-3" /> {highPriority} alta prioridade
            </span>
          </div>
        </div>
        {to && (
          <Link to={to} className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-light font-medium">
            {cta || 'Ver todos'} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        {opportunities.map((opp, i) => (
          <article key={i} className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-muted/30 to-card p-3.5 hover:shadow-md transition-all">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{opp.product_name}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opp.description}</p>
                  </div>
                  {opp.financial_impact_monthly > 0 && (
                    <div className="sm:text-right flex-shrink-0">
                      <p className="text-sm font-bold text-accent-dark">+{formatCurrency(opp.financial_impact_monthly)}</p>
                      <p className="text-[10px] text-muted-foreground">por mês</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", PRIORITY_STYLES[opp.priority])}>
                    {PRIORITY_LABELS[opp.priority]}
                  </span>
                  {opp.confidence > 0 && (
                    <span className="text-[10px] text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-full">
                      Confiança {opp.confidence}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
