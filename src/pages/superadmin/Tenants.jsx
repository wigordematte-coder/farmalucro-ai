import { useState, useEffect, useMemo } from 'react';
import {
  Building2, Search, Plus, Ban, CheckCircle2, Pause, Calendar, Trash2,
  Eye, Pencil, Loader2, ShieldCheck
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { logAudit } from '@/lib/audit';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

const STATUS_CONFIG = {
  active: { label: 'Ativa', classes: 'bg-accent/10 text-accent-dark' },
  trial: { label: 'Trial', classes: 'bg-blue-50 text-blue-600' },
  overdue: { label: 'Em Atraso', classes: 'bg-orange-50 text-orange-600' },
  blocked: { label: 'Bloqueada', classes: 'bg-red-50 text-red-600' },
  pending_payment: { label: 'Pag. Pendente', classes: 'bg-yellow-50 text-yellow-600' },
  suspended: { label: 'Suspensa', classes: 'bg-purple-100 text-purple-700' },
  cancelled: { label: 'Cancelada', classes: 'bg-gray-100 text-gray-500' },
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}
function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Tenants() {
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [editTenant, setEditTenant] = useState(null);
  const [extendTenant, setExtendTenant] = useState(null);
  const [planTenant, setPlanTenant] = useState(null);
  const [extendDate, setExtendDate] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [t, p] = await Promise.all([
        base44.entities.Tenant.list('-created_date', 500),
        base44.entities.SubscriptionPlan.list('sort_order', 100),
      ]);
      setTenants(t || []);
      setPlans(p || []);
    } catch {
      setTenants([]); setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return tenants;
    const q = search.toLowerCase();
    return tenants.filter(t =>
      (t.name || '').toLowerCase().includes(q) ||
      (t.cnpj || '').toLowerCase().includes(q) ||
      (t.city || '').toLowerCase().includes(q) ||
      (t.responsible_name || '').toLowerCase().includes(q) ||
      (t.responsible_email || '').toLowerCase().includes(q)
    );
  }, [tenants, search]);

  const handleAction = async (tenant, action) => {
    setActionLoading(tenant.id + action);
    const updates = {
      block: { subscription_status: 'blocked' },
      unblock: { subscription_status: 'active', is_suspended: false },
      suspend: { subscription_status: 'suspended', is_suspended: true },
      unsuspend: { subscription_status: 'active', is_suspended: false },
    };
    const labels = {
      block: 'Bloqueou', unblock: 'Desbloqueou', suspend: 'Suspendeu', unsuspend: 'Reativou',
    };
    try {
      if (updates[action]) {
        await base44.entities.Tenant.update(tenant.id, updates[action]);
        await logAudit('tenant_management', `${labels[action]} a farmácia "${tenant.name}"`, {
          entity_id: tenant.id, tenant_id: tenant.id, tenant_name: tenant.name,
        });
        await loadData();
      }
    } catch {
      alert('Erro ao executar ação.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (tenant) => {
    if (!confirm(`Excluir a farmácia "${tenant.name}"? Esta ação não pode ser desfeita.`)) return;
    setActionLoading(tenant.id + 'delete');
    try {
      await base44.entities.Tenant.delete(tenant.id);
      await logAudit('deletion', `Excluiu a farmácia "${tenant.name}"`, {
        entity_id: tenant.id, tenant_name: tenant.name,
      });
      await loadData();
    } catch {
      alert('Erro ao excluir farmácia.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleImpersonate = async (tenant) => {
    setActionLoading(tenant.id + 'impersonate');
    try {
      await logAudit('impersonation', `Acessou a conta da farmácia "${tenant.name}" para suporte`, {
        entity_id: tenant.id, tenant_id: tenant.id, tenant_name: tenant.name,
        metadata: { impersonated_tenant: tenant.name, impersonated_tenant_id: tenant.id },
      });
      alert(`Acesso registrado para auditoria.\n\nVocê está visualizando a conta de: ${tenant.name}\n\nTodas as ações foram registradas no log de auditoria.`);
    } catch {
      alert('Erro ao registrar acesso.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await base44.entities.Tenant.update(editTenant.id, {
        name: editTenant.name, cnpj: editTenant.cnpj, city: editTenant.city,
        state: editTenant.state, responsible_name: editTenant.responsible_name,
        responsible_email: editTenant.responsible_email, responsible_phone: editTenant.responsible_phone,
        notes: editTenant.notes,
      });
      await logAudit('tenant_management', `Editou dados da farmácia "${editTenant.name}"`, {
        entity_id: editTenant.id, tenant_name: editTenant.name,
      });
      setEditTenant(null);
      await loadData();
    } catch {
      alert('Erro ao salvar alterações.');
    }
  };

  const handleExtend = async () => {
    if (!extendDate) { alert('Selecione uma data.'); return; }
    try {
      await base44.entities.Tenant.update(extendTenant.id, { subscription_end_date: extendDate });
      await logAudit('subscription_change', `Prorrogou assinatura da farmácia "${extendTenant.name}" até ${formatDate(extendDate)}`, {
        entity_id: extendTenant.id, tenant_name: extendTenant.name,
      });
      setExtendTenant(null); setExtendDate('');
      await loadData();
    } catch {
      alert('Erro ao prorrogar assinatura.');
    }
  };

  const handleChangePlan = async (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    try {
      await base44.entities.Tenant.update(planTenant.id, { plan_id: planId, plan_name: plan.name });
      await logAudit('plan_change', `Alterou plano da farmácia "${planTenant.name}" para "${plan.name}"`, {
        entity_id: planTenant.id, tenant_name: planTenant.name,
      });
      setPlanTenant(null);
      await loadData();
    } catch {
      alert('Erro ao alterar plano.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" /> Farmácias
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestão de todas as farmácias cadastradas na plataforma</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, CNPJ, cidade..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium">Farmácia</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Cidade</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Plano</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Cadastro</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-muted-foreground">Nenhuma farmácia encontrada.</td></tr>
              ) : filtered.map(t => {
                const cfg = STATUS_CONFIG[t.subscription_status] || STATUS_CONFIG.trial;
                return (
                  <tr key={t.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.responsible_name || '—'} {t.cnpj ? `• CNPJ: ${t.cnpj}` : ''}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{t.city ? `${t.city}/${t.state || ''}` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{t.plan_name || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell whitespace-nowrap">{formatDate(t.created_date)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", cfg.classes)}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {t.subscription_status === 'blocked' ? (
                          <ActionBtn icon={CheckCircle2} title="Desbloquear" color="accent" loading={actionLoading === t.id + 'unblock'} onClick={() => handleAction(t, 'unblock')} />
                        ) : (
                          <ActionBtn icon={Ban} title="Bloquear" color="red" loading={actionLoading === t.id + 'block'} onClick={() => handleAction(t, 'block')} />
                        )}
                        {t.is_suspended ? (
                          <ActionBtn icon={CheckCircle2} title="Reativar" color="accent" loading={actionLoading === t.id + 'unsuspend'} onClick={() => handleAction(t, 'unsuspend')} />
                        ) : (
                          <ActionBtn icon={Pause} title="Suspender" color="purple" loading={actionLoading === t.id + 'suspend'} onClick={() => handleAction(t, 'suspend')} />
                        )}
                        <ActionBtn icon={Pencil} title="Editar" color="blue" onClick={() => setEditTenant({ ...t })} />
                        <ActionBtn icon={Calendar} title="Prorrogar" color="orange" onClick={() => { setExtendTenant(t); setExtendDate(t.subscription_end_date || ''); }} />
                        <ActionBtn icon={Eye} title="Acessar Conta" color="primary" loading={actionLoading === t.id + 'impersonate'} onClick={() => handleImpersonate(t)} />
                        <ActionBtn icon={Trash2} title="Excluir" color="red" loading={actionLoading === t.id + 'delete'} onClick={() => handleDelete(t)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <Dialog open={!!editTenant} onOpenChange={(o) => !o && setEditTenant(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Farmácia</DialogTitle>
            <DialogDescription>Atualize os dados cadastrais da farmácia.</DialogDescription>
          </DialogHeader>
          {editTenant && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nome" value={editTenant.name} onChange={v => setEditTenant({ ...editTenant, name: v })} />
                <Field label="CNPJ" value={editTenant.cnpj || ''} onChange={v => setEditTenant({ ...editTenant, cnpj: v })} />
                <Field label="Cidade" value={editTenant.city || ''} onChange={v => setEditTenant({ ...editTenant, city: v })} />
                <Field label="Estado" value={editTenant.state || ''} onChange={v => setEditTenant({ ...editTenant, state: v })} />
                <Field label="Responsável" value={editTenant.responsible_name || ''} onChange={v => setEditTenant({ ...editTenant, responsible_name: v })} />
                <Field label="E-mail" value={editTenant.responsible_email || ''} onChange={v => setEditTenant({ ...editTenant, responsible_email: v })} />
                <Field label="Telefone" value={editTenant.responsible_phone || ''} onChange={v => setEditTenant({ ...editTenant, responsible_phone: v })} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea value={editTenant.notes || ''} onChange={e => setEditTenant({ ...editTenant, notes: e.target.value })}
                  rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
              </div>
              <button onClick={handleSaveEdit}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light">
                Salvar Alterações
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Extend Modal */}
      <Dialog open={!!extendTenant} onOpenChange={(o) => !o && setExtendTenant(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Prorrogar Assinatura</DialogTitle>
            <DialogDescription>{extendTenant?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nova Data de Validade</label>
              <input type="date" value={extendDate} onChange={e => setExtendDate(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
            </div>
            <button onClick={handleExtend}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light">
              Prorrogar Assinatura
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Plan Modal */}
      <Dialog open={!!planTenant} onOpenChange={(o) => !o && setPlanTenant(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Plano</DialogTitle>
            <DialogDescription>{planTenant?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {plans.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum plano cadastrado.</p>
            ) : plans.map(plan => (
              <button key={plan.id} onClick={() => handleChangePlan(plan.id)}
                className={cn("w-full text-left p-3 rounded-xl border transition-colors",
                  planTenant?.plan_id === plan.id ? "border-accent bg-accent/5" : "border-border hover:bg-muted")}>
                <p className="font-medium text-foreground text-sm">{plan.name}</p>
                <p className="text-xs text-muted-foreground">R$ {plan.price_monthly}/mês</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ActionBtn({ icon: Icon, title, color, onClick, loading }) {
  const colors = {
    red: 'text-red-500 hover:bg-red-50',
    accent: 'text-accent-dark hover:bg-accent/10',
    purple: 'text-purple-600 hover:bg-purple-50',
    blue: 'text-blue-600 hover:bg-blue-50',
    orange: 'text-orange-600 hover:bg-orange-50',
    primary: 'text-primary hover:bg-primary/10',
  };
  return (
    <button title={title} onClick={onClick} disabled={loading}
      className={cn("p-1.5 rounded-lg transition-colors disabled:opacity-50", colors[color])}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
    </button>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
    </div>
  );
}