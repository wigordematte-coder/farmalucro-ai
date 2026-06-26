import { useMemo } from 'react';
import { Boxes, AlertTriangle, Calendar, Package, TrendingDown } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import EmptyState from '@/components/EmptyState';
import KPICard from '@/components/KPICard';
import { formatCurrency, formatNumber } from '@/lib/pricing';
import { Link } from 'react-router-dom';

export default function Estoque() {
  const { products, loading } = useProducts();

  const stats = useMemo(() => {
    if (!products || products.length === 0) return null;
    const totalItems = products.reduce((s, p) => s + (p.quantity || 0), 0);
    const lowStock = products.filter(p => (p.quantity || 0) <= 5 && (p.quantity || 0) > 0).length;
    const outOfStock = products.filter(p => !p.quantity || p.quantity === 0).length;
    const expiringSoon = products.filter(p => {
      if (!p.expiration_date) return false;
      const days = (new Date(p.expiration_date) - new Date()) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 90;
    }).length;
    const stockValue = products.reduce((s, p) => s + (p.cost || 0) * (p.quantity || 0), 0);
    return { totalItems, lowStock, outOfStock, expiringSoon, stockValue, total: products.length };
  }, [products]);

  const sortedProducts = useMemo(() => {
    if (!products) return [];
    return [...products].sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
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
        icon={Boxes}
        title="Nenhum produto em estoque"
        description="Importe sua primeira nota fiscal para visualizar o estoque."
        action={<Link to="/compras" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors">Importar Nota Fiscal</Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Estoque</h1>
        <p className="text-sm text-muted-foreground">Controle de quantidade, validade e valor em estoque</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        <KPICard title="Itens em Estoque" value={formatNumber(stats.totalItems)} icon="Package" color="primary" />
        <KPICard title="Valor em Estoque" value={formatCurrency(stats.stockValue)} icon="Boxes" color="accent" />
        <KPICard title="Estoque Baixo" value={formatNumber(stats.lowStock)} icon="AlertTriangle" color="amber" />
        <KPICard title="Sem Estoque" value={formatNumber(stats.outOfStock)} icon="TrendingDown" color="red" />
        <KPICard title="Vencendo (90d)" value={formatNumber(stats.expiringSoon)} icon="Calendar" color="amber" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Produtos por Quantidade</h3>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Quantidade</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Custo Unit.</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Valor Total</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Validade</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.slice(0, 50).map(p => {
                const qty = p.quantity || 0;
                const isOut = qty === 0;
                const isLow = qty > 0 && qty <= 5;
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                    <td className="px-4 py-3 text-center font-medium">{qty}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatCurrency(p.cost || 0)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency((p.cost || 0) * qty)}</td>
                    <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                      {p.expiration_date ? new Date(p.expiration_date).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isOut ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Sem estoque</span>
                      ) : isLow ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-600">Baixo</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent-dark">Normal</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}