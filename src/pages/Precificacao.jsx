import { useMemo, useState } from 'react';
import { DollarSign, Percent, TrendingUp, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import EmptyState from '@/components/EmptyState';
import KPICard from '@/components/KPICard';
import { formatCurrency, formatPercent } from '@/lib/pricing';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export default function Precificacao() {
  const { products, loading, settings, reloadProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => (p.name || '').toLowerCase().includes(q));
  }, [products, search]);

  const stats = useMemo(() => {
    if (!products || products.length === 0) return null;
    const avgMargin = products.reduce((s, p) => s + (p.margin_pct || 0), 0) / products.length;
    const avgROI = products.reduce((s, p) => s + (p.roi || 0), 0) / products.length;
    const totalProfit = products.reduce((s, p) => s + (p.unit_profit || 0) * (p.quantity || 0), 0);
    const highMarginCount = products.filter(p => (p.margin_pct || 0) >= 35).length;
    return { avgMargin, avgROI, totalProfit, highMarginCount, total: products.length };
  }, [products]);

  const handlePriceChange = async (product, field, value) => {
    setSaving(product.id);
    try {
      const cost = product.cost || 0;
      let updates = { [field]: Number(value) };

      if (field === 'selected_price') {
        const newPrice = Number(value);
        const unitProfit = newPrice - cost;
        const marginPct = newPrice > 0 ? ((newPrice - cost) / newPrice) * 100 : 0;
        updates.unit_profit = Math.round(unitProfit * 100) / 100;
        updates.margin_pct = Math.round(marginPct * 100) / 100;
        updates.roi = cost > 0 ? Math.round((unitProfit / cost) * 100 * 100) / 100 : 0;
        updates.high_margin = marginPct >= 35;
      }

      await base44.entities.Product.update(product.id, updates);
      setSaved(product.id);
      setTimeout(() => setSaved(null), 2000);
      reloadProducts();
    } catch {
      alert('Erro ao atualizar preço.');
    } finally {
      setSaving(null);
    }
  };

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
        icon={DollarSign}
        title="Nenhum produto para precificar"
        description="Importe produtos para definir preços e otimizar margens de lucro."
        action={<Link to="/compras" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors">Importar Produtos</Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Precificação</h1>
        <p className="text-sm text-muted-foreground">Ajuste preços e monitore margens de lucro</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
        <KPICard title="Margem Média" value={formatPercent(stats.avgMargin)} icon="Percent" color="accent" />
        <KPICard title="ROI Médio" value={formatPercent(stats.avgROI)} icon="TrendingUp" color="primary" />
        <KPICard title="Lucro Potencial" value={formatCurrency(stats.totalProfit)} icon="DollarSign" color="accent" />
        <KPICard title="Alta Margem" value={stats.highMarginCount} icon="CheckCircle2" color="blue" />
      </div>

      {settings && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-4 flex-wrap text-sm">
            <span className="text-muted-foreground font-medium">Margens configuradas:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> Mínima: {settings.min_margin}%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-accent" /> Ideal: {settings.ideal_margin}%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-500" /> Máxima: {settings.max_margin}%</span>
            <Link to="/configuracoes" className="text-xs text-primary hover:underline ml-auto">Ajustar margens</Link>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <h3 className="font-semibold text-foreground">Preços dos Produtos</h3>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
            className="px-3 py-1.5 rounded-lg border border-border text-sm bg-background w-48" />
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Custo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Preço Agressivo</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Preço Equilibrado</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Preço Premium</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Preço Atual</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Margem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map(p => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{p.name}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.cost || 0)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">{formatCurrency(p.price_aggressive || 0)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">{formatCurrency(p.price_balanced || 0)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground text-xs">{formatCurrency(p.price_premium || 0)}</td>
                  <td className="px-4 py-3 text-right">
                    {saving === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground inline" />
                    ) : saved === p.id ? (
                      <CheckCircle2 className="w-4 h-4 text-accent inline" />
                    ) : (
                      <input type="number" step="0.01" defaultValue={p.selected_price || 0}
                        onBlur={e => e.target.value != p.selected_price && handlePriceChange(p, 'selected_price', e.target.value)}
                        className="w-24 px-2 py-1 rounded border border-border text-right text-sm bg-background" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                      (p.margin_pct || 0) >= 35 ? "bg-accent/10 text-accent-dark" :
                      (p.margin_pct || 0) >= 15 ? "bg-blue-50 text-blue-600" :
                      "bg-red-50 text-red-600")}>
                      {formatPercent(p.margin_pct || 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}