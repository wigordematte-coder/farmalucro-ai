import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Users, CheckCircle2, AlertTriangle, DollarSign, TrendingDown,
  TrendingUp, UserPlus, UserMinus, Globe, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { formatCurrency } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  active: '#22c55e', trial: '#3b82f6', overdue: '#f59e0b',
  blocked: '#ef4444', pending_payment: '#f59e0b', cancelled: '#6b7280', suspended: '#a855f7',
};
const STATUS_LABELS = {
  active: 'Ativas', trial: 'Trial', overdue: 'Em Atraso',
  blocked: 'Bloqueadas', pending_payment: 'Pag. Pendente', cancelled: 'Canceladas', suspended: 'Suspensas',
};
const CHART_COLORS = ['#1e3a5f', '#22c55e', '#f59e0b', '#ef4444', '#a855f7', '#6b7280'];

export default function AdminPanel() {
  const [tenants, setTenants] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, s, p, u] = await Promise.all([
          base44.entities.Tenant.list('-created_date', 500),
          base44.entities.Subscription.list('-created_date', 500),
          base44.entities.Payment.list('-created_date', 200),
          base44.entities.User.list('-created_date', 500),
        ]);
        setTenants(t || []);
        setSubscriptions(s || []);
        setPayments(p || []);
        setUsers(u || []);
      } catch {
        setTenants([]); setSubscriptions([]); setPayments([]); setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    const totalTenants = tenants.length;
    const totalUsers = users.length;
    const activeSubs = subscriptions.filter(s => s.status === 'active').length;
    const overdueSubs = subscriptions.filter(s => s.status === 'overdue' || s.status === 'pending_payment').length;
    const blockedSubs = subscriptions.filter(s => s.status === 'blocked').length;
    const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled').length;

    const mrr = activeSubs * 197;
    const arr = mrr * 12;
    const churnRate = totalTenants > 0 ? (cancelledSubs / totalTenants) * 100 : 0;

    const now = new Date();
    const newThisMonth = tenants.filter(t => {
      if (!t.created_date) return false;
      const d = new Date(t.created_date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const paidPayments = payments.filter(p => p.status === 'paid');
    const monthRevenue = paidPayments
      .filter(p => p.payment_date && new Date(p.payment_date).getMonth() === now.getMonth() && new Date(p.payment_date).getFullYear() === now.getFullYear())
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const yearRevenue = paidPayments
      .filter(p => p.payment_date && new Date(p.payment_date).getFullYear() === now.getFullYear())
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return { totalTenants, totalUsers, activeSubs, overdueSubs, blockedSubs, cancelledSubs, mrr, arr, churnRate, newThisMonth, monthRevenue, yearRevenue };
  }, [tenants, subscriptions, payments, users]);

  const statusData = useMemo(() => {
    const counts = {};
    subscriptions.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status, value: count, status
    }));
  }, [subscriptions]);

  const monthlyData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short' });
      const newClients = tenants.filter(t => {
        if (!t.created_date) return false;
        const td = new Date(t.created_date);
        return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
      }).length;
      const revenue = payments
        .filter(p => p.status === 'paid' && p.payment_date)
        .filter(p => {
          const pd = new Date(p.payment_date);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      months.push({ month: label, novos: newClients, receita: revenue });
    }
    return months;
  }, [tenants, payments]);

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
          <Globe className="w-6 h-6 text-purple-600" /> Dashboard Global
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Visão geral da plataforma FarmaLucro AI</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Building2} label="Total de Farmácias" value={stats.totalTenants} color="purple" />
        <StatCard icon={Users} label="Total de Usuários" value={stats.totalUsers} color="primary" />
        <StatCard icon={CheckCircle2} label="Assinaturas Ativas" value={stats.activeSubs} color="accent" />
        <StatCard icon={AlertTriangle} label="Em Atraso" value={stats.overdueSubs} color="orange" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Receita Mensal (MRR)" value={formatCurrency(stats.mrr)} color="accent" />
        <StatCard icon={DollarSign} label="Receita Anual (ARR)" value={formatCurrency(stats.arr)} color="primary" />
        <StatCard icon={TrendingDown} label="Churn" value={`${stats.churnRate.toFixed(1)}%`} color="red" />
        <StatCard icon={TrendingUp} label="Novos Clientes (mês)" value={stats.newThisMonth} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <StatCard icon={DollarSign} label="Receita do Mês" value={formatCurrency(stats.monthRevenue)} color="accent" />
        <StatCard icon={DollarSign} label="Receita do Ano" value={formatCurrency(stats.yearRevenue)} color="primary" />
        <StatCard icon={UserMinus} label="Canceladas" value={stats.cancelledSubs} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Novos Clientes & Receita (6 meses)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="novos" name="Novos Clientes" fill="#1e3a5f" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="receita" name="Receita (R$)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Distribuição de Assinaturas</h3>
          {statusData.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {statusData.map((entry, idx) => (
                    <Cell key={idx} fill={STATUS_COLORS[entry.status] || CHART_COLORS[idx % CHART_COLORS.length]} />
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
        <h3 className="font-semibold text-foreground mb-4">Tendência de Receita (6 meses)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyData}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={v => formatCurrency(v)} />
            <Area type="monotone" dataKey="receita" name="Receita" stroke="#22c55e" strokeWidth={2} fill="url(#revGradient)" />
          </AreaChart>
        </ResponsiveContainer>
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
    purple: 'bg-purple-100 text-purple-700',
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