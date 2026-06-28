import { useMemo, useState } from 'react';
import { DollarSign, AlertTriangle, Star, TrendingUp, Search } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCategoryMargins } from '@/hooks/useCategoryMargins';
import EmptyState from '@/components/EmptyState';
import KPICard from '@/components/KPICard';
import PricingTable from '@/components/pricing/PricingTable';
import PricingSimulator from '@/components/pricing/PricingSimulator';
import CategoryMarginsConfig from '@/components/pricing/CategoryMarginsConfig';
import { formatCurrency, getPricingRecommendation, getCategoryMargin, detectPricingProblems } from '@/lib/pricing';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';

export default function Precificacao() {
  const { products, loading, settings, reloadProducts } = useProducts();
  const { margins, loading: marginsLoading, updateMargin, createMargin, deleteMargin } = useCategoryMargins();
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(null);
  const [saved, setSaved] = useState(null);
  const [simulatorProduct, setSimulatorProduct] = useState(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter(p => (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q));
  }, [products, search]);

  const stats = useMemo(() => {
    if (!products || products.length === 0) return null;

    const minMargin = settings?.min_margin || 15;
    const lowMarginCount = products.filter(p => (p.margin_pct || 0) < minMargin).length;

    const reajusteProducts = products.filter(p => {
      const rec = getPricingRecommendation(p, settings, margins);
      return rec.potentialMonthlyGain > 0;
    });

    const totalPotentialGain = products.reduce((s, p) => {
      const rec = getPricingRecommendation(p, settings, margins);
      return s + rec.potentialMonthlyGain;
    }, 0);

    const catStats = {};
    products.forEach(p => {
      const cat = p.category || 'Sem categoria';
      if (!catStats[cat]) catStats[cat] = { profit: 0, count: 0 };
      catStats[cat].profit += (p.unit_profit || 0) * (p.monthly_sales || 0);
      catStats[cat].count++;
    });
    const topCategories = Object.entries(catStats).filter(([, d]) => d.profit > 0).sort((a, b) => b[1].profit - a[1].profit);

    const outOfTargetCount = products.filter(p => {
      const catMargin = getCategoryMargin(p.category, margins, settings);
      return (p.margin_pct || 0) < catMargin;
    }).length;

    return {
      lowMarginCount,
      reajusteCount: reajusteProducts.length,
      totalPotentialGain,
      topCategory: topCategories[0]?.[0] || '—',
      topCategories,
      outOfTargetCount,
      total: products.length,
    };
  }, [products, settings, margins]);

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

  const handleSimulatorSave = async (product, newPrice) => {
    await handlePriceChange(product, 'selected_price', newPrice);
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
        action={<Link to="/importacao" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors">Importar Nota Fiscal</Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Precificação Inteligente</h1>
        <p className="text-sm text-muted-foreground">Defina preços estratégicos e maximize o lucro</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <KPICard title="Margem Baixa" value={stats.lowMarginCount} subtitle="produtos" icon={AlertTriangle} color="red" />
        <KPICard title="Potencial de Reajuste" value={stats.reajusteCount} subtitle="produtos" icon={TrendingUp} color="blue" />
        <KPICard title="Ganho Potencial" value={formatCurrency(stats.totalPotentialGain)} subtitle="por mês" icon={DollarSign} color="accent" />
        <KPICard title="Fora da Meta" value={stats.outOfTargetCount} subtitle="produtos" icon={AlertTriangle} color="amber" />
        <KPICard title="Top Categoria" value={stats.topCategory} subtitle="mais rentável" icon={Star} color="purple" />
      </div>

      <CategoryMarginsConfig margins={margins} onUpdate={updateMargin} onCreate={createMargin} onDelete={deleteMargin} />

      {stats.topCategories.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-accent-dark" /> Categorias Mais Rentáveis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {stats.topCategories.slice(0, 6).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-foreground text-sm">{cat}</p>
                  <p className="text-xs text-muted-foreground">{data.count} produtos</p>
                </div>
                <span className="font-semibold text-accent-dark text-sm">{formatCurrency(data.profit)}/mês</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-foreground">Produtos</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..."
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border text-sm bg-background w-48" />
        </div>
      </div>

      <PricingTable
        products={filtered.slice(0, 100)}
        settings={settings}
        margins={margins}
        onSimulate={setSimulatorProduct}
        onPriceChange={handlePriceChange}
        saving={saving}
        saved={saved}
      />

      <PricingSimulator
        product={simulatorProduct}
        open={!!simulatorProduct}
        onClose={() => setSimulatorProduct(null)}
        onSave={handleSimulatorSave}
        settings={settings}
        margins={margins}
      />
    </div>
  );
}