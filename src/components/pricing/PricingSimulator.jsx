import { useState, useEffect } from 'react';
import { Calculator, Save, Loader2, TrendingUp, TrendingDown, Zap, Scale, Crown } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatPercent, simulatePriceChange, calculateCategoryPrices, getCategoryMargin } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const STRATEGIES = [
  { key: 'aggressive', label: 'Agressivo', icon: Zap, color: 'blue', desc: 'Maior competitividade' },
  { key: 'balanced', label: 'Equilibrado', icon: Scale, color: 'accent', desc: 'Recomendado' },
  { key: 'premium', label: 'Premium', icon: Crown, color: 'purple', desc: 'Maximizar lucro' },
];

export default function PricingSimulator({ product, open, onClose, onSave, settings, margins }) {
  const [newPrice, setNewPrice] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) setNewPrice(product.selected_price || 0);
  }, [product]);

  if (!product) return null;

  const categoryMargin = getCategoryMargin(product.category, margins, settings);
  const prices = calculateCategoryPrices(product.cost || 0, categoryMargin);
  const sim = simulatePriceChange(newPrice, product);
  const currentMargin = product.margin_pct || 0;
  const marginDiff = sim.marginPct - currentMargin;

  const handleSave = async () => {
    setSaving(true);
    await onSave(product, newPrice);
    setSaving(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-accent" /> Simulador de Preço
          </SheetTitle>
          <SheetDescription>{product.name}</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="bg-muted/30 rounded-xl p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Custo</span><span className="font-medium">{formatCurrency(product.cost || 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Preço Atual</span><span className="font-medium">{formatCurrency(product.selected_price || 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Margem Atual</span><span className="font-medium">{formatPercent(currentMargin)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Margem da Categoria</span><span className="font-medium">{formatPercent(categoryMargin)}</span></div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Estratégias recomendadas</p>
            <div className="grid grid-cols-3 gap-2">
              {STRATEGIES.map(s => {
                const Icon = s.icon;
                const price = s.key === 'aggressive' ? prices.aggressive : s.key === 'premium' ? prices.premium : prices.balanced;
                return (
                  <button key={s.key} onClick={() => setNewPrice(price)}
                    className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all",
                      Math.abs(newPrice - price) < 0.01 ? "border-accent bg-accent/5" : "border-border hover:border-accent/50")}>
                    <Icon className={cn("w-4 h-4", s.color === 'blue' ? 'text-blue-500' : s.color === 'accent' ? 'text-accent' : 'text-purple-500')} />
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{formatCurrency(price)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Novo Preço</label>
            <input type="number" step="0.01" value={newPrice} onChange={e => setNewPrice(Number(e.target.value))}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Resultado da Simulação</h4>
            <SimRow label="Nova Margem" value={formatPercent(sim.marginPct)} diff={marginDiff} />
            <SimRow label="Novo Lucro Unitário" value={formatCurrency(sim.unitProfit)} diff={sim.unitProfit - ((product.selected_price || 0) - (product.cost || 0))} />
            <SimRow label="Lucro Estimado Mensal" value={formatCurrency(sim.monthlyProfit)} diff={sim.difference} isCurrency />
            <SimRow label="ROI" value={formatPercent(sim.roi)} />
          </div>

          <Button onClick={handleSave} disabled={saving || newPrice <= 0} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar Novo Preço
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SimRow({ label, value, diff, isCurrency }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="font-semibold text-foreground">{value}</span>
        {diff !== undefined && Math.abs(diff) > 0.01 && (
          <div className={cn("flex items-center justify-end gap-0.5 text-xs", diff > 0 ? "text-accent-dark" : "text-destructive")}>
            {diff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isCurrency ? formatCurrency(diff) : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`}
          </div>
        )}
      </div>
    </div>
  );
}