import { useState, useMemo } from 'react';
import { TrendingUp, Minus, TrendingDown, Package, ArrowRight } from 'lucide-react';
import ABCBadge from '@/components/ABCBadge';
import EmptyState from '@/components/EmptyState';
import KPICard from '@/components/KPICard';
import { useProducts } from '@/hooks/useProducts';
import { formatCurrency, calculateInventoryValue } from '@/lib/pricing';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function ABC() {
  const { products, loading } = useProducts();
  const [selectedClass, setSelectedClass] = useState('all');

  const grouped = useMemo(() => {
    if (!products || products.length === 0) return null;
    const classA = products.filter(p => p.abc_class === 'A');
    const classB = products.filter(p => p.abc_class === 'B');
    const classC = products.filter(p => p.abc_class === 'C');
    return {
      A: { items: classA, value: calculateInventoryValue(classA), sales: classA.reduce((s, p) => s + (p.monthly_sales || 0), 0) },
      B: { items: classB, value: calculateInventoryValue(classB), sales: classB.reduce((s, p) => s + (p.monthly_sales || 0), 0) },
      C: { items: classC, value: calculateInventoryValue(classC), sales: classC.reduce((s, p) => s + (p.monthly_sales || 0), 0) },
    };
  }, [products]);

  const filtered = useMemo(() => {
    if (!products) return [];
    if (selectedClass === 'all') return products;
    return products.filter(p => p.abc_class === selectedClass);
  }, [products, selectedClass]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!grouped || products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Sem produtos para classificar"
        description="Importe produtos para visualizar a classificação ABC automática."
        action={<Link to="/importacao" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark">Importar Produtos</Link>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Classificação ABC</h1>
        <p className="text-sm text-muted-foreground">Análise automática de giro de estoque por relevância de vendas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
        <ClassCard
          title="Curva A — Alta Venda"
          icon={TrendingUp}
          color="accent"
          count={grouped.A.items.length}
          value={grouped.A.value}
          sales={grouped.A.sales}
          desc="70% do faturamento. Produtos de alta rotatividade."
          onClick={() => setSelectedClass('A')}
          selected={selectedClass === 'A'}
        />
        <ClassCard
          title="Curva B — Venda Média"
          icon={Minus}
          color="amber"
          count={grouped.B.items.length}
          value={grouped.B.value}
          sales={grouped.B.sales}
          desc="20% do faturamento. Venda regular e estável."
          onClick={() => setSelectedClass('B')}
          selected={selectedClass === 'B'}
        />
        <ClassCard
          title="Curva C — Baixa Venda"
          icon={TrendingDown}
          color="red"
          count={grouped.C.items.length}
          value={grouped.C.value}
          sales={grouped.C.sales}
          desc="10% do faturamento. Risco de encalhe — promova!"
          onClick={() => setSelectedClass('C')}
          selected={selectedClass === 'C'}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedClass('all')}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", selectedClass === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted')}
        >
          Todos ({products.length})
        </button>
        {['A', 'B', 'C'].map(cls => (
          <button
            key={cls}
            onClick={() => setSelectedClass(cls)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors", selectedClass === cls ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted')}
          >
            Curva {cls} ({grouped[cls].items.length})
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Fabricante</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Classe</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center hidden sm:table-cell">Vendas/mês</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Valor Estoque</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Custo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{product.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{product.manufacturer || '—'}</td>
                  <td className="px-4 py-3 text-center"><ABCBadge abcClass={product.abc_class} /></td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">{product.monthly_sales || 0}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency((product.cost || 0) * (product.quantity || 0))}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(product.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {grouped.C.items.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 text-sm mb-1">Atenção: Risco de Encalhe</p>
              <p className="text-sm text-red-700">
                Você tem <strong>{grouped.C.items.length} produtos</strong> de baixo giro somando <strong>{formatCurrency(grouped.C.value)}</strong> em capital parado.
                Crie promoções para estes produtos e libere capital de giro.
              </p>
              <Link to="/promocoes" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-red-700 hover:text-red-900">
                Criar promoção <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClassCard({ title, icon: Icon, color, count, value, sales, desc, onClick, selected }) {
  const colors = {
    accent: 'border-accent bg-accent/5',
    amber: 'border-amber-400 bg-amber-50',
    red: 'border-red-400 bg-red-50',
  };
  const iconColors = {
    accent: 'bg-accent text-accent-foreground',
    amber: 'bg-amber-500 text-white',
    red: 'bg-red-500 text-white',
  };
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-5 rounded-2xl border-2 transition-all hover:shadow-md",
        selected ? colors[color] : 'bg-card border-border hover:border-muted'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconColors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-2xl font-bold text-foreground">{count}</span>
      </div>
      <p className="font-semibold text-sm text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-2">{desc}</p>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Valor: <strong className="text-foreground">{formatCurrency(value)}</strong></span>
        <span className="text-muted-foreground">Vendas: <strong className="text-foreground">{sales}</strong></span>
      </div>
    </button>
  );
}