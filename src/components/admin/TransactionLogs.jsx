import { useState, useMemo } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pricing';

const STATUS_CONFIG = {
  approved: { label: 'Aprovado', classes: 'text-accent-dark bg-accent/10' },
  declined: { label: 'Recusado', classes: 'text-red-600 bg-red-50' },
  pending: { label: 'Pendente', classes: 'text-yellow-600 bg-yellow-50' },
  refunded: { label: 'Estornado', classes: 'text-blue-600 bg-blue-50' },
  cancelled: { label: 'Cancelado', classes: 'text-gray-500 bg-gray-50' },
  error: { label: 'Erro', classes: 'text-red-700 bg-red-100' },
};

const EVENT_LABELS = {
  payment_approved: 'Pagamento Aprovado',
  payment_declined: 'Pagamento Recusado',
  payment_pending: 'Pagamento Pendente',
  refund: 'Estorno',
  cancellation: 'Cancelamento',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TransactionLogs({ logs, loading }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = logs || [];
    if (filter !== 'all') result = result.filter(l => l.status === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.client_name || '').toLowerCase().includes(q) ||
        (l.transaction_id || '').toLowerCase().includes(q) ||
        (l.gateway_name || '').toLowerCase().includes(q) ||
        (l.client_email || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [logs, search, filter]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-foreground">Logs de Transações</h3>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por cliente, transação..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-sm bg-background" />
          </div>
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm bg-background">
            <option value="all">Todos</option>
            <option value="approved">Aprovados</option>
            <option value="declined">Recusados</option>
            <option value="pending">Pendentes</option>
            <option value="refunded">Estornados</option>
            <option value="error">Erros</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" /> Carregando logs...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação registrada.</div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Data/Hora</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">Gateway</th>
                <th className="pb-2 font-medium text-right">Valor</th>
                <th className="pb-2 font-medium">Transação</th>
                <th className="pb-2 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => {
                const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={log.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-muted-foreground whitespace-nowrap">{formatDateTime(log.created_date)}</td>
                    <td className="py-3">
                      <p className="font-medium text-foreground">{log.client_name || '—'}</p>
                      <p className="text-xs text-muted-foreground">{log.client_email || ''}</p>
                    </td>
                    <td className="py-3 text-muted-foreground">{log.gateway_name || '—'}</td>
                    <td className="py-3 text-right font-medium text-foreground">{log.amount != null ? formatCurrency(log.amount) : '—'}</td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">{log.transaction_id || '—'}</td>
                    <td className="py-3 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-medium", cfg.classes)}>
                        {cfg.label}
                      </span>
                      {log.api_message && (
                        <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] truncate" title={log.api_message}>
                          {log.api_message}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}