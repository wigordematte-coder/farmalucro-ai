import { CheckCircle2, XCircle, TrendingUp, ShieldCheck, Target, Tag, Boxes, DollarSign } from 'lucide-react';
import { useRecommendations } from '@/hooks/useRecommendations';
import { formatCurrency, formatPercent } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
  price_increase: 'Aumentar preco',
  price_decrease: 'Reduzir preco',
  margin_fix: 'Corrigir margem',
  promotion: 'Promocao',
  stock_turnover: 'Girar estoque',
};

const TYPE_ICONS = {
  price_increase: TrendingUp,
  price_decrease: DollarSign,
  margin_fix: ShieldCheck,
  promotion: Tag,
  stock_turnover: Boxes,
};

export default function ActionPlan() {
  const { recommendations, loading, updateStatus, applyRecommendation, metrics } = useRecommendations();
  const pending = recommendations.filter(item => item.status === 'pending');
  const approved = recommendations.filter(item => item.status === 'approved');
  const applied = recommendations.filter(item => item.status === 'applied');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 text-accent-dark text-xs font-semibold mb-3">
              <Target className="w-3.5 h-3.5" /> Plano de Acao
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">O que fazer hoje para ganhar mais dinheiro</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Recomendacoes geradas a partir dos produtos importados, margem, custo e sinais disponiveis. Aprovar aqui nao altera preco automaticamente.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-full sm:min-w-[360px]">
            <Metric label="Lucro potencial" value={formatCurrency(metrics.estimatedPotential)} />
            <Metric label="Lucro realizado" value={formatCurrency(metrics.realizedGain)} />
            <Metric label="Aprovadas" value={approved.length} />
            <Metric label="Aplicadas" value={applied.length} />
          </div>
        </div>
      </section>

      {pending.length === 0 && approved.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-bold text-foreground">Nenhuma recomendacao pendente</h2>
          <p className="text-sm text-muted-foreground mt-1">Importe uma NF ou revise produtos para gerar novas oportunidades.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {pending.length > 0 && (
            <RecommendationList title="Pendentes de decisao" items={pending} onStatus={updateStatus} onApply={applyRecommendation} />
          )}
          {approved.length > 0 && (
            <RecommendationList title="Aprovadas para aplicar" items={approved} onStatus={updateStatus} onApply={applyRecommendation} />
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationList({ title, items, onStatus, onApply }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-normal">{title}</h2>
      <div className="grid grid-cols-1 gap-3">
        {items.map(item => (
          <RecommendationCard key={item.id} item={item} onStatus={onStatus} onApply={onApply} />
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function RecommendationCard({ item, onStatus, onApply }) {
  const Icon = TYPE_ICONS[item.type] || Target;
  const confidence = Number(item.confidence || 0);
  const confidenceTone = confidence >= 75
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : confidence >= 45
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <article className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col xl:flex-row xl:items-start gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-accent/10 text-accent-dark flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-accent-dark bg-accent/10 px-2 py-1 rounded-full">
                {TYPE_LABELS[item.type] || item.type}
              </span>
              <span className={cn('text-xs font-semibold border px-2 py-1 rounded-full', confidenceTone)}>
                {confidence}% confianca
              </span>
            </div>
            <h2 className="text-base font-bold text-foreground mt-2">{item.title}</h2>
            <p className="text-xs font-medium text-foreground/80 mt-1">{item.product_name || 'Produto'}</p>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            {item.reason && <p className="text-xs text-muted-foreground mt-2">{item.reason}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 xl:min-w-[640px]">
          <Value label="Preco atual" value={formatCurrency(item.current_price)} />
          <Value label="Preco sugerido" value={formatCurrency(item.suggested_price)} strong />
          <Value label="Margem atual" value={formatPercent(item.current_margin)} />
          <Value label="Margem projetada" value={formatPercent(item.projected_margin)} />
          <Value label="Ganho estimado" value={formatCurrency(item.estimated_monthly_gain)} strong />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-border">
        {item.status === 'pending' && (
          <>
            <button
              type="button"
              onClick={() => onStatus(item, 'approved')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-dark"
            >
              <CheckCircle2 className="w-4 h-4" /> Aprovar
            </button>
            <button
              type="button"
              onClick={() => onStatus(item, 'rejected')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted"
            >
              <XCircle className="w-4 h-4" /> Rejeitar
            </button>
          </>
        )}
        {item.status === 'approved' && (
          <>
            <button
              type="button"
              onClick={() => {
                const value = window.prompt('Informe o ganho mensal realizado em R$ se ja souber. Deixe em branco para medir depois.', '');
                if (value === null) return;
                const normalized = String(value).replace(',', '.');
                onApply(item, Number(normalized) || 0);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-dark"
            >
              <CheckCircle2 className="w-4 h-4" /> Marcar aplicada
            </button>
            <button
              type="button"
              onClick={() => onStatus(item, 'rejected')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted"
            >
              <XCircle className="w-4 h-4" /> Rejeitar
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function Value({ label, value, strong }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('text-sm mt-1', strong ? 'font-bold text-accent-dark' : 'font-semibold text-foreground')}>{value}</p>
    </div>
  );
}
