import { useState, useEffect, useMemo } from 'react';
import { Users, CheckCircle2, AlertTriangle, Lock, DollarSign, TrendingDown, Search, Receipt } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { SUBSCRIPTION_PLAN } from '@/lib/subscriptionContext';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/subscription/StatusBadge';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subs, pays] = await Promise.all([
          base44.entities.Subscription.list('-created_date', 500),
          base44.entities.Payment.list('-created_date', 100),
        ]);
        setSubscriptions(subs || []);
        setPayments(pays || []);
      } catch {
        setSubscriptions([]); setPayments([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active').length;
    const trial = subscriptions.filter(s => s.status === 'trialing' || s.status === 'trial').length;
    const overdue = subscriptions.filter(s => ['past_due', 'pending', 'overdue', 'pending_payment'].includes(s.status)).length;
    const blocked = subscriptions.filter(s => ['expired', 'blocked'].includes(s.status)).length;
    const cancelled = subscriptions.filter(s => s.status === 'cancelled').length;
    const mrr = active * SUBSCRIPTION_PLAN.price;
    const arr = mrr * 12;
    const churnRate = total > 0 ? (cancelled / total) * 100 : 0;
    const defaultRate = total > 0 ? ((overdue + blocked) / total) * 100 : 0;
    const paidPayments = payments.filter(p => p.status === 'paid');
    return { total, active, trial, overdue, blocked, cancelled, mrr, arr, churnRate, defaultRate, paidPayments };
  }, [subscriptions, payments]);

  const filteredSubs = useMemo(() => {
    if (!search) return subscriptions;
    const q = search.toLowerCase();
    return subscriptions.filter(s =>
      (s.billing_company_name || '').toLowerCase().includes(q) ||
      (s.billing_cnpj || '').toLowerCase().includes(q) ||
      (s.billing_email || '').toLowerCase().includes(q) ||
      (s.billing_responsible_name || '').toLowerCase().includes(q)
    );
  }, [subscriptions, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Assinaturas</h1>
        <p className="text-sm text-muted-foreground">Gestão de assinaturas, receita e inadimplência</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Assinantes" value={stats.total} color="primary" />
        <StatCard icon={CheckCircle2} label="Ativas" value={stats.active} color="accent" />
        <StatCard icon={AlertTriangle} label="Em Atraso" value={stats.overdue} color="orange" />
        <StatCard icon={Lock} label="Bloqueadas" value={stats.blocked} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <StatCard icon={DollarSign} label="Receita Mensal (MRR)" value={formatCurrency(stats.mrr)} color="accent" />
        <StatCard icon={DollarSign} label="Receita Anual (ARR)" value={formatCurrency(stats.arr)} color="primary" />
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={TrendingDown} label="Churn" value={`${stats.churnRate.toFixed(1)}%`} color="red" />
          <StatCard icon={AlertTriangle} label="Inadimplência" value={`${stats.defaultRate.toFixed(1)}%`} color="orange" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Assinantes
          </h3>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Nome, CNPJ, e-mail..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-sm bg-background" />
          </div>
        </div>

        {filteredSubs.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum assinante encontrado.</div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Empresa</th>
                  <th className="pb-2 font-medium hidden sm:table-cell">CNPJ</th>
                  <th className="pb-2 font-medium hidden md:table-cell">E-mail</th>
                  <th className="pb-2 font-medium">Próx. cobrança</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map(s => (
                  <tr key={s.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{s.billing_company_name || 'Não informado'}</p>
                      <p className="text-xs text-muted-foreground">{s.billing_responsible_name || ''}</p>
                    </td>
                    <td className="py-3 text-muted-foreground hidden sm:table-cell">{s.billing_cnpj || '—'}</td>
                    <td className="py-3 text-muted-foreground hidden md:table-cell">{s.billing_email || '—'}</td>
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{formatDate(s.next_billing_date)}</td>
                    <td className="py-3 text-center"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-accent" /> Últimos Pagamentos
        </h3>
        {stats.paidPayments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento recebido.</div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Método</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {stats.paidPayments.slice(0, 10).map(p => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{formatDate(p.payment_date)}</td>
                    <td className="py-3 text-foreground">{p.description || 'Mensalidade'}</td>
                    <td className="py-3 text-muted-foreground">{p.method === 'pix' ? 'PIX' : 'Cartão'}</td>
                    <td className="py-3 text-right font-medium text-accent-dark">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent-dark',
    orange: 'bg-orange-50 text-orange-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2", colors[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}
