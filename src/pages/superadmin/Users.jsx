import { useState, useEffect, useMemo } from 'react';
import { Users as UsersIcon, Search, Loader2, Shield, Mail } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { APP_ROLES } from '@/lib/roles';
import { logAudit } from '@/lib/audit';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const list = await base44.entities.User.list('-created_date', 500);
      setUsers(list || []);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter !== 'all') {
      result = result.filter(u => (u.app_role || (u.role === 'admin' ? 'super_admin' : 'operator')) === roleFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.full_name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.tenant_id || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, search, roleFilter]);

  const handleChangeRole = async (user, newRole) => {
    try {
      await base44.entities.User.update(user.id, { app_role: newRole });
      await logAudit('user_management', `Alterou papel de ${user.email} para ${APP_ROLES[newRole]?.label || newRole}`, {
        entity_id: user.id, metadata: { old_role: user.app_role, new_role: newRole }
      });
      await loadUsers();
    } catch {
      alert('Erro ao alterar papel do usuário.');
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
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-primary" /> Usuários
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Todos os usuários cadastrados na plataforma</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail, tenant..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border text-sm bg-background">
          <option value="all">Todos os perfis</option>
          {Object.entries(APP_ROLES).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium">Usuário</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">E-mail</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Tenant ID</th>
                <th className="px-4 py-3 font-medium">Papel</th>
                <th className="px-4 py-3 font-medium text-center">Alterar Papel</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-muted-foreground">Nenhum usuário encontrado.</td></tr>
              ) : filtered.map(u => {
                const appRole = u.app_role || (u.role === 'admin' ? 'super_admin' : 'operator');
                const roleCfg = APP_ROLES[appRole] || APP_ROLES.operator;
                return (
                  <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-white font-semibold text-xs">
                          {(u.full_name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                        </div>
                        <p className="font-medium text-foreground">{u.full_name || 'Sem nome'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {u.email || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell font-mono text-xs">{u.tenant_id || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", roleCfg.color)}>
                        <Shield className="w-3 h-3" /> {roleCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select value={appRole} onChange={e => handleChangeRole(u, e.target.value)}
                        className="px-2 py-1 rounded-lg border border-border text-xs bg-background">
                        {Object.entries(APP_ROLES).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
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