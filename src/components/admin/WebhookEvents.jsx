import { useState, useMemo } from 'react';
import { Search, Webhook, CheckCircle2, Clock, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_CONFIG = {
  payment_approved: { label: 'Pagamento Aprovado', icon: CheckCircle2, classes: 'text-accent-dark' },
  payment_declined: { label: 'Pagamento Recusado', icon: XCircle, classes: 'text-red-500' },
  payment_pending: { label: 'Pagamento Pendente', icon: Clock, classes: 'text-yellow-500' },
  refund: { label: 'Estorno', icon: RefreshCw, classes: 'text-blue-500' },
  cancellation: { label: 'Cancelamento', icon: XCircle, classes: 'text-gray-500' },
};

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function WebhookEvents({ events, loading }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return events || [];
    const q = search.toLowerCase();
    return (events || []).filter(e =>
      (e.gateway_name || '').toLowerCase().includes(q) ||
      (e.transaction_id || '').toLowerCase().includes(q) ||
      (e.event_type || '').toLowerCase().includes(q)
    );
  }, [events, search]);

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Webhook className="w-5 h-5 text-primary" /> Eventos de Webhook
        </h3>
        <div className="relative w-full sm:w-56">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar eventos..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border text-sm bg-background" />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">Nenhum evento de webhook recebido.</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(ev => {
            const cfg = EVENT_CONFIG[ev.event_type] || EVENT_CONFIG.payment_pending;
            return (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                <cfg.icon className={cn("w-5 h-5 flex-shrink-0", cfg.classes)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{cfg.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.gateway_name} • {formatDateTime(ev.created_date)} • {ev.transaction_id || '—'}
                  </p>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                  ev.processed ? 'bg-accent/10 text-accent-dark' : 'bg-yellow-50 text-yellow-600')}>
                  {ev.processed ? 'Processado' : 'Pendente'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}