import { FileUp, TrendingUp, Tag, Sparkles, DollarSign, Boxes, RefreshCw, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import DailySummary from '@/components/dashboard/DailySummary';
import PriorityActions from '@/components/dashboard/PriorityActions';
import SmartAlerts from '@/components/dashboard/SmartAlerts';
import FarmaScore from '@/components/dashboard/FarmaScore';
import CEOMode from '@/components/dashboard/CEOMode';
import OpportunitySection from '@/components/OpportunitySection';

function calcFarmaScore(products, opportunities, settings) {
  if (!products || products.length === 0) return undefined;
  const minMargin = settings?.min_margin || 15;
  const idealMargin = settings?.ideal_margin || 30;
  const withMargin = products.filter(p => (p.margin_pct || 0) > 0);
  const avgMargin = withMargin.length > 0 ? withMargin.reduce((s, p) => s + p.margin_pct, 0) / withMargin.length : 0;
  const marginScore = Math.min(35, Math.round((avgMargin / idealMargin) * 35));
  const withSales = products.filter(p => (p.monthly_sales || 0) > 0);
  const giroScore = Math.min(25, Math.round((withSales.length / products.length) * 25));
  const parado = products.filter(p => p.abc_class === 'C' && (p.quantity || 0) > 0).length;
  const paradoPenalty = Math.min(15, Math.round((parado / products.length) * 15));
  const opp = opportunities || [];
  const applied = opp.filter(o => o.status === 'aplicada').length;
  const oppScore = Math.min(20, Math.round((applied / (opp.length || 1)) * 20));
  const highMargin = products.filter(p => (p.margin_pct || 0) >= idealMargin).length;
  const healthScore = Math.min(20, Math.round((highMargin / products.length) * 20));
  return Math.max(0, Math.min(100, marginScore + giroScore - paradoPenalty + oppScore + healthScore));
}

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

  if (!products || products.length === 0) {
    return <EmptyEnvironment settings={settings} />;
  }

  const opps = (type) => opportunities.filter(o => o.type === type);
  const priorityActions = opportunities.filter(o => o.priority === 'alta').slice(0, 5);
  const byType = stats?.byType || {};
  const farmaScore = calcFarmaScore(products, opportunities, settings);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Centro de Oportunidades</h1>
        <p className="text-sm text-muted-foreground mt-1">Seu consultor comercial identificou {opportunities.length} oportunidades para aumentar seu lucro.</p>
      </div>

      {/* Resumo diário premium */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DailySummary stats={stats} settings={settings} farmaScore={farmaScore} />
        </div>
        <FarmaScore products={products} opportunities={opportunities} settings={settings} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <OpportunityCard icon={DollarSign} title="Lucro Potencial" value={formatCurrency(stats?.totalMonthly || 0)} subtitle={`${formatCurrency(stats?.totalAnnual || 0)}/ano`} color="accent" to="/precificacao" />
        <OpportunityCard icon={TrendingUp} title="Margem Baixa" value={`${byType.margem_baixa || 0} produtos`} subtitle="Abaixo da meta" color="red" to="/precificacao" />
        <OpportunityCard icon={Boxes} title="Estoque Parado" value={`${byType.estoque_parado || 0} produtos`} subtitle="Capital imobilizado" color="amber" to="/produtos" />
        <OpportunityCard icon={Tag} title="Promoções" value={`${byType.promocao_recomendada || 0} sugeridas`} subtitle="Acelerar saída" color="primary" to="/consultor-ia" />
        <OpportunityCard icon={RefreshCw} title="Risco de Ruptura" value={`${byType.reposicao_inteligente || 0} alertas`} subtitle="Repor urgente" color="blue" to="/produtos" />
        <OpportunityCard icon={Star} title="Categorias Top" value={`${topCategories.length} categorias`} subtitle="Foco recomendado" color="accent" to="/relatorios" />
      </div>

      {/* Ações Prioritárias */}
      <PriorityActions actions={priorityActions} />

      {/* Alertas inteligentes */}
      <SmartAlerts opportunities={opportunities} />

      {/* Modo CEO */}
      <CEOMode stats={stats} opportunities={opportunities} products={products} />

      {/* Seções detalhadas */}
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
                <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent-dark font-bold text-sm flex-shrink-0">{i + 1}</span>
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

      {/* CTA Consultor */}
      <div className="bg-gradient-to-r from-primary to-primary-light rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <div className="flex-1">
            <p className="font-semibold">Consultor FarmaLucro AI</p>
            <p className="text-sm text-primary-foreground/80">Faça perguntas específicas sobre sua farmácia e receba recomendações detalhadas com justificativa.</p>
          </div>
          <Link to="/consultor-ia" className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors whitespace-nowrap">
            Consultar IA
          </Link>
        </div>
      </div>
    </div>
  );
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
        Seu ambiente foi criado com sucesso. Importe sua primeira nota fiscal para ativar o Consultor Proativo e receber recomendações personalizadas.
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