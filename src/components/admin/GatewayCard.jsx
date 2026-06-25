import { Zap, Trash2, Pencil, Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PROVIDER_LABELS = {
  stripe: 'Stripe', mercadopago: 'Mercado Pago', pagseguro: 'PagSeguro',
  asaas: 'Asaas', paggue: 'Paggue', custom: 'Personalizado',
};

function maskKey(key) {
  if (!key) return '—';
  if (key.length <= 8) return '••••';
  return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
}

export default function GatewayCard({ gateway, onEdit, onDelete, onSetDefault, onTest, testingId }) {
  const testing = testingId === gateway.id;
  return (
    <div className={cn(
      "bg-card border rounded-2xl p-5",
      gateway.is_default ? "border-accent shadow-sm shadow-accent/10" : "border-border"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{gateway.name}</h3>
            {gateway.is_default && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent-dark text-xs font-semibold">
                <Star className="w-3 h-3" /> Padrão
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{PROVIDER_LABELS[gateway.provider_type] || gateway.provider_type}</p>
        </div>
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-xs font-semibold",
          gateway.status === 'active' ? 'bg-accent/10 text-accent-dark' : 'bg-muted text-muted-foreground'
        )}>
          {gateway.status === 'active' ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Ambiente</span>
          <span className={cn("font-medium",
            gateway.environment === 'production' ? 'text-orange-600' : 'text-blue-600')}>
            {gateway.environment === 'production' ? 'Produção' : 'Sandbox'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Token de Acesso</span>
          <span className="font-mono text-xs text-foreground">{maskKey(gateway.api_key)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Chave Secreta</span>
          <span className="font-mono text-xs text-foreground">{maskKey(gateway.secret_key)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Webhook</span>
          <span className="font-mono text-xs text-foreground truncate max-w-[180px]">{gateway.webhook_url || '—'}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
        <button onClick={() => onTest(gateway)} disabled={testing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-primary hover:bg-primary/5">
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Testar
        </button>
        <button onClick={() => onEdit(gateway)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted">
          <Pencil className="w-3.5 h-3.5" /> Editar
        </button>
        {!gateway.is_default && (
          <button onClick={() => onSetDefault(gateway)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted">
            <Star className="w-3.5 h-3.5" /> Padrão
          </button>
        )}
        <button onClick={() => onDelete(gateway)}
          className="ml-auto p-1.5 rounded-lg text-red-500 hover:bg-red-50">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}