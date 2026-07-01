import { TrendingDown, Boxes, AlertTriangle, Tag, Star, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ALERT_DEFS = {
  margem_baixa: {
    icon: TrendingDown,
    label: 'Margem Baixa',
    bg: 'bg-red-50 border-red-100',
    iconBg: 'bg-red-100 text-red-500',
    textColor: 'text-red-700',
    route: '/precificacao',
    humanize: (o) => `${o.product_name} está gerando menos lucro do que poderia. Uma pequena revisão de preço pode aumentar seu resultado mensal.`,
  },
  estoque_parado: {
    icon: Boxes,
    label: 'Estoque Parado',
    bg: 'bg-amber-50 border-amber-100',
    iconBg: 'bg-amber-100 text-amber-600',
    textColor: 'text-amber-700',
    route: '/produtos',
    humanize: (o) => `${o.product_name} está com estoque parado. Esse capital poderia estar girando e gerando lucro para você.`,
  },
  reposicao_inteligente: {
    icon: AlertTriangle,
    label: 'Risco de Ruptura',
    bg: 'bg-orange-50 border-orange-100',
    iconBg: 'bg-orange-100 text-orange-500',
    textColor: 'text-orange-700',
    route: '/produtos',
    humanize: (o) => `${o.product_name} tem estoque muito baixo e alta demanda. Não deixe faltar — cada dia sem produto é venda perdida.`,
  },
  promocao_recomendada: {
    icon: Tag,
    label: 'Oportunidade de Promoção',
    bg: 'bg-blue-50 border-blue-100',
    iconBg: 'bg-blue-100 text-blue-600',
    textColor: 'text-blue-700',
    route: '/consultor-ia',
    humanize: (o) => `${o.product_name} tem potencial para uma promoção agora. Acelere a saída e libere capital para o estoque mais rentável.`,
  },
  categoria_alto_potencial: {
    icon: Star,
    label: 'Categoria Destaque',
    bg: 'bg-accent/10 border-accent/20',
    iconBg: 'bg-accent/20 text-accent-dark',
    textColor: 'text-accent-dark',
    route: '/relatorios',
    humanize: (o) => `A categoria ${o.category} é seu motor de lucro hoje. Invista atenção aqui para maximizar o resultado.`,
  },
};

export default function SmartAlerts({ opportunities }) {
  const topAlerts = (opportunities || []).filter(o => o.priority === 'alta').slice(0, 6);
  if (!topAlerts.length) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        Alertas Inteligentes
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Situações que precisam da sua atenção hoje.</p>
      <div className="space-y-2.5">
        {topAlerts.map((alert, i) => {
          const cfg = ALERT_DEFS[alert.type];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <Link
              key={i}
              to={cfg.route}
              className={cn("flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm group", cfg.bg)}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cfg.iconBg)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-[11px] font-bold uppercase tracking-wide mb-0.5", cfg.textColor)}>{cfg.label}</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{cfg.humanize(alert)}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}