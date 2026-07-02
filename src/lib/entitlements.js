export const CRITICAL_ROUTES = [
  '/importacao',
  '/consultor-ia',
  '/relatorios',
  '/precificacao',
  '/plano-acao',
];

const LEGACY_STATUS = {
  trial: 'trialing',
  pending_subscription: 'pending',
  pending_payment: 'pending',
  overdue: 'past_due',
  blocked: 'expired',
};

export function normalizeSubscriptionStatus(status) {
  return LEGACY_STATUS[status] || status;
}

export function evaluateSubscriptionEntitlement(subscription, today = new Date()) {
  if (!subscription) {
    return { status: null, isTrialExpired: false, isBlocked: false, isRestricted: true };
  }

  today.setHours(0, 0, 0, 0);
  let status = normalizeSubscriptionStatus(subscription.status);

  if (status === 'trialing' && subscription.trial_end_date) {
    const trialEnd = new Date(`${subscription.trial_end_date}T00:00:00`);
    if (trialEnd < today) status = 'pending';
  }

  if (['active', 'pending', 'past_due'].includes(status) && subscription.next_billing_date) {
    const nextBilling = new Date(`${subscription.next_billing_date}T00:00:00`);
    if (nextBilling < today) {
      const graceLimit = new Date(nextBilling);
      graceLimit.setDate(graceLimit.getDate() + 3);
      status = graceLimit < today ? 'expired' : 'past_due';
    }
  }

  const isTrialExpired = status === 'pending';
  const isBlocked = ['past_due', 'cancelled', 'expired'].includes(status);
  return {
    status,
    isTrialExpired,
    isBlocked,
    isRestricted: isTrialExpired || isBlocked,
  };
}

export function isCriticalRoute(pathname) {
  return CRITICAL_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}
