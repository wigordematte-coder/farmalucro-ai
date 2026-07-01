import { Zap, ArrowRight, TrendingUp, Tag, Boxes, RefreshCw, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const TYPE_CONFIG = {
  margem_baixa: { icon: TrendingUp, color: 'bg-red-50 text-red-500', action: 'Revisar preço', route: '/precificacao', reason: 'Produto gerando menos lucro do que poderia. Uma pequena revisão de preço pode aumentar seu resultado mensal.' },
  estoque_parado: { icon: Boxes, color: 'bg-amber-50 text-amber-600', action: 'Criar promoção', route: '/produtos', reason: 'Capital parado sem girar. Liberar esse estoque transforma produto em lucro imediato.' },
  promocao_recomendada: { icon: Tag, color: 'bg-blue-50 text-blue-600', action: 'Criar campanha', route: '/consultor-ia', reason: 'Produto com potencial de venda rápida. Uma promoção bem feita pode dobrar o giro.' },
  reposicao_inteligente: { icon: RefreshCw, color: 'bg-orange-50 text-orange-500', action: 'Repor estoque', route: '/produtos', reason: 'Estoque crítico com alta demanda. Cada dia sem produto é venda perdida.' },
  categoria_alto_potencial: { icon: Star, color: 'bg-accent/10 text-accent-dark', action: 'Ver categoria', route: '/relatorios', reason: 'Esta categoria tem o maior potencial de retorno. Priorize-a nas suas ações comerciais.' },
};

export default function PriorityActions({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <Zap className="w-5 h-5 text-amber-500" />
        Ações Prioritárias do Dia
      </h3>
      <p className="text-xs text-muted-foreground mb-4">O que fazer hoje para aumentar seu lucro — em ordem de impacto.</p>
      <div className="space-y-3">
        {actions.map((action, i) => {
          const cfg = TYPE_CONFIG[action.type] || TYPE_CONFIG.margem_baixa;
          const Icon = cfg.icon;
          return (
            <Link key={i} to={cfg.route} className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors border border-transparent hover:border-border group">
              <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", cfg.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">{cfg.action}: {action.product_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{cfg.reason}</p>
                {action.financial_impact_monthly > 0 && (
                  <p className="text-xs font-semibold text-accent-dark mt-1.5">
                    Impacto estimado: +{formatCurrency(action.financial_impact_monthly)}/mês
                  </p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}