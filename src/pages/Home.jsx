import { useMemo } from 'react';
import { FileUp, TrendingUp, Package, AlertTriangle, Tag, ArrowRight, Sparkles, DollarSign, Boxes } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency, formatNumber, calculatePotentialProfit, calculateInventoryValue } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export default function Home() {
  const { products, loading, settings } = useProducts();

  const opportunities = useMemo(() => {
    if (!products || products.length === 0) return null;

    const potentialProfit = calculatePotentialProfit(products);
    const inventoryValue = calculateInventoryValue(products);

    const deadStock = products
      .filter(p => p.abc_class === 'C' || (p.monthly_sales || 0) === 0)
      .reduce((s, p) => s + (p.cost || 0) * (p.quantity || 0), 0);

    const lowMarginProducts = products.filter(p => {
      const minMargin = settings?.min_margin || 15;
      return (p.margin_pct || 0) < minMargin;
    });

    const promotionCandidates = products.filter(p => {
      const isExpiring = p.expiration_date && (() => {
        const days = (new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24);
        return days > 0 && days <= 90;
      })();
      const isDeadStock = (p.monthly_sales || 0) === 0 && (p.quantity || 0) > 0;
      const isHighStock = (p.quantity || 0) > 10 && (p.monthly_sales || 0) < 5;
      return isExpiring || isDeadStock || isHighStock;
    });

    const profitOpportunities = products.filter(p => {
      const idealMargin = settings?.ideal_margin || 30;
      return (p.margin_pct || 0) < idealMargin && (p.monthly_sales || 0) > 0;
    }).reduce((s, p) => {
      const idealPrice = (p.cost || 0) / (1 - (settings?.ideal_margin || 30) / 100);
      const currentProfit = (p.selected_price || 0) - (p.cost || 0);
      const idealProfit = idealPrice - (p.cost || 0);
      return s + (idealProfit - currentProfit) * (p.monthly_sales || 0);
    }, 0);

    return {
      potentialProfit,
      inventoryValue,
      deadStock,
      lowMarginCount: lowMarginProducts.length,
      promotionCount: promotionCandidates.length,
      profitOpportunities,
      totalProducts: products.length,
      lowMarginProducts: lowMarginProducts.slice(0, 5),
      promotionCandidates: promotionCandidates.slice(0, 5),
    };
  }, [products, settings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!opportunities || products.length === 0) {
    return <EmptyEnvironment settings={settings} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Centro de Oportunidades</h1>
        <p className="text-sm text-muted-foreground mt-1">A IA encontrou oportunidades para aumentar seu lucro</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <OpportunityCard
          icon={DollarSign}
          title="Lucro potencial encontrado"
          value={formatCurrency(opportunities.profitOpportunities)}
          description="Ajustando preços de produtos com margem abaixo da meta"
          color="accent"
          to="/precificacao"
          cta="Ver precificação"
        />
        <OpportunityCard
          icon={Boxes}
          title="Estoque parado"
          value={formatCurrency(opportunities.deadStock)}
          description="Capital imobilizado em produtos sem giro"
          color="amber"
          to="/produtos"
          cta="Ver produtos"
        />
        <OpportunityCard
          icon={Tag}
          title="Promoções recomendadas"
          value={`${opportunities.promotionCount} oportunidades`}
          description="Produtos para promoção: vencimento próximo ou giro baixo"
          color="primary"
          to="/importacao"
          cta="Ver detalhes"
        />
        <OpportunityCard
          icon={TrendingUp}
          title="Produtos com margem baixa"
          value={`${opportunities.lowMarginCount} produtos`}
          description="Abaixo da margem mínima configurada"
          color="red"
          to="/precificacao"
          cta="Ajustar preços"
        />
      </div>

      {opportunities.lowMarginProducts.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Produtos com margem baixa</h3>
            <Link to="/precificacao" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {opportunities.lowMarginProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">Custo: {formatCurrency(p.cost || 0)} → Preço: {formatCurrency(p.selected_price || 0)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-red-600">{(p.margin_pct || 0).toFixed(1)}%</span>
                  <p className="text-xs text-muted-foreground">Meta: {settings?.min_margin || 15}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunities.promotionCandidates.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" /> Promoções sugeridas pela IA
            </h3>
            <Link to="/consultor-ia" className="text-xs text-primary hover:underline flex items-center gap-1">
              Consultar IA <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {opportunities.promotionCandidates.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Estoque: {p.quantity || 0} | Vendas/mês: {p.monthly_sales || 0}
                      {p.expiration_date && ` | Vence: ${new Date(p.expiration_date).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
                  {p.abc_class === 'C' ? 'Sem giro' : (p.quantity > 10 ? 'Excesso' : 'Vencendo')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div className="flex-1">
            <p className="font-semibold">Consultor FarmaLucro AI</p>
            <p className="text-sm text-primary-foreground/80">Receba recomendações personalizadas com justificativa baseada nos seus dados</p>
          </div>
          <Link to="/consultor-ia" className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors whitespace-nowrap">
            Conversar com IA
          </Link>
        </div>
      </div>
    </div>
  );
}

function OpportunityCard({ icon: Icon, title, value, description, color, to, cta }) {
  const colors = {
    accent: 'bg-accent/10 text-accent-dark',
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 flex-1">{description}</p>
      <Link to={to} className="mt-3 text-xs font-medium text-primary hover:underline flex items-center gap-1">
        {cta} <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}

function EmptyEnvironment({ settings }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-3xl gradient-farma flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
        Bem-vindo ao FarmaLucro AI{settings?.name ? `, ${settings.name}` : ''}
      </h1>
      <p className="text-muted-foreground mb-8">
        Seu ambiente foi criado com sucesso. Para começar a receber insights de IA e recomendações de precificação, importe sua primeira nota fiscal.
      </p>
      <Link
        to="/importacao"
        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
      >
        <FileUp className="w-5 h-5" /> Importar Nota Fiscal
      </Link>
      <div className="mt-8 grid grid-cols-3 gap-4 w-full max-w-md">
        <Step icon={FileUp} label="Importe" description="Sua nota fiscal" />
        <Step icon={Sparkles} label="IA analisa" description="Preços e oportunidades" />
        <Step icon={TrendingUp} label="Lucre mais" description="Com precificação inteligente" />
      </div>
    </div>
  );
}

function Step({ icon: Icon, label, description }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-xs font-medium text-foreground">{label}</p>
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}