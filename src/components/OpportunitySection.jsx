import { ArrowRight } from 'lucide-react';
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

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Icon className={cn("w-5 h-5", iconColor)} /> {title}
        </h3>
        {to && (
          <Link to={to} className="text-xs text-primary hover:underline flex items-center gap-1">
            {cta || 'Ver todos'} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {opportunities.map((opp, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{opp.product_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{opp.description}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", PRIORITY_STYLES[opp.priority])}>
                  {PRIORITY_LABELS[opp.priority]}
                </span>
                {opp.confidence > 0 && (
                  <span className="text-[10px] text-muted-foreground">Confiança: {opp.confidence}%</span>
                )}
                {opp.financial_impact_monthly > 0 && (
                  <span className="text-[10px] font-medium text-accent-dark">
                    +{formatCurrency(opp.financial_impact_monthly)}/mês
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}