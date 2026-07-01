import { useState, useEffect, useCallback } from 'react';
import { CreditCard, Calendar, RefreshCw, XCircle, AlertTriangle, LifeBuoy, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useSubscription, SUBSCRIPTION_PLAN } from '@/lib/subscriptionContext';
import { appParams } from '@/lib/app-params';
import { formatCurrency } from '@/lib/pricing';
import { useUserRole } from '@/lib/roles';
import { filterByTenant, TENANT_REQUIRED_MESSAGE } from '@/lib/tenant';
import { cn } from '@/lib/utils';
import StatusBadge from '@/components/subscription/StatusBadge';
import PlanDetails from '@/components/subscription/PlanDetails';
import PaymentMethodSelector from '@/components/subscription/PaymentMethodSelector';
import MercadoPagoCheckout from '@/components/subscription/MercadoPagoCheckout';
import PaymentHistory from '@/components/subscription/PaymentHistory';
import BillingInfoForm from '@/components/subscription/BillingInfoForm';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function Subscription() {
  const { subscription, loading, updateSubscription } = useSubscription();
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      if (roleLoading) return;
      setPaymentsLoading(true);
      const list = await base44.entities.Payment.list('-created_date', 100);
      setPayments(isSuperAdmin ? (list || []) : filterByTenant(list, tenantId));
    } catch {
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const handlePaymentConfirm = async () => {
    if (!tenantId) {
      alert(TENANT_REQUIRED_MESSAGE);
      return;
    }

    setCheckoutLoading(true);
    try {
      const baseUrl = appParams.appBaseUrl || '';
      const res = await fetch(`${baseUrl}/api/functions/mercadopagoCheckout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: selectedMethod }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkout_url) {
        throw new Error(data.error || 'Não foi possível iniciar o checkout.');
      }
      window.location.href = data.checkout_url;
    } catch (e) {
      alert(e?.message || 'Erro ao iniciar checkout Mercado Pago.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    const today = new Date().toISOString().split('T')[0];
    await updateSubscription({
      status: 'cancelled',
      cancelled_date: today,
      auto_renew: false,
      cancellation_reason: 'Cancelado pelo usuário',
    });
    setCancelling(false);
    setCancelDialog(false);
  };

  const handleBillingSave = async (formData) => {
    await updateSubscription(formData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const status = subscription?.status || 'trialing';
  const needsPayment = ['pending', 'past_due', 'cancelled', 'expired'].includes(status);
  const isTrial = status === 'trialing';

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">Assinatura e Cobrança</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu plano, pagamentos e forma de cobrança</p>
        </div>
        <StatusBadge status={status} size="lg" />
      </div>

      {needsPayment && (
        <div className={cn("flex items-start gap-3 p-4 rounded-2xl border",
          status === 'expired' ? "bg-red-50 border-red-200" :
          status === 'past_due' ? "bg-orange-50 border-orange-200" :
          "bg-yellow-50 border-yellow-200")}>
          <AlertTriangle className={cn("w-5 h-5 flex-shrink-0 mt-0.5",
            status === 'expired' ? 'text-red-500' :
            status === 'past_due' ? 'text-orange-500' : 'text-yellow-500')} />
          <div className="flex-1">
            <p className="font-medium text-sm text-foreground">
              {status === 'expired' ? 'Assinatura expirada' :
               status === 'past_due' ? 'Pagamento em atraso' :
               status === 'cancelled' ? 'Assinatura cancelada' : 'Pagamento pendente'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === 'expired' ? 'Regularize o pagamento para restaurar o acesso ao sistema.' :
               status === 'past_due' ? `Vencimento em ${formatDate(subscription?.next_billing_date)}. Pague agora para evitar expiração.` :
               status === 'cancelled' ? 'Reative sua assinatura para voltar a usar o sistema.' :
               'Finalize o checkout. A assinatura será liberada automaticamente após confirmação do Mercado Pago.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <PlanDetails />

        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Detalhes da Assinatura</h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Plano
              </span>
              <span className="text-sm font-medium text-foreground">{subscription?.plan_name || SUBSCRIPTION_PLAN.name}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Próxima cobrança
              </span>
              <span className="text-sm font-medium text-foreground">{formatDate(subscription?.next_billing_date)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Último pagamento
              </span>
              <span className="text-sm font-medium text-foreground">{formatDate(subscription?.last_payment_date)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Forma de pagamento
              </span>
              <span className="text-sm font-medium text-foreground">
                {subscription?.payment_method === 'pix' ? 'PIX' :
                 subscription?.payment_method === 'credit_card' ? `Cartão ${subscription?.card_brand || ''} ••${subscription?.card_last_digits || ''}` :
                 'Não definida'}
              </span>
            </div>
            {isTrial && subscription?.trial_end_date && (
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Trial termina em
                </span>
                <span className="text-sm font-medium text-foreground">{formatDate(subscription.trial_end_date)}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Renovação automática
              </span>
              <span className={cn("text-sm font-medium", subscription?.auto_renew ? "text-accent" : "text-muted-foreground")}>
                {subscription?.auto_renew ? 'Ativada' : 'Desativada'}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => setPaymentDialog(true)}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors",
                needsPayment ? "bg-accent text-accent-foreground hover:bg-accent-dark" : "bg-primary text-primary-foreground hover:bg-primary-light"
              )}
            >
              <CreditCard className="w-4 h-4" />
              {status === 'active' ? 'Renovar Assinatura' :
               status === 'cancelled' ? 'Reativar Assinatura' :
               isTrial ? 'Assinar Agora' : 'Pagar Agora'}
            </button>

            {subscription?.payment_method && (
              <button
                onClick={() => { setSelectedMethod(null); setPaymentDialog(true); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border font-medium text-sm text-muted-foreground hover:bg-muted"
              >
                <RefreshCw className="w-4 h-4" />
                Alterar forma de pagamento
              </button>
            )}

            {status === 'active' && (
              <button
                onClick={() => setCancelDialog(true)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 font-medium text-sm text-red-600 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4" />
                Cancelar Assinatura
              </button>
            )}
          </div>
        </div>
      </div>

      <BillingInfoForm subscription={subscription} onSave={handleBillingSave} />
      <PaymentHistory payments={payments} loading={paymentsLoading} />

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <LifeBuoy className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Suporte Financeiro</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Dúvidas sobre cobrança, faturamento ou reembolsos? Entre em contato:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">E-mail:</span>
            <span className="font-medium text-foreground">financeiro@farmalucro.ai</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <span className="text-muted-foreground">WhatsApp:</span>
            <span className="font-medium text-foreground">(11) 4000-0000</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">Horário de atendimento: Seg a Sex, 9h às 18h. Resposta em até 24h úteis.</p>
      </div>

      <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedMethod ? (selectedMethod === 'pix' ? 'Pagamento via PIX' : 'Pagamento com Cartão') : 'Escolha a forma de pagamento'}
            </DialogTitle>
            <DialogDescription>
              {selectedMethod ? `Pagamento de ${formatCurrency(SUBSCRIPTION_PLAN.price)}` : 'Selecione como deseja pagar sua assinatura.'}
            </DialogDescription>
          </DialogHeader>

          {!selectedMethod ? (
            <PaymentMethodSelector value={null} onChange={setSelectedMethod} />
          ) : (
            <MercadoPagoCheckout
              selectedMethod={selectedMethod}
              onConfirm={handlePaymentConfirm}
              onBack={() => setSelectedMethod(null)}
              loading={checkoutLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
            <AlertDialogDescription>
              Sua assinatura será cancelada e o acesso ao sistema será bloqueado no final do período já pago. Seus dados serão preservados caso queira reativar no futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Manter Assinatura</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sim, Cancelar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
