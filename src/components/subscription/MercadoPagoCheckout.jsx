import { CreditCard, QrCode, Loader2, ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUBSCRIPTION_PLAN } from '@/lib/subscriptionContext';
import { formatCurrency } from '@/lib/pricing';

export default function MercadoPagoCheckout({ selectedMethod, onConfirm, onBack, loading }) {
  const isPix = selectedMethod === 'pix';
  const Icon = isPix ? QrCode : CreditCard;

  return (
    <div className="space-y-4">
      <div className="text-center p-5 bg-muted/50 rounded-2xl space-y-3">
        <Icon className="w-12 h-12 text-muted-foreground mx-auto" />
        <div>
          <p className="font-semibold text-foreground">
            {isPix ? 'Pagamento via PIX' : 'Pagamento com cartão'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isPix
              ? 'PIX confirma este ciclo manualmente. A renovação mensal precisará de novo pagamento, e a liberação só ocorre após webhook.'
              : 'Você será redirecionado para a assinatura recorrente do Mercado Pago. A liberação só ocorre após webhook.'}
          </p>
        </div>
        <div className="bg-accent/10 rounded-xl p-3 text-sm text-accent font-semibold">
          {SUBSCRIPTION_PLAN.name}: {formatCurrency(SUBSCRIPTION_PLAN.price)}/mês
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4" />
        Credenciais e confirmação de pagamento ficam somente no backend.
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1" disabled={loading}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button onClick={onConfirm} disabled={loading} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ExternalLink className="w-4 h-4" /> Ir ao Mercado Pago</>}
        </Button>
      </div>
    </div>
  );
}
