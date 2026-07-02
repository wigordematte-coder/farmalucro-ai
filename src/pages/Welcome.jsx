import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, CheckCircle2, Circle, FileUp, MessageSquare, PackageSearch, Sparkles, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useProducts } from '@/hooks/useProducts';
import { useOpportunities } from '@/hooks/useOpportunities';
import { useUserRole } from '@/lib/roles';
import { filterByTenant } from '@/lib/tenant';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const REVIEW_STATUSES = new Set(['manual_review', 'insufficient_data']);

export default function Welcome() {
  const { products, loading, settings } = useProducts();
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();
  const { opportunities, stats } = useOpportunities(products, settings);
  const [conversationCount, setConversationCount] = useState(0);

  useEffect(() => {
    let alive = true;

    async function loadConversations() {
      if (roleLoading) return;
      if (!isSuperAdmin && !tenantId) {
        setConversationCount(0);
        return;
      }

      try {
        const list = isSuperAdmin
          ? await base44.entities.ChatConversation.list('-created_date', 50)
          : await base44.entities.ChatConversation.filter({ tenant_id: tenantId }, '-created_date', 50);
        const tenantConversations = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
        if (alive) setConversationCount(tenantConversations.length);
      } catch {
        if (alive) setConversationCount(0);
      }
    }

    loadConversations();
    return () => {
      alive = false;
    };
  }, [tenantId, isSuperAdmin, roleLoading]);

  const activation = useMemo(() => {
    const hasProducts = products.length > 0;
    const manualReviewCount = products.filter(product => REVIEW_STATUSES.has(product.pricing_status)).length;
    const reviewedProducts = hasProducts && manualReviewCount === 0;
    const hasOpportunities = opportunities.length > 0;
    const hasChat = conversationCount > 0;

    return [
      {
        id: 'import',
        icon: FileUp,
        title: 'Importar primeira NF',
        description: hasProducts
          ? `${products.length} produtos importados para analise.`
          : 'Envie XML, PDF ou imagem da nota para encontrar as primeiras oportunidades.',
        done: hasProducts,
        href: '/importacao',
        action: hasProducts ? 'Importar outra NF' : 'Importar primeira nota fiscal',
      },
      {
        id: 'review',
        icon: PackageSearch,
        title: 'Revisar produtos importados',
        description: hasProducts
          ? manualReviewCount > 0
            ? `${manualReviewCount} produtos ainda precisam de revisao manual.`
            : 'Produtos importados revisados e prontos para decisao.'
          : 'Depois da importacao, revise itens sem preco atual ou dados suficientes.',
        done: reviewedProducts,
        href: '/precificacao',
        action: 'Revisar produtos',
        disabled: !hasProducts,
      },
      {
        id: 'opportunities',
        icon: TrendingUp,
        title: 'Ver oportunidades encontradas',
        description: hasOpportunities
          ? `${opportunities.length} oportunidades com ${formatCurrency(stats?.totalMonthly || 0)} de lucro potencial mensal.`
          : 'As oportunidades aparecem assim que houver produtos suficientes para analise.',
        done: hasOpportunities,
        href: '/dashboard',
        action: 'Ver oportunidades',
        disabled: !hasProducts,
      },
      {
        id: 'ai',
        icon: Bot,
        title: 'Conversar com o Consultor IA',
        description: hasChat
          ? `${conversationCount} conversa${conversationCount === 1 ? '' : 's'} iniciada${conversationCount === 1 ? '' : 's'}.`
          : 'Pergunte quais produtos revisar primeiro e onde a margem esta escapando.',
        done: hasChat,
        href: '/consultor-ia',
        action: 'Abrir Consultor IA',
        disabled: !hasProducts,
      },
    ];
  }, [products, opportunities, stats, conversationCount]);

  const completed = activation.filter(step => step.done).length;
  const progressPct = (completed / activation.length) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white p-6 lg:p-8">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.24),transparent_55%)]" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-medium text-emerald-100 mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Primeiro valor em poucos minutos
          </div>
          <h1 className="text-2xl lg:text-4xl font-bold leading-tight">
            Vamos encontrar sua primeira oportunidade de lucro
          </h1>
          <p className="mt-3 text-sm lg:text-base text-slate-200 max-w-2xl">
            Siga estes quatro passos para sair do cadastro direto para uma decisao concreta de precificacao.
          </p>
          <div className="mt-6 max-w-xl">
            <div className="flex items-center justify-between text-sm text-slate-200 mb-2">
              <span>Progresso de ativacao</span>
              <span className="font-semibold text-white">{completed}/4</span>
            </div>
            <div className="h-3 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activation.map((step, index) => (
            <ActivationStep key={step.id} step={step} index={index} />
          ))}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-5 h-fit">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-foreground mb-2">O que vem depois?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Depois da primeira nota, o Consultor Proativo prioriza margens baixas, revisoes manuais e maior lucro potencial.
          </p>
          <div className="space-y-2">
            <Link to="/dashboard" className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
              Ir para dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/importacao" className="flex items-center justify-between rounded-xl bg-accent px-3 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent-dark">
              Importar NF
              <FileUp className="w-4 h-4" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ActivationStep({ step, index }) {
  const Icon = step.icon;
  const StatusIcon = step.done ? CheckCircle2 : Circle;
  const content = (
    <>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0',
          step.done ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-muted-foreground">Passo {index + 1}</span>
            <StatusIcon className={cn('w-4 h-4', step.done ? 'text-emerald-600' : 'text-muted-foreground')} />
          </div>
          <h3 className="font-bold text-foreground">{step.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className={cn(
          'text-xs font-semibold rounded-full px-2.5 py-1',
          step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
        )}>
          {step.done ? 'Concluido' : 'Pendente'}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent">
          {step.action}
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </>
  );

  if (step.disabled) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 opacity-70">
        {content}
      </div>
    );
  }

  return (
    <Link to={step.href} className="rounded-2xl border border-border bg-card p-5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 transition-all">
      {content}
    </Link>
  );
}
