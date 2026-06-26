import { useState, useEffect, useMemo } from 'react';
import { Users as UsersIcon, UserPlus, Trash2, Mail, Loader2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { useUserRole, APP_ROLES } from '@/lib/roles';
import { logAudit } from '@/lib/audit';
import RoleGuard from '@/components/RoleGuard';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';

export default function Employees() {
  return (
    <RoleGuard allowedRoles={['pharmacy_admin']}>
      <EmployeesContent />
    </RoleGuard>
  );
}

function EmployeesContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operator');
  const [inviting, setInviting] = useState(false);
  const { user, tenantId } = useUserRole();

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      const list = await base44.entities.User.list('-created_date', 200);
      setUsers(list || []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const employees = useMemo(() => {
    if (tenantId) return users.filter(u => u.tenant_id === tenantId);
    return users;
  }, [users, tenantId]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) { alert('Digite o e-mail.'); return; }
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim(), 'admin');
      await logAudit('user_management', `Convidou ${inviteEmail} como ${APP_ROLES[inviteRole]?.label}`, {
        metadata: { invited_email: inviteEmail, invited_role: inviteRole }
      });
      alert(`Convite enviado para ${inviteEmail}!\n\nApós o funcionário aceitar, configure o papel e a empresa nas ações abaixo.`);
      setInviteEmail(''); setInviteRole('operator');
      setInviteOpen(false);
      await loadUsers();
    } catch (e) {
      alert('Erro ao enviar convite: ' + (e.message || ''));
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (emp, newRole) => {
    try {
      const updates = { app_role: newRole };
      if (!emp.tenant_id && tenantId) updates.tenant_id = tenantId;
      await base44.entities.User.update(emp.id, updates);
      await logAudit('user_management', `Alterou papel de ${emp.email} para ${APP_ROLES[newRole]?.label}`, {
        entity_id: emp.id, metadata: { new_role: newRole }
      });
      await loadUsers();
    } catch {
      alert('Erro ao alterar papel.');
    }
  };

  const handleAssignTenant = async (emp) => {
    if (!tenantId) { alert('Seu perfil não possui tenant_id configurado.'); return; }
    try {
      await base44.entities.User.update(emp.id, { tenant_id: tenantId, app_role: emp.app_role || 'operator' });
      await logAudit('user_management', `Vinculou ${emp.email} à empresa`, {
        entity_id: emp.id, metadata: { tenant_id: tenantId }
      });
      await loadUsers();
    } catch {
      alert('Erro ao vincular funcionário.');
    }
  };

  const handleRemoveFromTenant = async (emp) => {
    if (!confirm(`Remover ${emp.email} da empresa?`)) return;
    try {
      await base44.entities.User.update(emp.id, { tenant_id: '' });
      await logAudit('user_management', `Removeu ${emp.email} da empresa`, { entity_id: emp.id });
      await loadUsers();
    } catch {
      alert('Erro ao remover funcionário.');
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-primary" /> Funcionários
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie os usuários da sua farmácia</p>
        </div>
        <button onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light">
          <UserPlus className="w-4 h-4" /> Convidar Funcionário
        </button>
      </div>

      {!tenantId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 text-sm text-yellow-800">
          Seu perfil não possui um Tenant ID configurado. Novos funcionários convidados precisarão ser vinculados manualmente à empresa após aceitarem o convite.
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl p-12 text-center">
          <UsersIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-1">Nenhum funcionário vinculado</p>
          <p className="text-sm text-muted-foreground">Convide funcionários para gerenciar sua farmácia.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3 font-medium">Funcionário</th>
                  <th className="px-4 py-3 font-medium hidden sm:table-cell">E-mail</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 font-medium text-center">Vinculado</th>
                  <th className="px-4 py-3 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const appRole = emp.app_role || (emp.role === 'admin' ? 'pharmacy_admin' : 'operator');
                  const roleCfg = APP_ROLES[appRole] || APP_ROLES.operator;
                  const isSelf = emp.id === user?.id;
                  return (
                    <tr key={emp.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white font-semibold text-xs">
                            {(emp.full_name?.[0] || emp.email?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{emp.full_name || 'Sem nome'}</p>
                            {isSelf && <span className="text-xs text-accent-dark">Você</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {emp.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", roleCfg.color)}>
                          <Shield className="w-3 h-3" /> {roleCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {emp.tenant_id ? (
                          <span className="text-accent-dark text-xs font-medium">Sim</span>
                        ) : tenantId ? (
                          <button onClick={() => handleAssignTenant(emp)}
                            className="text-xs text-primary hover:underline">Vincular</button>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {!isSelf && (
                            <>
                              <select value={appRole} onChange={e => handleChangeRole(emp, e.target.value)}
                                className="px-2 py-1 rounded-lg border border-border text-xs bg-background">
                                <option value="pharmacy_admin">Admin Farmácia</option>
                                <option value="pharmacist">Farmacêutico</option>
                                <option value="operator">Operador</option>
                              </select>
                              {emp.tenant_id && (
                                <button onClick={() => handleRemoveFromTenant(emp)} title="Remover da empresa"
                                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                          {isSelf && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Convidar Funcionário</DialogTitle>
            <DialogDescription>Envie um convite para um novo membro da equipe.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">E-mail</label>
              <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="funcionario@farmacia.com"
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Papel</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background">
                <option value="pharmacy_admin">Administrador da Farmácia</option>
                <option value="pharmacist">Farmacêutico</option>
                <option value="operator">Operador</option>
              </select>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              O funcionário receberá um convite por e-mail. Após aceitar, configure o papel e vincule à empresa na lista de funcionários.
            </div>
            <button onClick={handleInvite} disabled={inviting}
              className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary-light disabled:opacity-60 flex items-center justify-center gap-2">
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Enviar Convite
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}