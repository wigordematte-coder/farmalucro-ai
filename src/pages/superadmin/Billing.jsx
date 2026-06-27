import { useState, useEffect } from 'react';
import { Wallet, CheckCircle2, Clock, XCircle, RefreshCw, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/pricing';

export default function Billing() {
  const [transactions, setTransactions] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [tx, wh] = await Promise.all([
          base44.entities.TransactionLog.list('-created_date', 200),
          base44.entities.WebhookEvent.list('-created_date', 50),
        ]);
        setTransactions(tx || []);
        setWebhooks(wh || []);
      } catch { setTransactions([]); setWebhooks([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const approved = transactions.filter(t => t.status === 'approved');
  const totalRevenue = approved.reduce((s, t) => s + (t.amount || 0), 0);
  const pending = transactions.filter(t => t.status === 'pending').length;
  const declined = transactions.filter(t => t.status === 'declined').length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
          <Wallet className="w-6 h-6 text-purple-600" /> Cobranças
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Transações, pagamentos e webhooks</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={CheckCircle2} label="Aprovadas" value={approved.length} color="accent" />
        <StatCard icon={Clock} label="Pendentes" value={pending} color="amber" />
        <StatCard icon={XCircle} label="Recusadas" value={declined} color="red" />
        <StatCard icon={Wallet} label="Receita Total" value={formatCurrency(totalRevenue)} color="primary" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Transações</h3>
        </div>
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma transação registrada</div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Gateway</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Valor</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{t.transaction_id?.substring(0, 12) || '—'}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{t.client_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.gateway_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(t.amount || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {webhooks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Webhooks Recebidos</h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Gateway</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Evento</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Transação</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Processado</th>
                </tr>
              </thead>
              <tbody>
                {webhooks.map(w => (
                  <tr key={w.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 text-muted-foreground">{w.gateway_name}</td>
                    <td className="px-4 py-3 font-medium text-foreground text-xs">{w.event_type}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{w.transaction_id?.substring(0, 12) || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      {w.processed ? (
                        <CheckCircle2 className="w-4 h-4 text-accent inline" />
                      ) : (
                        <RefreshCw className="w-4 h-4 text-amber-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    approved: { label: 'Aprovado', cls: 'bg-accent/10 text-accent-dark' },
    declined: { label: 'Recusado', cls: 'bg-red-50 text-red-600' },
    pending: { label: 'Pendente', cls: 'bg-amber-50 text-amber-600' },
    refunded: { label: 'Reembolsado', cls: 'bg-blue-50 text-blue-600' },
    cancelled: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-600' },
    error: { label: 'Erro', cls: 'bg-red-50 text-red-600' },
  };
  const c = cfg[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>;
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/10 text-accent-dark',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  };
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{value}</p>
    </div>
  );
}