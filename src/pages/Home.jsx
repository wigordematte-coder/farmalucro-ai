import { FileUp, TrendingUp, Tag, ArrowRight, Sparkles, DollarSign, Boxes, Zap, RefreshCw, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import OpportunitySection from '@/components/OpportunitySection';

export default function Home() {
  const { products, loading, settings } = useProducts();
  const { opportunities, stats, topCategories } = useOpportunities(products, settings);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!opportunities || opportunities.length === 0) {
    return <EmptyEnvironment settings={settings} />;
  }

  const byType = stats.byType;
  const opps = (type) => opportunities.filter(o => o.type === type);
  const priorityActions = opportunities.filter(o => o.priority === 'alta').slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Centro de Oportunidades</h1>
        <p className="text-sm text-muted-foreground mt-1">A IA encontrou {opportunities.length} oportunidades para aumentar seu lucro</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        <OpportunityCard icon={DollarSign} title="Lucro Potencial Identificado" value={formatCurrency(stats.totalMonthly)} subtitle={`${formatCurrency(stats.totalAnnual)}/ano`} color="accent" to="/precificacao" />
        <OpportunityCard icon={TrendingUp} title="Margem Baixa" value={`${byType.margem_baixa || 0} produtos`} subtitle="Abaixo da meta configurada" color="red" to="/precificacao" />
        <OpportunityCard icon={Boxes} title="Estoque Parado" value={`${byType.estoque_parado || 0} produtos`} subtitle="Capital imobilizado sem giro" color="amber" to="/produtos" />
        <OpportunityCard icon={Tag} title="Promoções Recomendadas" value={`${byType.promocao_recomendada || 0} oportunidades`} subtitle="Acelerar saída de estoque" color="primary" to="/consultor-ia" />
        <OpportunityCard icon={RefreshCw} title="Reposição Inteligente" value={`${byType.reposicao_inteligente || 0} alertas`} subtitle="Estoque baixo com demanda" color="blue" to="/produtos" />
        <OpportunityCard icon={Star} title="Categorias de Alto Potencial" value={`${topCategories.length} categorias`} subtitle="Foco comercial recomendado" color="accent" to="/relatorios" />
      </div>

      {priorityActions.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" /> Ações Prioritárias do Dia
          </h3>
          <div className="space-y-2">
            {priorityActions.map((action, i) => (
              <Link key={i} to={getActionRoute(action.type)} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{action.product_name}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                {action.financial_impact_monthly > 0 && (
                  <span className="text-xs font-semibold text-accent-dark whitespace-nowrap">
                    +{formatCurrency(action.financial_impact_monthly)}/mês
                  </span>
                )}
                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      <OpportunitySection title="Produtos com Margem Baixa" icon={TrendingUp} iconColor="text-red-500" opportunities={opps('margem_baixa')} to="/precificacao" cta="Ajustar preços" />
      <OpportunitySection title="Reposição Inteligente" icon={RefreshCw} iconColor="text-blue-500" opportunities={opps('reposicao_inteligente')} to="/produtos" cta="Ver produtos" />
      <OpportunitySection title="Promoções Recomendadas" icon={Tag} iconColor="text-primary" opportunities={opps('promocao_recomendada')} to="/consultor-ia" cta="Consultar IA" />
      <OpportunitySection title="Estoque Parado" icon={Boxes} iconColor="text-amber-500" opportunities={opps('estoque_parado')} to="/produtos" cta="Ver produtos" />

      {topCategories.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-dark" /> Categorias de Maior Potencial
          </h3>
          <div className="space-y-2">
            {topCategories.map((cat, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent-dark font-bold text-sm flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{cat.category}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-accent-dark">{formatCurrency(cat.financial_impact_monthly)}/mês</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(cat.financial_impact_annual)}/ano</p>
                </div>
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

function getActionRoute(type) {
  const routes = {
    margem_baixa: '/precificacao',
    estoque_parado: '/produtos',
    promocao_recomendada: '/consultor-ia',
    reposicao_inteligente: '/produtos',
    categoria_alto_potencial: '/relatorios',
  };
  return routes[type] || '/dashboard';
}

function OpportunityCard({ icon: Icon, title, value, subtitle, color, to }) {
  const colors = {
    accent: 'bg-accent/10 text-accent-dark',
    primary: 'bg-primary/10 text-primary',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
  };
  return (
    <Link to={to} className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="text-lg lg:text-xl font-bold text-foreground mt-0.5">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
    </Link>
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