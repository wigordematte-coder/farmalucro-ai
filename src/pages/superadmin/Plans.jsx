import { useState, useEffect } from 'react';
import { Layers, Plus, Pencil, Trash2, Check, Star, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { logAudit } from '@/lib/audit';
import { formatCurrency } from '@/lib/pricing';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    try {
      const list = await base44.entities.SubscriptionPlan.list('sort_order', 100);
      setPlans(list || []);
    } catch { setPlans([]); }
    finally { setLoading(false); }
  };

  const handleSave = async (formData) => {
    try {
      if (editPlan?.id) {
        await base44.entities.SubscriptionPlan.update(editPlan.id, formData);
        await logAudit('plan_change', `Editou o plano "${formData.name}"`, { entity_id: editPlan.id });
      } else {
        const created = await base44.entities.SubscriptionPlan.create(formData);
        await logAudit('plan_change', `Criou o plano "${formData.name}"`, { entity_id: created.id });
      }
      setFormOpen(false); setEditPlan(null);
      await loadPlans();
    } catch { alert('Erro ao salvar plano.'); }
  };

  const handleDelete = async (plan) => {
    if (!confirm(`Excluir o plano "${plan.name}"?`)) return;
    try {
      await base44.entities.SubscriptionPlan.delete(plan.id);
      await logAudit('deletion', `Excluiu o plano "${plan.name}"`, { entity_id: plan.id });
      await loadPlans();
    } catch { alert('Erro ao excluir plano.'); }
  };

  const handleToggleActive = async (plan) => {
    try {
      await base44.entities.SubscriptionPlan.update(plan.id, { is_active: !plan.is_active });
      await logAudit('plan_change', `${plan.is_active ? 'Desativou' : 'Ativou'} o plano "${plan.name}"`, { entity_id: plan.id });
      await loadPlans();
    } catch { alert('Erro ao alterar status.'); }
  };

  const handleSetDefault = async (plan) => {
    try {
      await base44.entities.SubscriptionPlan.updateMany({ is_default: true }, { $set: { is_default: false } });
      await base44.entities.SubscriptionPlan.update(plan.id, { is_default: true });
      await logAudit('plan_change', `Definiu "${plan.name}" como plano padrão`, { entity_id: plan.id });
      await loadPlans();
    } catch { alert('Erro ao definir plano padrão.'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Layers className="w-6 h-6 text-primary" /> Planos de Assinatura
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os planos disponíveis para as farmácias</p>
        </div>
        <button onClick={() => { setEditPlan(null); setFormOpen(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light">
          <Plus className="w-4 h-4" /> Novo Plano
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">Nenhum plano cadastrado</p>
          <p className="text-sm text-muted-foreground mb-4">Crie planos para oferecer às farmácias.</p>
          <button onClick={() => { setEditPlan(null); setFormOpen(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light">
            <Plus className="w-4 h-4" /> Criar Primeiro Plano
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div key={plan.id} className={cn(
              "bg-card border rounded-2xl p-5 flex flex-col",
              plan.is_default ? "border-accent shadow-sm shadow-accent/10" : "border-border"
            )}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{plan.name}</h3>
                    {plan.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent-dark text-xs font-semibold">
                        <Star className="w-3 h-3" /> Padrão
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(plan.price_monthly)}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                  {plan.price_annual > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(plan.price_annual)}/ano</p>
                  )}
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                  plan.is_active ? "bg-accent/10 text-accent-dark" : "bg-muted text-muted-foreground")}>
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {plan.description && <p className="text-xs text-muted-foreground mb-3">{plan.description}</p>}

              {plan.features && plan.features.length > 0 && (
                <ul className="space-y-1 mb-4 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                {plan.max_products > 0 && <span>{plan.max_products} produtos</span>}
                {plan.max_products > 0 && plan.max_users > 0 && <span>•</span>}
                {plan.max_users > 0 && <span>{plan.max_users} usuários</span>}
                {plan.max_products === 0 && plan.max_users === 0 && <span>Ilimitado</span>}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                <button onClick={() => handleToggleActive(plan)}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-medium border",
                    plan.is_active ? "border-border text-muted-foreground hover:bg-muted" : "border-accent text-accent-dark hover:bg-accent/5")}>
                  {plan.is_active ? 'Desativar' : 'Ativar'}
                </button>
                {!plan.is_default && (
                  <button onClick={() => handleSetDefault(plan)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted">
                    Padrão
                  </button>
                )}
                <button onClick={() => { setEditPlan(plan); setFormOpen(true); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:bg-muted">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(plan)}
                  className="ml-auto p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
            <DialogDescription>Configure os detalhes do plano de assinatura.</DialogDescription>
          </DialogHeader>
          <PlanForm plan={editPlan} onSave={handleSave} onCancel={() => { setFormOpen(false); setEditPlan(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PlanForm({ plan, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: plan?.name || '',
    description: plan?.description || '',
    price_monthly: plan?.price_monthly || 197,
    price_annual: plan?.price_annual || 0,
    max_products: plan?.max_products || 0,
    max_users: plan?.max_users || 0,
    features: plan?.features || [],
    is_active: plan?.is_active ?? true,
    sort_order: plan?.sort_order || 0,
  });
  const [featureInput, setFeatureInput] = useState('');

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm({ ...form, features: [...form.features, featureInput.trim()] });
      setFeatureInput('');
    }
  };
  const removeFeature = (idx) => {
    setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Nome do Plano</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Descrição</label>
        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Preço Mensal (R$)</label>
          <input type="number" value={form.price_monthly} onChange={e => setForm({ ...form, price_monthly: parseFloat(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Preço Anual (R$)</label>
          <input type="number" value={form.price_annual} onChange={e => setForm({ ...form, price_annual: parseFloat(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Máx. Produtos (0 = ilimitado)</label>
          <input type="number" value={form.max_products} onChange={e => setForm({ ...form, max_products: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Máx. Usuários (0 = ilimitado)</label>
          <input type="number" value={form.max_users} onChange={e => setForm({ ...form, max_users: parseInt(e.target.value) || 0 })}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground">Recursos</label>
        <div className="flex gap-2 mt-1">
          <input value={featureInput} onChange={e => setFeatureInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
            placeholder="Adicionar recurso..."
            className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-background" />
          <button onClick={addFeature} type="button" className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted">+</button>
        </div>
        {form.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.features.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs">
                {f}
                <button onClick={() => removeFeature(i)} className="text-red-500">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
        <button onClick={() => onSave(form)} disabled={!form.name}
          className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light disabled:opacity-60">
          Salvar Plano
        </button>
      </div>
    </div>
  );
}