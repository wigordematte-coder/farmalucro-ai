import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const SAFE_BILLING_FIELDS = [
  'billing_responsible_name',
  'billing_email',
  'billing_phone',
  'billing_document',
  'billing_address',
];

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const tenantId = user?.tenant_id;
    if (!tenantId) {
      return Response.json({ error: 'Tenant not found for authenticated user' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ tenant_id: tenantId });
    const subscription = subscriptions?.[0];
    if (!subscription?.id) {
      return Response.json({ error: 'Subscription not found for tenant' }, { status: 404 });
    }

    if (body.action === 'update_billing') {
      const updateData: Record<string, string> = {};
      for (const field of SAFE_BILLING_FIELDS) {
        if (typeof body.data?.[field] === 'string') {
          updateData[field] = body.data[field];
        }
      }
      const updated = await base44.asServiceRole.entities.Subscription.update(subscription.id, updateData);
      return Response.json({ subscription: updated });
    }

    if (body.action === 'cancel') {
      const todayIso = new Date().toISOString().split('T')[0];
      const updated = await base44.asServiceRole.entities.Subscription.update(subscription.id, {
        status: 'cancelled',
        cancelled_date: todayIso,
        auto_renew: false,
        cancellation_reason: 'Cancelado pelo usuário',
      });
      await base44.asServiceRole.entities.Tenant.update(tenantId, {
        subscription_status: 'cancelled',
      }).catch(() => {});
      return Response.json({ subscription: updated });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
