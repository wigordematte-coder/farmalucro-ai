import { useState, useEffect, useMemo } from 'react';
import { Zap, PackagePlus, TrendingDown, Gift, Crown, Plus, Trash2, AlertTriangle, Tag, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/EmptyState';
import ABCBadge from '@/components/ABCBadge';
import { useProducts } from '@/hooks/useProducts';
import { usePharmacy } from '@/lib/pharmacyContext';
import { PROMOTION_TYPES } from '@/lib/constants';
import { formatPercent } from '@/lib/pricing';
import { useUserRole } from '@/lib/roles';
import { filterByTenant, withTenantId } from '@/lib/tenant';
import { cn } from '@/lib/utils';

const ICONS = { Zap, PackagePlus, TrendingDown, Gift, Crown };

export default function Promotions() {
  const { products, loading, reloadProducts } = useProducts();
  const { settings } = usePharmacy();
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [promotions, setPromotions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const loadPromotions = async () => {
    try {
      if (roleLoading) return;
      const list = await base44.entities.Promotion.list('-created_date', 50);
      setPromotions(isSuperAdmin ? (list || []) : filterByTenant(list, tenantId));
    } catch (e) {
      setPromotions([]);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, [tenantId, isSuperAdmin, roleLoading]);

  const eligibleProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.abc_class === 'C' || p.risk_of_obsolescence);
  }, [products]);

  const handleAutoGenerate = async () => {
    if (eligibleProducts.length === 0) return;
    setGenerating(true);
    try {
      const selected = eligibleProducts.slice(0, 5);
      const idealMargin = settings?.ideal_margin || 30;
      const discount = 15;
      const impactMargin = idealMargin - discount;
      const productNames = selected.map(p => p.name);

      await base44.entities.Promotion.create(withTenantId({
        name: 'Oferta Relâmpago — Liquidação de Estoque',
        type: 'flash_offer',
        product_names: productNames,
        discount: discount,
        impact_margin: impactMargin,
        active: true,
        description: `Promoção automática para ${selected.length} produtos de baixo giro. Desconto de ${discount}% para acelerar o giro de estoque.`,
      }, tenantId));

      const productIds = selected.map(p => p.id);
      await base44.entities.Product.updateMany({ _id: { $in: productIds } }, { $set: { on_promotion: true } });
      loadPromotions();
      reloadProducts();
    } catch (e) {
      alert('Erro ao gerar promoção');
    } finally {
      setGenerating(false);
    }
  };

  const handleToggle = async (promo) => {
    try {
      await base44.entities.Promotion.update(promo.id, { active: !promo.active });
      loadPromotions();
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta promoção?')) return;
    try {
      await base44.entities.Promotion.delete(id);
      loadPromotions();
    } catch (e) {}
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">Promoções</h1>
          <p className="text-sm text-muted-foreground">Gere promoções automáticas com cálculo de impacto na margem</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAutoGenerate}
            disabled={generating || eligibleProducts.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Gerar com IA
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark"
          >
            <Plus className="w-4 h-4" /> Nova
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(PROMOTION_TYPES).map(([key, config]) => {
          const Icon = ICONS[config.icon] || Tag;
          const count = promotions.filter(p => p.type === key).length;
          const colors = { orange: 'bg-orange-50 text-orange-600', blue: 'bg-blue-50 text-blue-600', purple: 'bg-purple-50 text-purple-600', green: 'bg-green-50 text-green-600', amber: 'bg-amber-50 text-amber-600' };
          return (
            <div key={key} className="bg-card border border-border rounded-xl p-3 text-center">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2", colors[config.color])}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight">{config.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{count} ativas</p>
            </div>
          );
        })}
      </div>

      {eligibleProducts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm">{eligibleProducts.length} produtos elegíveis para promoção</p>
              <p className="text-xs text-amber-700 mt-0.5">Produtos de baixo giro (Curva C) que precisam de promoção para liberar capital.</p>
            </div>
          </div>
        </div>
      )}

      {promotions.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Nenhuma promoção criada"
          description="Crie promoções manualmente ou use a IA para gerar ofertas automáticas baseadas na curva ABC."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {promotions.map(promo => (
            <PromotionCard key={promo.id} promo={promo} onToggle={() => handleToggle(promo)} onDelete={() => handleDelete(promo.id)} settings={settings} />
          ))}
        </div>
      )}

      {showForm && (
        <PromotionForm
          products={products}
          settings={settings}
          tenantId={tenantId}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); loadPromotions(); reloadProducts(); }}
        />
      )}
    </div>
  );
}

function PromotionCard({ promo, onToggle, onDelete, settings }) {
  const config = PROMOTION_TYPES[promo.type] || PROMOTION_TYPES.flash_offer;
  const Icon = ICONS[config.icon] || Tag;
  const marginImpact = promo.impact_margin || 0;
  const minMargin = settings?.min_margin || 15;
  const belowMin = marginImpact < minMargin;

  return (
    <div className={cn("bg-card border-2 rounded-2xl p-4 transition-all", promo.active ? "border-accent/30" : "border-border opacity-60")}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-accent-dark" />
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{promo.name}</p>
            <p className="text-xs text-muted-foreground">{config.label}</p>
          </div>
        </div>
        {promo.active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">ATIVA</span>}
      </div>

      {promo.product_names && promo.product_names.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {promo.product_names.slice(0, 4).map((name, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{name.length > 20 ? name.substring(0, 20) + '...' : name}</span>
          ))}
          {promo.product_names.length > 4 && <span className="text-[10px] text-muted-foreground">+{promo.product_names.length - 4}</span>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 rounded-lg bg-muted/50 text-center">
          <p className="text-[10px] text-muted-foreground">Desconto</p>
          <p className="font-bold text-orange-600">{formatPercent(promo.discount)}</p>
        </div>
        <div className={cn("p-2 rounded-lg text-center", belowMin ? "bg-red-50" : "bg-muted/50")}>
          <p className="text-[10px] text-muted-foreground">Margem Final</p>
          <p className={cn("font-bold", belowMin ? "text-red-600" : "text-foreground")}>{formatPercent(marginImpact)}</p>
        </div>
      </div>

      {belowMin && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 mb-3">
          <AlertTriangle className="w-3.5 h-3.5" />
          Margem abaixo do mínimo ({formatPercent(minMargin)})
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-colors", promo.active ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-accent text-accent-foreground hover:bg-accent-dark")}
        >
          {promo.active ? 'Desativar' : 'Ativar'}
        </button>
        <button onClick={onDelete} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function PromotionForm({ products, settings, tenantId, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '',
    type: 'flash_offer',
    product_names: [],
    discount: 10,
    description: '',
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const handleToggleProduct = (name) => {
    setForm(prev => ({
      ...prev,
      product_names: prev.product_names.includes(name)
        ? prev.product_names.filter(n => n !== name)
        : [...prev.product_names, name]
    }));
  };

  const impactMargin = (settings?.ideal_margin || 30) - (form.discount || 0);

  const handleSubmit = async () => {
    if (!form.name || form.product_names.length === 0) return;
    setSaving(true);
    try {
      await base44.entities.Promotion.create(withTenantId({
        ...form,
        impact_margin: impactMargin,
        discount: Number(form.discount),
      }, tenantId));

      const productIds = products.filter(p => form.product_names.includes(p.name)).map(p => p.id);
      if (productIds.length > 0) {
        await base44.entities.Product.updateMany({ _id: { $in: productIds } }, { $set: { on_promotion: true } });
      }
      onSaved();
    } catch (e) {
      alert('Erro ao criar promoção');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Nova Promoção</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Nome da Promoção</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Queima de Estoque Junino" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo de Promoção</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {Object.entries(PROMOTION_TYPES).map(([key, config]) => {
                const Icon = ICONS[config.icon] || Tag;
                return (
                  <button key={key} onClick={() => setForm({ ...form, type: key })} className={cn("flex items-center gap-2 p-2.5 rounded-lg border-2 text-left text-xs transition-all", form.type === key ? "border-accent bg-accent/5" : "border-border")}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Desconto (%)</label>
            <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm" />
          </div>
          <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Impacto na Margem:</span>
            <span className={cn("font-bold", impactMargin < (settings?.min_margin || 15) ? "text-red-600" : "text-foreground")}>{formatPercent(impactMargin)}</span>
          </div>
          <div>
            <label className="text-sm font-medium">Produtos ({form.product_names.length} selecionados)</label>
            <div className="mt-1 max-h-48 overflow-y-auto scrollbar-thin border border-border rounded-lg p-2 space-y-1">
              {products.map(p => (
                <button key={p.id} onClick={() => handleToggleProduct(p.name)} className={cn("w-full flex items-center justify-between p-2 rounded-lg text-left text-sm transition-colors", form.product_names.includes(p.name) ? "bg-accent/10" : "hover:bg-muted")}>
                  <span className="truncate flex-1">{p.name}</span>
                  <ABCBadge abcClass={p.abc_class} />
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSubmit} disabled={saving || !form.name || form.product_names.length === 0} className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark disabled:opacity-50">
            {saving ? 'Salvando...' : 'Criar Promoção'}
          </button>
        </div>
      </div>
    </div>
  );
}
