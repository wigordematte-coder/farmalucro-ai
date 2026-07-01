import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import { filterByTenant, withRequiredTenantId } from '@/lib/tenant';
import { CRITICAL_ROUTES, evaluateSubscriptionEntitlement } from '@/lib/entitlements';

const SubscriptionContext = createContext(null);

export const SUBSCRIPTION_PLAN = {
  name: 'FarmaLucro AI Profissional',
  price: 197.00,
  billing_cycle: 'monthly',
  features: [
    'Usuários ilimitados',
    'Produtos ilimitados',
    'Upload de foto, PDF e XML de nota fiscal',
    'Precificação inteligente',
    'Consultor FarmaLucro AI',
    'Relatórios completos',
    'Sugestões de promoções',
    'Dashboard financeiro',
    'Exportação em PDF e Excel',
  ],
};

export const SUBSCRIPTION_STATUSES = {
  trialing: { label: 'Teste gratuito', color: 'blue', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
  active: { label: 'Ativa', color: 'green', badge: 'bg-accent text-accent-foreground', dot: 'bg-accent' },
  pending: { label: 'Pagamento pendente', color: 'yellow', badge: 'bg-yellow-500 text-white', dot: 'bg-yellow-500' },
  past_due: { label: 'Em atraso', color: 'orange', badge: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
  cancelled: { label: 'Cancelada', color: 'gray', badge: 'bg-gray-500 text-white', dot: 'bg-gray-500' },
  expired: { label: 'Expirada', color: 'red', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
};

export const RESTRICTED_ROUTES = CRITICAL_ROUTES;

export function getTrialDaysRemaining(trialEndDate) {
  if (!trialEndDate) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const trialEnd = new Date(trialEndDate + 'T00:00:00');
  const diff = trialEnd - today;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();

  const evaluateStatus = useCallback((sub) => {
    if (!sub) return null;
    const entitlement = evaluateSubscriptionEntitlement(sub);
    return { ...sub, status: entitlement.status };
  }, []);

  const loadSubscription = useCallback(async () => {
    try {
      if (roleLoading) return;
      const list = await base44.entities.Subscription.list('-created_date', 50);
      const tenantSubscriptions = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
      if (tenantSubscriptions && tenantSubscriptions.length > 0) {
        let sub = tenantSubscriptions[0];
        const evaluated = evaluateStatus(sub);
        setSubscription(evaluated);
        if (evaluated.status !== sub.status) {
          if (['past_due', 'expired', 'pending'].includes(evaluated.status) && sub.billing_email) {
            const email = sub.billing_email;
            const subject = evaluated.status === 'expired'
              ? '⚠️ Sua assinatura FarmaLucro AI foi bloqueada'
              : evaluated.status === 'pending'
              ? '⏰ Seu período de teste terminou'
              : '⏰ Pagamento da sua assinatura FarmaLucro AI está em atraso';
            const body = evaluated.status === 'expired'
              ? `<h2>Sua assinatura foi bloqueada</h2><p>Sua assinatura FarmaLucro AI está bloqueada. Acesse o sistema para regularizar o pagamento e restaurar todas as funcionalidades.</p><p>Seus dados estão seguros e preservados.</p>`
              : evaluated.status === 'pending'
              ? `<h2>Seu período de teste terminou</h2><p>Seu período de teste gratuito de 14 dias chegou ao fim. Contrate um plano para continuar utilizando todas as funcionalidades do FarmaLucro AI.</p><p>Seus dados estão seguros e preservados.</p>`
              : `<h2>Pagamento em atraso</h2><p>O pagamento da sua assinatura FarmaLucro AI está em atraso. Regularize o quanto antes para evitar o bloqueio do sistema.</p>`;
            if (email) {
              base44.integrations.Core.SendEmail({ to: email, subject, body }).catch(() => {});
            }
          }
        }
        return;
      }
      if (!tenantId) {
        setSubscription(null);
        return;
      }
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const created = await base44.entities.Subscription.create(withRequiredTenantId({
        plan_name: SUBSCRIPTION_PLAN.name,
        plan_price: SUBSCRIPTION_PLAN.price,
        billing_cycle: 'monthly',
        status: 'trialing',
        trial_start_date: trialStart.toISOString().split('T')[0],
        trial_end_date: trialEnd.toISOString().split('T')[0],
        auto_renew: true,
      }, tenantId));
      setSubscription(created);
    } catch {
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [evaluateStatus, tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const updateBillingInfo = useCallback(async (data) => {
    if (!subscription?.id) return;
    try {
      const res = await fetch('/api/functions/subscriptionSelfService', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_billing', data }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro ao atualizar dados de cobrança.');
      setSubscription(payload.subscription);
      return payload.subscription;
    } catch {
      return null;
    }
  }, [subscription]);

  const cancelSubscription = useCallback(async () => {
    try {
      const res = await fetch('/api/functions/subscriptionSelfService', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Erro ao cancelar assinatura.');
      setSubscription(payload.subscription);
      return payload.subscription;
    } catch {
      return null;
    }
  }, []);

  const reloadSubscription = useCallback(() => {
    setLoading(true);
    loadSubscription();
  }, [loadSubscription]);

  const entitlement = evaluateSubscriptionEntitlement(subscription);
  const trialDaysRemaining = entitlement.status === 'trialing' ? getTrialDaysRemaining(subscription?.trial_end_date) : 0;
  const isTrialExpired = entitlement.isTrialExpired;
  const isBlocked = entitlement.isBlocked;
  const isRestricted = entitlement.isRestricted;

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      loading,
      updateBillingInfo,
      cancelSubscription,
      reloadSubscription,
      evaluateStatus,
      trialDaysRemaining,
      isTrialExpired,
      isBlocked,
      isRestricted,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    return {
      subscription: null,
      loading: false,
      updateBillingInfo: async () => {},
      cancelSubscription: async () => {},
      reloadSubscription: () => {},
      trialDaysRemaining: 0,
      isTrialExpired: false,
      isBlocked: false,
      isRestricted: false,
    };
  }
  return ctx;
}
