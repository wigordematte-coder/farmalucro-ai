import { FileUp, TrendingUp, Tag, Sparkles, DollarSign, Boxes, RefreshCw, Star, ArrowRight, Target, ShieldCheck, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useRecommendations } from '@/hooks/useRecommendations';
import { useOpportunities } from '@/hooks/useOpportunities';
import { formatCurrency } from '@/lib/pricing';
import { summarizeRecommendations } from '@/lib/recommendations';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/lib/roles';
import DailySummary from '@/components/dashboard/DailySummary';
import PriorityActions from '@/components/dashboard/PriorityActions';
import SmartAlerts from '@/components/dashboard/SmartAlerts';
import FarmaScore from '@/components/dashboard/FarmaScore';
import CEOMode from '@/components/dashboard/CEOMode';
import OpportunitySection from '@/components/OpportunitySection';
import InsightBanner from '@/components/InsightBanner';

function calcFarmaScore(products, opportunities, settings) {
  if (!products || products.length === 0) return undefined;
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
  const { recommendations } = useRecommendations();
  const { tenantId } = useUserRole();
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
  const recommendationSummary = summarizeRecommendations(recommendations);

  return (
    <div className="space-y-5 lg:space-y-6">
      <ExecutiveHeader
        opportunities={opportunities}
        stats={stats}
        farmaScore={farmaScore}
        priorityActions={priorityActions}
      />

      {/* Resumo diário premium */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DailySummary stats={stats} settings={settings} farmaScore={farmaScore} />
        </div>
        <FarmaScore products={products} opportunities={opportunities} settings={settings} />
      </div>

      <InsightBanner products={products} settings={settings} tenantId={tenantId} />

      <RecoverableProfitCard summary={recommendationSummary} />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <OpportunityCard icon={DollarSign} title="Lucro Potencial" value={formatCurrency(stats?.totalMonthly || 0)} subtitle={`${formatCurrency(stats?.totalAnnual || 0)}/ano projetado`} color="accent" to="/precificacao" emphasis />
        <OpportunityCard icon={TrendingUp} title="Margem Baixa" value={`${byType.margem_baixa || 0} produtos`} subtitle="Ajustes com prioridade financeira" color="red" to="/precificacao" />
        <OpportunityCard icon={Boxes} title="Estoque Parado" value={`${byType.estoque_parado || 0} produtos`} subtitle="Capital imobilizado para liberar" color="amber" to="/produtos" />
        <OpportunityCard icon={Tag} title="Promoções" value={`${byType.promocao_recomendada || 0} sugeridas`} subtitle="Acelerar saída com margem" color="primary" to="/consultor-ia" />
        <OpportunityCard icon={RefreshCw} title="Risco de Ruptura" value={`${byType.reposicao_inteligente || 0} alertas`} subtitle="Evitar perda de venda" color="blue" to="/produtos" />
        <OpportunityCard icon={Star} title="Categorias Top" value={`${topCategories.length} categorias`} subtitle="Foco recomendado pelo consultor" color="accent" to="/relatorios" />
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
        <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-accent-dark" /> Categorias de Maior Potencial
            </h3>
            <span className="hidden sm:inline-flex text-[11px] font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              ranking por impacto
            </span>
          </div>
          <div className="space-y-2">
            {topCategories.map((cat, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <span className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent-dark font-bold text-sm flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">{cat.category}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm font-semibold text-accent-dark">{formatCurrency(cat.financial_impact_monthly)}/mês</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(cat.financial_impact_annual)}/ano</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Consultor */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-ai to-accent p-5 text-primary-foreground shadow-lg shadow-primary/10">
        <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Consultor FarmaLucro AI</p>
            <p className="text-sm text-primary-foreground/85">Faça perguntas específicas sobre sua farmácia e receba recomendações detalhadas com justificativa financeira.</p>
          </div>
          <Link to="/consultor-ia" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary hover:bg-white/90 text-sm font-semibold transition-colors whitespace-nowrap">
            Consultar IA <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ExecutiveHeader({ opportunities, stats, farmaScore, priorityActions }) {
  const score = farmaScore ?? 0;
  const scoreLabel = score >= 80 ? 'Excelente' : score >= 60 ? 'Em evolução' : score > 0 ? 'Atenção' : 'Aguardando dados';

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-ai/[0.04] to-accent/[0.08]" />
      <div className="relative p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 text-accent-dark text-xs font-semibold mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Consultor Proativo
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
              Centro executivo de oportunidades
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {opportunities.length} oportunidades priorizadas para proteger margem, liberar caixa e aumentar lucro com base nos seus dados reais.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:min-w-[520px]">
            <ExecutiveMetric
              icon={DollarSign}
              label="Lucro potencial"
              value={formatCurrency(stats?.totalMonthly || 0)}
              hint="por mês"
              tone="accent"
            />
            <ExecutiveMetric
              icon={Activity}
              label="Farma Score"
              value={`${score}`}
              hint={scoreLabel}
              tone="ai"
            />
            <ExecutiveMetric
              icon={Target}
              label="Ações prioritárias"
              value={`${priorityActions.length}`}
              hint="alta prioridade"
              tone="warning"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ExecutiveMetric({ icon: Icon, label, value, hint, tone }) {
  const tones = {
    accent: 'bg-accent/10 text-accent-dark border-accent/20',
    ai: 'bg-ai/10 text-ai border-ai/20',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  return (
    <div className="rounded-xl border border-border bg-white/75 p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", tones[tone])}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground leading-none">{label}</p>
          <p className="text-lg font-bold text-foreground leading-tight mt-1">{value}</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">{hint}</p>
    </div>
  );
}

function RecoverableProfitCard({ summary }) {
  const top = summary.top || [];

  return (
    <section className="rounded-2xl border border-accent/20 bg-gradient-to-br from-card to-accent/[0.05] p-4 lg:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent-dark flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-accent-dark uppercase tracking-normal">Inteligencia comercial</p>
            <h2 className="text-xl font-bold text-foreground mt-1">Lucro Potencial Recuperavel</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Recomendacoes pendentes para responder o que fazer hoje para ganhar mais dinheiro.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:min-w-[360px]">
          <div className="rounded-xl border border-border bg-white/75 p-3">
            <p className="text-xs text-muted-foreground">Estimativa mensal</p>
            <p className="text-2xl font-bold text-accent-dark mt-1">{formatCurrency(summary.estimatedMonthlyGain)}</p>
          </div>
          <div className="rounded-xl border border-border bg-white/75 p-3">
            <p className="text-xs text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-foreground mt-1">{summary.pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1">
          {top.length > 0 ? top.map(item => (
            <div key={item.id} className="rounded-xl border border-border bg-white/70 p-3">
              <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{formatCurrency(item.estimated_monthly_gain)}/mes</p>
            </div>
          )) : (
            <div className="md:col-span-3 rounded-xl border border-border bg-white/70 p-3 text-sm text-muted-foreground">
              Importe uma NF para gerar o primeiro plano de acao.
            </div>
          )}
        </div>
        <Link to="/plano-acao" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-dark whitespace-nowrap">
          Ver plano de acao <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

function OpportunityCard({ icon: Icon, title, value, subtitle, color, to, emphasis }) {
  const colors = {
    accent: 'bg-accent/10 text-accent-dark border-accent/20',
    primary: 'bg-primary/10 text-primary border-primary/20',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
  };
  return (
    <Link to={to} className={cn(
      "group bg-card border border-border rounded-2xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all min-h-[132px]",
      emphasis && "ring-1 ring-accent/20 bg-gradient-to-br from-card to-accent/[0.04]"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-xs text-muted-foreground mt-3">{title}</p>
      <p className="text-xl lg:text-2xl font-bold text-foreground mt-0.5 leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{subtitle}</p>
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
      <p className="text-muted-foreground mb-8 max-w-xl">
        Seu dashboard ainda esta vazio. Importe uma nota fiscal para liberar o Consultor Proativo, revisar produtos e encontrar a primeira oportunidade real.
      </p>
      <Link
        to="/importacao"
        className="inline-flex items-center gap-3 px-8 py-5 rounded-2xl bg-accent text-accent-foreground font-bold text-base hover:bg-accent-dark transition-colors shadow-xl shadow-accent/25"
      >
        <FileUp className="w-6 h-6" /> Importar primeira nota fiscal
      </Link>
      <Link to="/welcome" className="mt-4 text-sm font-medium text-accent hover:underline">
        Ver checklist de ativacao
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
