import { BarChart3, Target, AlertTriangle, Lightbulb, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export default function CEOMode({ stats, opportunities, products }) {
  const [open, setOpen] = useState(false);

  if (!stats || !products?.length) return null;

  const highPriority = opportunities.filter(o => o.priority === 'alta');
  const topAction = highPriority[0];

  // Find best category
  const catProfit = {};
  products.forEach(p => {
    const cat = p.category || 'Geral';
    catProfit[cat] = (catProfit[cat] || 0) + (p.unit_profit || 0) * (p.monthly_sales || 0);
  });
  const bestCat = Object.entries(catProfit).sort((a, b) => b[1] - a[1])[0];

  const criticos = products.filter(p => (p.margin_pct || 0) < (5));

  const mainAction = topAction
    ? `${topAction.type === 'margem_baixa' ? 'Revisar preços da categoria de' : topAction.type === 'estoque_parado' ? 'Criar promoção para escoar estoque de' : 'Repor'} ${topAction.category || topAction.product_name}.`
    : bestCat ? `Ampliar mix da categoria ${bestCat[0]} para maximizar resultado.` : 'Importar mais produtos para análise completa.';

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Modo CEO — Resumo Executivo</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="px-5 pb-5 grid grid-cols-2 gap-3">
          <MetricBlock
            icon={Target}
            iconClass="bg-accent/10 text-accent-dark"
            label="Lucro potencial"
            value={formatCurrency(stats.totalMonthly) + '/mês'}
          />
          <MetricBlock
            icon={BarChart3}
            iconClass="bg-primary/10 text-primary"
            label="Oportunidades abertas"
            value={String(stats.total)}
          />
          <MetricBlock
            icon={AlertTriangle}
            iconClass="bg-red-50 text-red-500"
            label="Produtos críticos"
            value={String(criticos.length)}
          />
          {bestCat && (
            <MetricBlock
              icon={Target}
              iconClass="bg-blue-50 text-blue-600"
              label="Melhor categoria"
              value={bestCat[0]}
            />
          )}
          <div className="col-span-2 p-3.5 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-amber-700 mb-0.5">Ação mais importante agora</p>
              <p className="text-xs text-amber-600 leading-relaxed">{mainAction}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricBlock({ icon: Icon, iconClass, label, value }) {
  return (
    <div className="p-3.5 rounded-xl bg-muted/40 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", iconClass)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}