import { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, Wallet, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#1e3a5f', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

export default function Revenue() {
  const [payments, setPayments] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, s] = await Promise.all([
          base44.entities.Payment.list('-created_date', 200),
          base44.entities.Subscription.list('-created_date', 500),
        ]);
        setPayments(p || []);
        setSubscriptions(s || []);
      } catch { setPayments([]); setSubscriptions([]); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const paid = payments.filter(p => p.status === 'paid');
    const totalRevenue = paid.reduce((sum, p) => sum + (p.amount || 0), 0);
    const now = new Date();
    const monthRevenue = paid.filter(p => p.payment_date && new Date(p.payment_date).getMonth() === now.getMonth() && new Date(p.payment_date).getFullYear() === now.getFullYear()).reduce((sum, p) => sum + (p.amount || 0), 0);
    const yearRevenue = paid.filter(p => p.payment_date && new Date(p.payment_date).getFullYear() === now.getFullYear()).reduce((sum, p) => sum + (p.amount || 0), 0);
    const activeCount = subscriptions.filter(s => s.status === 'active').length;
    const avgRevenue = activeCount > 0 ? totalRevenue / activeCount : 0;
    return { totalRevenue, monthRevenue, yearRevenue, avgRevenue, paidCount: paid.length, activeCount };
  }, [payments, subscriptions]);

  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      const revenue = payments
        .filter(p => p.status === 'paid' && p.payment_date)
        .filter(p => { const pd = new Date(p.payment_date); return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear(); })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      months.push({ month: label, receita: revenue });
    }
    return months;
  }, [payments]);

  const methodData = useMemo(() => {
    const pix = payments.filter(p => p.status === 'paid' && p.method === 'pix').length;
    const card = payments.filter(p => p.status === 'paid' && p.method === 'credit_card').length;
    return [
      { name: 'PIX', value: pix },
      { name: 'Cartão', value: card },
    ].filter(d => d.value > 0);
  }, [payments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-accent-dark" /> Receita SaaS
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Análise de receita e cobranças da plataforma</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Receita Total" value={formatCurrency(stats.totalRevenue)} color="accent" />
        <StatCard icon={TrendingUp} label="Receita do Mês" value={formatCurrency(stats.monthRevenue)} color="primary" />
        <StatCard icon={Wallet} label="Receita do Ano" value={formatCurrency(stats.yearRevenue)} color="accent" />
        <StatCard icon={CreditCard} label="Pagamentos Recebidos" value={stats.paidCount} color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Receita Mensal (6 meses)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatCurrency(v)} />
              <Bar dataKey="receita" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Métodos de Pagamento</h3>
          {methodData.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={methodData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {methodData.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-semibold text-foreground mb-4">Cobranças Recentes</h3>
        {payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma cobrança registrada.</div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Método</th>
                  <th className="pb-2 font-medium text-center">Status</th>
                  <th className="pb-2 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 15).map(p => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-muted-foreground whitespace-nowrap">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="py-3 text-foreground">{p.description || 'Mensalidade'}</td>
                    <td className="py-3 text-muted-foreground">{p.method === 'pix' ? 'PIX' : 'Cartão'}</td>
                    <td className="py-3 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                        p.status === 'paid' ? 'bg-accent/10 text-accent-dark' :
                        p.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                        p.status === 'failed' ? 'bg-red-50 text-red-600' :
                        'bg-muted text-muted-foreground')}>
                        {p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : p.status === 'failed' ? 'Falhou' : p.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-medium text-foreground">{formatCurrency(p.amount)}</td>
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