import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculatePrices, calculateProfit, calculateMargin, calculateROI, formatCurrency, formatPercent } from '@/lib/pricing';

export default function ProductForm({ product, settings, onSave, onClose }) {
  const [form, setForm] = useState({
    name: '',
    manufacturer: '',
    category: '',
    cost: 0,
    quantity: 0,
    expiration_date: '',
    monthly_sales: 0,
    selected_price: 0,
    ...product,
  });

  const prices = calculatePrices(form.cost || 0, settings?.min_margin || 15, settings?.ideal_margin || 30, settings?.max_margin || 50);
  const profit = calculateProfit(form.selected_price || prices.balanced, form.cost || 0);
  const margin = calculateMargin(form.selected_price || prices.balanced, form.cost || 0);
  const roi = calculateROI(form.cost || 0, profit);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalPrice = form.selected_price || prices.balanced;
    const finalProfit = calculateProfit(finalPrice, form.cost || 0);
    onSave({
      ...form,
      cost: Number(form.cost) || 0,
      quantity: Number(form.quantity) || 0,
      monthly_sales: Number(form.monthly_sales) || 0,
      selected_price: Number(finalPrice) || 0,
      price_aggressive: prices.aggressive,
      price_balanced: prices.balanced,
      price_premium: prices.premium,
      unit_profit: finalProfit,
      margin_pct: margin,
      roi: roi,
      high_margin: margin >= 35,
      risk_of_obsolescence: (form.monthly_sales || 0) < 5,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{product?.id ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <Label>Nome do Produto *</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Dipirona 500mg 20 comprimidos" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Fabricante</Label>
              <Input value={form.manufacturer || ''} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="Ex: EMS" />
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={form.category || ''} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Genéricos" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Custo Unitário (R$) *</Label>
              <Input type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} required />
            </div>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Validade</Label>
              <Input type="date" value={form.expiration_date || ''} onChange={e => setForm({ ...form, expiration_date: e.target.value })} />
            </div>
            <div>
              <Label>Vendas Mensais</Label>
              <Input type="number" value={form.monthly_sales} onChange={e => setForm({ ...form, monthly_sales: e.target.value })} placeholder="0" />
            </div>
          </div>

          {Number(form.cost) > 0 && (
            <div className="space-y-3 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-sm font-semibold text-foreground">Precificação Inteligente</p>
              <div className="grid grid-cols-3 gap-2">
                <PriceOption label="Agressivo" price={prices.aggressive} margin={settings?.min_margin || 15} color="blue" selected={Number(form.selected_price) === prices.aggressive} onClick={() => setForm({ ...form, selected_price: prices.aggressive })} />
                <PriceOption label="Equilibrado" price={prices.balanced} margin={settings?.ideal_margin || 30} color="accent" selected={Number(form.selected_price) === prices.balanced} onClick={() => setForm({ ...form, selected_price: prices.balanced })} />
                <PriceOption label="Premium" price={prices.premium} margin={settings?.max_margin || 50} color="purple" selected={Number(form.selected_price) === prices.premium} onClick={() => setForm({ ...form, selected_price: prices.premium })} />
              </div>
              <div>
                <Label>Preço Selecionado (R$)</Label>
                <Input type="number" step="0.01" value={form.selected_price} onChange={e => setForm({ ...form, selected_price: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <MetricBox label="Lucro/Un." value={formatCurrency(profit)} />
                <MetricBox label="Margem" value={formatPercent(margin)} />
                <MetricBox label="ROI" value={formatPercent(roi)} />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" className="flex-1 bg-accent hover:bg-accent-dark">
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PriceOption({ label, price, margin, color, selected, onClick }) {
  const colors = {
    blue: 'border-blue-500 bg-blue-50 text-blue-700',
    accent: 'border-accent bg-accent/10 text-accent-dark',
    purple: 'border-purple-500 bg-purple-50 text-purple-700',
  };
  return (
    <button type="button" onClick={onClick} className={`p-2.5 rounded-xl border-2 text-center transition-all ${selected ? colors[color] : 'border-border bg-card hover:border-muted'}`}>
      <p className="text-[10px] font-medium opacity-80">{label}</p>
      <p className="text-sm font-bold">{formatCurrency(price)}</p>
      <p className="text-[10px] opacity-70">{margin}% margem</p>
    </button>
  );
}

function MetricBox({ label, value }) {
  return (
    <div className="p-2 rounded-lg bg-card border border-border">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}