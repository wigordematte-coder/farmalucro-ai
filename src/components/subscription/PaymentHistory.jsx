import { useState, useMemo } from 'react';
import { Search, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/pricing';

const STATUS_CONFIG = {
  paid: { label: 'Pago', icon: CheckCircle2, classes: 'text-accent' },
  pending: { label: 'Pendente', icon: Clock, classes: 'text-yellow-500' },
  failed: { label: 'Falhou', icon: XCircle, classes: 'text-red-500' },
  refunded: { label: 'Estornado', icon: RefreshCw, classes: 'text-blue-500' },
  expired: { label: 'Expirado', icon: XCircle, classes: 'text-gray-400' },
};

const METHOD_LABELS = { pix: 'PIX', credit_card: 'Cartão de Crédito' };

export default function PaymentHistory({ payments, loading }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = payments || [];
    if (filter !== 'all') result = result.filter(p => p.status === filter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        (p.description || '').toLowerCase().includes(q) ||
        (p.transaction_id || '').toLowerCase().includes(q) ||
        (p.method || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [payments, search, filter]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-foreground">Histórico de Pagamentos</h3>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-sm bg-background"
            />
          </div>
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border text-sm bg-background"
          >
            <option value="all">Todos</option>
            <option value="paid">Pagos</option>
            <option value="pending">Pendentes</option>
            <option value="failed">Falhou</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento encontrado.</div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border">
                <th className="pb-2 font-medium">Data</th>
                <th className="pb-2 font-medium">Descrição</th>
                <th className="pb-2 font-medium">Método</th>
                <th className="pb-2 font-medium text-right">Valor</th>
                <th className="pb-2 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 text-muted-foreground whitespace-nowrap">
                      {p.payment_date ? new Date(p.payment_date + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="py-3 text-foreground">{p.description || 'Mensalidade'}</td>
                    <td className="py-3 text-muted-foreground">{METHOD_LABELS[p.method] || p.method}</td>
                    <td className="py-3 text-right font-medium text-foreground">{formatCurrency(p.amount)}</td>
                    <td className="py-3 text-center">
                      <span className={cn("inline-flex items-center gap-1 text-xs font-medium", cfg.classes)}>
                        <cfg.icon className="w-3.5 h-3.5" />
                        {cfg.label}
                      </span>
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