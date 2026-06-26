import { useState, useEffect, useMemo } from 'react';
import { ScrollText, Search, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const ACTION_CONFIG = {
  login: { label: 'Login', classes: 'bg-blue-50 text-blue-600' },
  logout: { label: 'Logout', classes: 'bg-gray-100 text-gray-500' },
  price_change: { label: 'Alteração de Preço', classes: 'bg-yellow-50 text-yellow-600' },
  settings_change: { label: 'Alteração de Config.', classes: 'bg-blue-50 text-blue-600' },
  subscription_change: { label: 'Alteração de Assinatura', classes: 'bg-purple-100 text-purple-700' },
  gateway_change: { label: 'Alteração de Gateway', classes: 'bg-orange-50 text-orange-600' },
  deletion: { label: 'Exclusão', classes: 'bg-red-50 text-red-600' },
  plan_change: { label: 'Mudança de Plano', classes: 'bg-purple-100 text-purple-700' },
  super_admin_action: { label: 'Ação do Super Admin', classes: 'bg-purple-100 text-purple-700' },
  impersonation: { label: 'Impersonação', classes: 'bg-red-100 text-red-700' },
  user_management: { label: 'Gestão de Usuário', classes: 'bg-blue-50 text-blue-600' },
  tenant_management: { label: 'Gestão de Tenant', classes: 'bg-purple-100 text-purple-700' },
  data_export: { label: 'Exportação de Dados', classes: 'bg-gray-100 text-gray-600' },
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const list = await base44.entities.AuditLog.list('-created_date', 200);
        setLogs(list || []);
      } catch { setLogs([]); }
      finally { setLoading(false); }
    };
    loadLogs();
  }, []);

  const filtered = useMemo(() => {
    let result = logs;
    if (filter !== 'all') result = result.filter(l => l.action === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.user_name || '').toLowerCase().includes(q) ||
        (l.user_email || '').toLowerCase().includes(q) ||
        (l.description || '').toLowerCase().includes(q) ||
        (l.tenant_name || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, search, filter]);

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-primary" /> Auditoria
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Registro de todas as ações realizadas na plataforma</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por usuário, descrição, empresa..."
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-border text-sm bg-background">
          <option value="all">Todas as ações</option>
          {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Nenhum registro de auditoria encontrado.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/30">
                  <th className="px-4 py-3 font-medium">Data/Hora</th>
                  <th className="px-4 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Ação</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">Empresa</th>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(log => {
                  const cfg = ACTION_CONFIG[log.action] || { label: log.action, classes: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">{formatDateTime(log.created_date)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground text-xs">{log.user_name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{log.user_email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", cfg.classes)}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">{log.tenant_name || '—'}</td>
                      <td className="px-4 py-3 text-foreground text-xs">{log.description || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}