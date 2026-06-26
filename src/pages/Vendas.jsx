import { useMemo } from 'react';
import { TrendingUp, DollarSign, Package, BarChart3, Trophy, ShoppingCart } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { useProducts } from '@/hooks/useProducts';
import EmptyState from '@/components/EmptyState';
import KPICard from '@/components/KPICard';
import { formatCurrency, formatNumber } from '@/lib/pricing';
import { Link } from 'react-router-dom';

const COLORS = ['#1e3a5f', '#22c55e', '#f59e0b', '#a855f7', '#ef4444', '#3b82f6'];

export default function Vendas() {
  const { products, loading } = useProducts();

  const stats = useMemo(() => {
    if (!products || products.length === 0) return null;
    const totalSales = products.reduce((s, p) => s + (p.monthly_sales || 0), 0);
    const totalRevenue = products.reduce((s, p) => s + (p.selected_price || 0) * (p.monthly_sales || 0), 0);
    const totalProfit = products.reduce((s, p) => s + ((p.selected_price || 0) - (p.cost || 0)) * (p.monthly_sales || 0), 0);
    const topProducts = [...products].sort((a, b) => (b.monthly_sales || 0) - (a.monthly_sales || 0)).slice(0, 8);
    const categoryData = {};
    products.forEach(p => {
      const cat = p.category || 'Sem categoria';
      categoryData[cat] = (categoryData[cat] || 0) + (p.monthly_sales || 0);
    });
    const categoryChart = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return { totalSales, totalRevenue, totalProfit, topProducts, categoryChart, total: products.length };
  }, [products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats || products.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Sem dados de vendas"
        description="Cadastre produtos e registre vendas mensais para visualizar o desempenho."
        action={<Link to="/produtos" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors">Ver Produtos</Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Vendas</h1>
        <p className="text-sm text-muted-foreground">Desempenho de vendas, produtos mais vendidos e receita</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KPICard title="Vendas Mensais" value={formatNumber(stats.totalSales)} icon="ShoppingCart" color="primary" />
        <KPICard title="Receita Mensal" value={formatCurrency(stats.totalRevenue)} icon="DollarSign" color="accent" />
        <KPICard title="Lucro Mensal" value={formatCurrency(stats.totalProfit)} icon="TrendingUp" color="accent" />
        <KPICard title="Produtos Ativos" value={formatNumber(stats.total)} icon="Package" color="blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Top Produtos por Venda</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.topProducts.map(p => ({ name: (p.name || '').substring(0, 15), vendas: p.monthly_sales || 0 }))} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
              <Bar dataKey="vendas" fill="hsl(142 71% 45%)" radius={[0, 6, 6, 0]} name="Vendas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-4">Vendas por Categoria</h3>
          {stats.categoryChart.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Sem dados</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stats.categoryChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {stats.categoryChart.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" /> Produtos Mais Vendidos
          </h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Vendas/Mês</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Preço</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Receita</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Lucro</th>
              </tr>
            </thead>
            <tbody>
              {stats.topProducts.map((p, idx) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 text-muted-foreground font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                  <td className="px-4 py-3 text-center">{p.monthly_sales || 0}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.selected_price || 0)}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency((p.selected_price || 0) * (p.monthly_sales || 0))}</td>
                  <td className="px-4 py-3 text-right text-accent-dark font-medium">{formatCurrency(((p.selected_price || 0) - (p.cost || 0)) * (p.monthly_sales || 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}