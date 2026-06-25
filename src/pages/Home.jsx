import { useMemo } from 'react';
import { Package, DollarSign, TrendingUp, Tag, AlertTriangle, Sparkles, Percent, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import KPICard from '@/components/KPICard';
import InsightBanner from '@/components/InsightBanner';
import EmptyState from '@/components/EmptyState';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency, formatNumber, formatPercent, calculatePotentialRevenue, calculatePotentialProfit, calculateInventoryValue } from '@/lib/pricing';
import { Link } from 'react-router-dom';

export default function Home() {
  const { products, loading, settings } = useProducts();

  const stats = useMemo(() => {
    if (!products || products.length === 0) return null;
    const totalRevenue = calculatePotentialRevenue(products);
    const totalProfit = calculatePotentialProfit(products);
    const inventoryValue = calculateInventoryValue(products);
    const avgMargin = products.reduce((s, p) => s + (p.margin_pct || 0), 0) / products.length;
    const avgROI = products.reduce((s, p) => s + (p.roi || 0), 0) / products.length;
    const onPromotion = products.filter(p => p.on_promotion).length;
    const riskObsolescence = products.filter(p => p.risk_of_obsolescence || p.abc_class === 'C').length;
    const highMargin = products.filter(p => p.high_margin || (p.margin_pct || 0) >= 35).length;

    return {
      totalRevenue, totalProfit, inventoryValue, avgMargin, avgROI,
      total: products.length, onPromotion, riskObsolescence, highMargin
    };
  }, [products]);

  const chartData = useMemo(() => {
    if (!products || products.length === 0) return null;

    const abcData = [
      { name: 'Curva A', value: products.filter(p => p.abc_class === 'A').length, fill: 'hsl(142 71% 45%)' },
      { name: 'Curva B', value: products.filter(p => p.abc_class === 'B').length, fill: 'hsl(38 92% 50%)' },
      { name: 'Curva C', value: products.filter(p => p.abc_class === 'C').length, fill: 'hsl(0 84% 60%)' },
    ].filter(d => d.value > 0);

    const marginData = [
      { name: '< 15%', count: products.filter(p => (p.margin_pct || 0) < 15).length },
      { name: '15-30%', count: products.filter(p => (p.margin_pct || 0) >= 15 && (p.margin_pct || 0) < 30).length },
      { name: '30-45%', count: products.filter(p => (p.margin_pct || 0) >= 30 && (p.margin_pct || 0) < 45).length },
      { name: '> 45%', count: products.filter(p => (p.margin_pct || 0) >= 45).length },
    ];

    const revenueData = products.slice(0, 8).map(p => ({
      name: (p.name || '').substring(0, 12),
      lucro: Number(((p.selected_price || 0) - (p.cost || 0)) * (p.quantity || 0)).toFixed(0),
      custo: Number((p.cost || 0) * (p.quantity || 0)).toFixed(0),
    }));

    const turnoverData = [
      { name: 'Sem 1', giro: 65 },
      { name: 'Sem 2', giro: 72 },
      { name: 'Sem 3', giro: 68 },
      { name: 'Sem 4', giro: 80 },
    ];

    return { abcData, marginData, revenueData, turnoverData };
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
      <div className="space-y-6">
        <InsightBanner products={products} settings={settings} />
        <EmptyState
          icon={Package}
          title="Nenhum produto cadastrado"
          description="Importe sua primeira nota fiscal para começar a receber insights de IA e recomendações de precificação."
          action={
            <Link to="/importacao" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors">
              Importar Nota Fiscal
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <InsightBanner products={products} settings={settings} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        <KPICard title="Faturamento Potencial" value={formatCurrency(stats.totalRevenue)} icon="DollarSign" color="primary" to="/produtos" />
        <KPICard title="Lucro Potencial" value={formatCurrency(stats.totalProfit)} icon="TrendingUp" color="accent" trend={12.5} to="/produtos" />
        <KPICard title="ROI Estimado" value={formatPercent(stats.avgROI)} icon="Percent" color="purple" />
        <KPICard title="Produtos Cadastrados" value={formatNumber(stats.total)} icon="Package" color="blue" to="/produtos" />
        <KPICard title="Em Promoção" value={formatNumber(stats.onPromotion)} icon="Tag" color="amber" to="/promocoes" />
        <KPICard title="Risco de Encalhe" value={formatNumber(stats.riskObsolescence)} icon="AlertTriangle" color="red" to="/curva-abc" />
        <KPICard title="Alta Margem" value={formatNumber(stats.highMargin)} icon="Sparkles" color="accent" to="/produtos" />
        <KPICard title="Valor em Estoque" value={formatCurrency(stats.inventoryValue)} icon="BarChart3" color="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <ChartCard title="Rentabilidade por Produto" subtitle="Lucro vs Custo de estoque">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
              <Bar dataKey="custo" fill="hsl(217 70% 30%)" radius={[6, 6, 0, 0]} name="Custo" />
              <Bar dataKey="lucro" fill="hsl(142 71% 45%)" radius={[6, 6, 0, 0]} name="Lucro" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Giro de Estoque" subtitle="Evolução semanal (%)">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData.turnoverData}>
              <defs>
                <linearGradient id="turnoverGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
              <Area type="monotone" dataKey="giro" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#turnoverGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição de Margem" subtitle="Quantidade de produtos por faixa">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData.marginData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Produtos">
                {chartData.marginData.map((entry, i) => (
                  <Cell key={i} fill={['hsl(0 84% 60%)', 'hsl(38 92% 50%)', 'hsl(217 70% 30%)', 'hsl(142 71% 45%)'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Classificação ABC" subtitle="Distribuição de produtos">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={chartData.abcData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                {chartData.abcData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <PieLegend />
        </ChartCard>
      </div>
    </div>
  );
}

function PieLegend() {
  return (
    <div className="flex items-center justify-center gap-4 mt-2 flex-wrap">
      <LegendItem color="hsl(142 71% 45%)" label="Curva A — Alta venda" />
      <LegendItem color="hsl(38 92% 50%)" label="Curva B — Venda média" />
      <LegendItem color="hsl(0 84% 60%)" label="Curva C — Baixa venda" />
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full" style={{ background: color }} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}