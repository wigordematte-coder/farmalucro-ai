import { useState, useMemo } from 'react';
import { Plus, Search, Pencil, Trash2, Package, Filter, TrendingUp, Tag, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProductForm from '@/components/ProductForm';
import ABCBadge from '@/components/ABCBadge';
import EmptyState from '@/components/EmptyState';
import { useProducts } from '@/hooks/useProducts';
import { calculateProductMetrics, formatCurrency, formatPercent, isExpiringSoon } from '@/lib/pricing';
import { cn } from '@/lib/utils';

export default function Products() {
  const { products, loading, reloadProducts, settings } = useProducts();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const filtered = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchSearch = !search ||
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === 'all' ||
        (filter === 'promotion' && p.on_promotion) ||
        (filter === 'risk' && (p.risk_of_obsolescence || p.abc_class === 'C')) ||
        (filter === 'high_margin' && (p.high_margin || (p.margin_pct || 0) >= 35)) ||
        (filter === 'expiring' && isExpiringSoon(p.expiration_date));
      return matchSearch && matchFilter;
    });
  }, [products, search, filter]);

  const handleSave = async (data) => {
    try {
      if (editingProduct?.id) {
        await base44.entities.Product.update(editingProduct.id, data);
      } else {
        await base44.entities.Product.create(data);
      }
      setShowForm(false);
      setEditingProduct(null);
      reloadProducts();
    } catch (e) {
      alert('Erro ao salvar produto');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await base44.entities.Product.delete(id);
      reloadProducts();
    } catch (e) {
      alert('Erro ao excluir produto');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products?.length || 0} produtos cadastrados</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors"
        >
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, fabricante ou categoria..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {[
            { key: 'all', label: 'Todos' },
            { key: 'promotion', label: 'Em Promoção', icon: Tag },
            { key: 'risk', label: 'Risco Encalhe', icon: AlertTriangle },
            { key: 'high_margin', label: 'Alta Margem', icon: TrendingUp },
            { key: 'expiring', label: 'Vencendo', icon: Package },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"
              )}
            >
              {f.icon && <f.icon className="w-3.5 h-3.5" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nenhum produto encontrado"
          description={products?.length === 0 ? "Importe uma nota fiscal ou adicione produtos manualmente." : "Tente ajustar os filtros de busca."}
          action={products?.length === 0 ? <button onClick={() => { setEditingProduct(null); setShowForm(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark"><Plus className="w-4 h-4" /> Adicionar Produto</button> : null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} settings={settings} onEdit={() => { setEditingProduct(product); setShowForm(true); }} onDelete={() => handleDelete(product.id)} />
          ))}
        </div>
      )}

      {showForm && (
        <ProductForm
          product={editingProduct}
          settings={settings}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
        />
      )}
    </div>
  );
}

function ProductCard({ product, settings, onEdit, onDelete }) {
  const metrics = calculateProductMetrics(product, settings);
  const expiring = isExpiringSoon(product.expiration_date);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground truncate">{product.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{product.manufacturer} · {product.category || 'Sem categoria'}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary"><Pencil className="w-3.5 h-3.5" /></button>
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        {product.abc_class && <ABCBadge abcClass={product.abc_class} />}
        {product.on_promotion && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">PROMO</span>}
        {expiring && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">VENCENDO</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Custo</p>
          <p className="font-bold text-foreground">{formatCurrency(product.cost)}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Preço</p>
          <p className="font-bold text-accent-dark">{formatCurrency(metrics.selected_price)}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Lucro/Un.</p>
          <p className="font-bold text-foreground">{formatCurrency(metrics.unit_profit)}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <p className="text-muted-foreground">Margem</p>
          <p className="font-bold text-foreground">{formatPercent(metrics.margin_pct)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Estoque: <strong className="text-foreground">{product.quantity || 0}</strong></span>
        <span className="text-muted-foreground">ROI: <strong className="text-accent-dark">{formatPercent(metrics.roi)}</strong></span>
      </div>
    </div>
  );
}