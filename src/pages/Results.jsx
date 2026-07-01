import { useMemo } from 'react';
import { Trophy, TrendingUp, CheckCircle2, Tag, Boxes, ShieldCheck, Sparkles, Package, Star, ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useSubscription } from '@/lib/subscriptionContext';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import FarmaScore from '@/components/dashboard/FarmaScore';

// ── helpers ──────────────────────────────────────────────────────────────────

function calcScore(products, opportunities, settings) {
  if (!products || products.length === 0) return 0;
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
  const oppScore = Math.min(20, Math.round((applied / Math.max(opp.length, 1)) * 20));
  const highMargin = products.filter(p => (p.margin_pct || 0) >= idealMargin).length;
  const healthScore = Math.min(20, Math.round((highMargin / products.length) * 20));
  return Math.max(0, Math.min(100, marginScore + giroScore - paradoPenalty + oppScore + healthScore));
}

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

// ── main ─────────────────────────────────────────────────────────────────────

export default function Results() {
  const { products, loading, settings } = useProducts();
  const { opportunities, stats } = useOpportunities(products, settings);
  const { subscription } = useSubscription();

  const isTrial = subscription?.status === 'trial';
  const trialStart = subscription?.trial_start_date;
  const daysUsing = daysSince(trialStart || subscription?.subscription_start_date);

  const score = useMemo(() => calcScore(products, opportunities, settings), [products, opportunities, settings]);

  const applied = opportunities.filter(o => o.status === 'aplicada');
  const promotionsApplied = applied.filter(o => o.type === 'promocao_recomendada');
  const capturedProfit = applied.reduce((s, o) => s + (o.financial_impact_monthly || 0), 0);

  const avgMargin = useMemo(() => {
    const with_ = products.filter(p => (p.margin_pct || 0) > 0);
    return with_.length > 0 ? with_.reduce((s, p) => s + p.margin_pct, 0) / with_.length : 0;
  }, [products]);

  const lowMarginCount = products.filter(p => (p.margin_pct || 0) < (settings?.min_margin || 15)).length;
  const paradoCount = products.filter(p => p.abc_class === 'C' && (p.quantity || 0) > 0).length;

  const achievements = buildAchievements({ products, applied, score, daysUsing, opportunities });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Centro de Resultados</h1>
        <p className="text-sm text-muted-foreground mt-1">Veja o valor que o FarmaLucro AI está gerando para a sua farmácia.</p>
      </div>

      {/* Trial CTA */}
      {isTrial && (
        <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-sm font-semibold uppercase tracking-wide text-primary-foreground/80">Período Gratuito</span>
          </div>
          <p className="text-base font-bold mb-4">Veja o que o FarmaLucro AI já fez por você:</p>
          <div className="space-y-2 mb-5">
            <TrialRow icon={TrendingUp} text={`${formatCurrency(stats?.totalMonthly || 0)} em oportunidades de lucro identificadas`} />
            <TrialRow icon={Package} text={`${products.length} produtos analisados e precificados`} />
            <TrialRow icon={CheckCircle2} text={`${opportunities.length} recomendações inteligentes geradas`} />
            <TrialRow icon={ShieldCheck} text={`Farma Score atual: ${score}/100`} />
          </div>
          <Link to="/assinatura" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent-dark transition-colors">
            Assinar agora e continuar crescendo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard icon={TrendingUp} color="accent" label="Lucro Potencial Identificado" value={formatCurrency(stats?.totalMonthly || 0)} sub="/mês" />
        <KPICard icon={CheckCircle2} color="green" label="Lucro Potencial Capturado" value={formatCurrency(capturedProfit)} sub={`${applied.length} aplicadas`} />
        <KPICard icon={Star} color="primary" label="Recomendações Aplicadas" value={String(applied.length)} sub={`de ${opportunities.length} geradas`} />
        <KPICard icon={Tag} color="blue" label="Promoções Executadas" value={String(promotionsApplied.length)} sub="campanhas" />
        <KPICard icon={Boxes} color="amber" label="Estoque Parado Atual" value={String(paradoCount)} sub="produtos" />
        <KPICard icon={ShieldCheck} color="purple" label="Farma Score Atual" value={`${score}/100`} sub="" />
      </div>

      {/* FarmaScore completo */}
      <FarmaScore products={products} opportunities={opportunities} settings={settings} />

      {/* Resumo 30 dias */}
      <Last30Days
        opportunities={opportunities}
        applied={applied}
        stats={stats}
        score={score}
        products={products}
      />

      {/* Indicadores de saúde */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Saúde Comercial
        </h3>
        <div className="space-y-3">
          <HealthBar label="Margem Média" value={avgMargin} target={settings?.ideal_margin || 30} unit="%" color="accent" />
          <HealthBar label="Produtos na Meta de Margem" value={products.length > 0 ? ((products.length - lowMarginCount) / products.length) * 100 : 0} target={80} unit="%" color="blue" />
          <HealthBar label="Produtos com Giro Ativo" value={products.length > 0 ? (products.filter(p => (p.monthly_sales || 0) > 0).length / products.length) * 100 : 0} target={70} unit="%" color="green" />
          <HealthBar label="Oportunidades Aplicadas" value={opportunities.length > 0 ? (applied.length / opportunities.length) * 100 : 0} target={50} unit="%" color="purple" />
        </div>
      </div>

      {/* Histórico de recomendações aplicadas */}
      {applied.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-accent" /> Recomendações Aplicadas
          </h3>
          <div className="space-y-2">
            {applied.slice(0, 10).map((opp, i) => (
              <AppliedRow key={i} opp={opp} />
            ))}
          </div>
        </div>
      )}

      {/* Conquistas */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" /> Conquistas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((ach, i) => (
            <AchievementCard key={i} {...ach} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── sub-components ────────────────────────────────────────────────────────────

function TrialRow({ icon: Icon, text }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
      <span className="text-sm text-primary-foreground/90">{text}</span>
    </div>
  );
}

function KPICard({ icon: Icon, color, label, value, sub }) {
  const colors = {
    accent: 'bg-accent/10 text-accent-dark',
    green: 'bg-emerald-50 text-emerald-600',
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className="text-xl font-black text-foreground mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function Last30Days({ opportunities, applied, stats, score, products }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" /> Resumo Geral
      </h3>
      <p className="text-xs text-muted-foreground mb-4">Visão consolidada do seu desempenho na plataforma.</p>
      <div className="space-y-2.5">
        <SummaryRow icon={Star} color="text-primary" text={`${opportunities.length} recomendações inteligentes geradas`} />
        <SummaryRow icon={CheckCircle2} color="text-accent" text={`${applied.length} recomendações aplicadas`} />
        <SummaryRow icon={TrendingUp} color="text-accent-dark" text={`${formatCurrency(stats?.totalMonthly || 0)} em lucro potencial identificado`} />
        <SummaryRow icon={CheckCircle2} color="text-emerald-600" text={`${formatCurrency(applied.reduce((s, o) => s + (o.financial_impact_monthly || 0), 0))} em lucro potencial capturado`} />
        <SummaryRow icon={Package} color="text-blue-600" text={`${products.length} produtos analisados e monitorados`} />
        <SummaryRow icon={ShieldCheck} color="text-purple-600" text={`Farma Score atual: ${score}/100`} />
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, color, text }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className={cn("w-4 h-4 flex-shrink-0", color)} />
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}

function HealthBar({ label, value, target, unit, color }) {
  const pct = Math.min(100, Math.round(value));
  const ok = pct >= target;
  const barColors = {
    accent: ok ? 'bg-accent' : 'bg-amber-400',
    blue: ok ? 'bg-blue-500' : 'bg-amber-400',
    green: ok ? 'bg-emerald-500' : 'bg-amber-400',
    purple: ok ? 'bg-purple-500' : 'bg-amber-400',
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={cn("text-xs font-semibold", ok ? 'text-accent-dark' : 'text-amber-600')}>{pct.toFixed(1)}{unit}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barColors[color])} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5">Meta: {target}{unit}</p>
    </div>
  );
}

const TYPE_LABELS = {
  margem_baixa: 'Revisão de Margem',
  estoque_parado: 'Estoque Parado',
  promocao_recomendada: 'Promoção',
  reposicao_inteligente: 'Reposição',
  categoria_alto_potencial: 'Categoria',
};

function AppliedRow({ opp }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{opp.product_name || opp.category}</p>
        <p className="text-xs text-muted-foreground">{TYPE_LABELS[opp.type] || opp.type}</p>
      </div>
      {opp.financial_impact_monthly > 0 && (
        <span className="text-xs font-semibold text-accent-dark whitespace-nowrap">+{formatCurrency(opp.financial_impact_monthly)}/mês</span>
      )}
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent-dark font-medium">Aplicada</span>
    </div>
  );
}

function buildAchievements({ products, applied, score, daysUsing, opportunities }) {
  return [
    {
      icon: '📦',
      title: 'Primeira Nota Importada',
      desc: 'Você importou sua primeira nota fiscal.',
      unlocked: products.length > 0,
    },
    {
      icon: '✅',
      title: 'Primeira Recomendação Aplicada',
      desc: 'Você aplicou sua primeira recomendação da IA.',
      unlocked: applied.length >= 1,
    },
    {
      icon: '🏆',
      title: 'Farma Score acima de 80',
      desc: 'Sua farmácia atingiu excelente saúde comercial.',
      unlocked: score >= 80,
    },
    {
      icon: '📅',
      title: '30 Dias de Uso',
      desc: 'Você usa o FarmaLucro AI há mais de 30 dias.',
      unlocked: daysUsing >= 30,
    },
    {
      icon: '🔬',
      title: '100 Produtos Analisados',
      desc: 'Mais de 100 produtos foram analisados pela IA.',
      unlocked: products.length >= 100,
    },
    {
      icon: '⚡',
      title: '10 Recomendações Aplicadas',
      desc: 'Você está aproveitando o máximo da plataforma.',
      unlocked: applied.length >= 10,
    },
    {
      icon: '💡',
      title: '5 Oportunidades Identificadas',
      desc: 'O motor de IA encontrou 5 ou mais oportunidades.',
      unlocked: opportunities.length >= 5,
    },
    {
      icon: '🌟',
      title: 'Farmácia Top',
      desc: 'Farma Score acima de 90. Excelência total.',
      unlocked: score >= 90,
    },
  ];
}

function AchievementCard({ icon, title, desc, unlocked }) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3.5 rounded-xl border transition-all",
      unlocked ? "bg-accent/5 border-accent/20" : "bg-muted/30 border-border opacity-50"
    )}>
      <span className="text-2xl">{icon}</span>
      <div className="min-w-0">
        <p className={cn("text-sm font-semibold", unlocked ? "text-foreground" : "text-muted-foreground")}>{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
      {unlocked && <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 ml-auto" />}
    </div>
  );
}