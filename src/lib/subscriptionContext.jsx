import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import { filterByTenant, withTenantId } from '@/lib/tenant';

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
  active: { label: 'Ativa', color: 'green', badge: 'bg-accent text-accent-foreground', dot: 'bg-accent' },
  trial: { label: 'Teste gratuito', color: 'blue', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
  pending_subscription: { label: 'Aguardando assinatura', color: 'amber', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
  pending_payment: { label: 'Pagamento pendente', color: 'yellow', badge: 'bg-yellow-500 text-white', dot: 'bg-yellow-500' },
  overdue: { label: 'Em atraso', color: 'orange', badge: 'bg-orange-500 text-white', dot: 'bg-orange-500' },
  blocked: { label: 'Bloqueada', color: 'red', badge: 'bg-red-500 text-white', dot: 'bg-red-500' },
  cancelled: { label: 'Cancelada', color: 'gray', badge: 'bg-gray-500 text-white', dot: 'bg-gray-500' },
};

export const RESTRICTED_ROUTES = [
  '/importacao',
  '/consultor-ia',
  '/relatorios',
  '/precificacao',
];

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
    if (sub.status === 'cancelled') return sub;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let updated = { ...sub };

    if (sub.status === 'trial' && sub.trial_end_date) {
      const trialEnd = new Date(sub.trial_end_date + 'T00:00:00');
      if (trialEnd < today) {
        updated.status = 'pending_subscription';
        updated.next_billing_date = updated.next_billing_date || sub.trial_end_date;
      }
    }

    if (['active', 'pending_payment', 'overdue', 'blocked'].includes(updated.status) && updated.next_billing_date) {
      const nextBilling = new Date(updated.next_billing_date + 'T00:00:00');
      if (nextBilling < today) {
        const threeDaysAfter = new Date(nextBilling);
        threeDaysAfter.setDate(threeDaysAfter.getDate() + 3);
        if (threeDaysAfter < today) {
          updated.status = 'blocked';
        } else {
          updated.status = 'overdue';
        }
      }
    }

    return updated;
  }, []);

  const loadSubscription = useCallback(async () => {
    try {
      if (roleLoading) return;
      const list = await base44.entities.Subscription.list('-created_date', 50);
      const tenantSubscriptions = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
      if (tenantSubscriptions && tenantSubscriptions.length > 0) {
        let sub = tenantSubscriptions[0];
        const evaluated = evaluateStatus(sub);
        if (evaluated.status !== sub.status) {
          const updated = await base44.entities.Subscription.update(sub.id, { status: evaluated.status });
          setSubscription(updated);
          if (['overdue', 'blocked', 'pending_subscription'].includes(evaluated.status) && sub.billing_email) {
            const email = sub.billing_email;
            const subject = evaluated.status === 'blocked'
              ? '⚠️ Sua assinatura FarmaLucro AI foi bloqueada'
              : evaluated.status === 'pending_subscription'
              ? '⏰ Seu período de teste terminou'
              : '⏰ Pagamento da sua assinatura FarmaLucro AI está em atraso';
            const body = evaluated.status === 'blocked'
              ? `<h2>Sua assinatura foi bloqueada</h2><p>Sua assinatura FarmaLucro AI está bloqueada. Acesse o sistema para regularizar o pagamento e restaurar todas as funcionalidades.</p><p>Seus dados estão seguros e preservados.</p>`
              : evaluated.status === 'pending_subscription'
              ? `<h2>Seu período de teste terminou</h2><p>Seu período de teste gratuito de 14 dias chegou ao fim. Contrate um plano para continuar utilizando todas as funcionalidades do FarmaLucro AI.</p><p>Seus dados estão seguros e preservados.</p>`
              : `<h2>Pagamento em atraso</h2><p>O pagamento da sua assinatura FarmaLucro AI está em atraso. Regularize o quanto antes para evitar o bloqueio do sistema.</p>`;
            if (email) {
              base44.integrations.Core.SendEmail({ to: email, subject, body }).catch(() => {});
            }
          }
        } else {
          setSubscription(sub);
        }
        return;
      }
      const trialStart = new Date();
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14);
      const created = await base44.entities.Subscription.create(withTenantId({
        plan_name: SUBSCRIPTION_PLAN.name,
        plan_price: SUBSCRIPTION_PLAN.price,
        billing_cycle: 'monthly',
        status: 'trial',
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

  const updateSubscription = useCallback(async (data) => {
    if (!subscription?.id) return;
    try {
      const updated = await base44.entities.Subscription.update(subscription.id, data);
      setSubscription(updated);
      return updated;
    } catch {
      return null;
    }
  }, [subscription]);

  const reloadSubscription = useCallback(() => {
    setLoading(true);
    loadSubscription();
  }, [loadSubscription]);

  const trialDaysRemaining = subscription?.status === 'trial' ? getTrialDaysRemaining(subscription.trial_end_date) : 0;
  const isTrialExpired = subscription?.status === 'pending_subscription';
  const isBlocked = subscription?.status === 'blocked';
  const isRestricted = isTrialExpired || isBlocked;

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      loading,
      updateSubscription,
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
      updateSubscription: async () => {},
      reloadSubscription: () => {},
      trialDaysRemaining: 0,
      isTrialExpired: false,
      isBlocked: false,
      isRestricted: false,
    };
  }
  return ctx;
}
