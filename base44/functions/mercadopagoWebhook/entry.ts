import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function addMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
}

function getNotificationData(body: Record<string, any>) {
  const topic = body.topic || body.type || body.action;
  const resourceId = body.data?.id || body.resource?.split('/').pop() || body.id;
  return { topic, resourceId };
}

function mapPaymentStatus(status: string) {
  if (status === 'approved') return { eventType: 'payment_approved', subscriptionStatus: 'active', paymentStatus: 'paid' };
  if (status === 'pending' || status === 'in_process') return { eventType: 'payment_pending', subscriptionStatus: 'pending', paymentStatus: 'pending' };
  if (status === 'rejected' || status === 'cancelled') return { eventType: 'payment_declined', subscriptionStatus: 'past_due', paymentStatus: 'failed' };
  if (status === 'refunded' || status === 'charged_back') return { eventType: 'refund', subscriptionStatus: 'past_due', paymentStatus: 'refunded' };
  if (status === 'expired') return { eventType: 'payment_expired', subscriptionStatus: 'expired', paymentStatus: 'expired' };
  return { eventType: 'payment_unknown', subscriptionStatus: null, paymentStatus: 'pending' };
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
    if (!accessToken) {
      return Response.json({ error: 'Mercado Pago access token not configured' }, { status: 500 });
    }

    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { topic, resourceId } = getNotificationData(body);

    if (!topic || !resourceId) {
      return Response.json({ received: true }, { status: 200 });
    }

    let mpData: any = null;
    let eventType = 'unknown';
    let subscriptionStatus: string | null = null;
    let paymentStatus = 'pending';
    let amount = 0;
    let clientEmail = '';
    let tenantId = '';
    let method = 'credit_card';

    if (String(topic).includes('payment')) {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      mpData = await mpRes.json();
      amount = mpData.transaction_amount || 0;
      clientEmail = mpData.payer?.email || '';
      tenantId = mpData.metadata?.tenant_id || mpData.external_reference || '';
      method = mpData.payment_method_id === 'pix' ? 'pix' : 'credit_card';

      const mapped = mapPaymentStatus(mpData.status);
      eventType = mapped.eventType;
      subscriptionStatus = mapped.subscriptionStatus;
      paymentStatus = mapped.paymentStatus;
    } else if (String(topic).includes('subscription_preapproval')) {
      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      mpData = await mpRes.json();
      clientEmail = mpData.payer_email || '';
      tenantId = mpData.metadata?.tenant_id || mpData.external_reference || '';
      amount = mpData.auto_recurring?.transaction_amount || 0;

      if (mpData.status === 'cancelled') {
        eventType = 'cancellation';
        subscriptionStatus = 'cancelled';
        paymentStatus = 'failed';
      } else if (mpData.status === 'authorized') {
        eventType = 'subscription_authorized';
        subscriptionStatus = 'active';
        paymentStatus = 'paid';
      } else {
        eventType = 'subscription_pending';
        subscriptionStatus = 'pending';
      }
    }

    await base44.asServiceRole.entities.WebhookEvent.create({
      gateway_name: 'mercadopago',
      event_type: eventType,
      transaction_id: String(resourceId),
      status: mpData?.status || String(topic),
      payload: JSON.stringify({ body, tenant_id: tenantId }),
      processed: Boolean(tenantId),
    });

    if (mpData) {
      await base44.asServiceRole.entities.TransactionLog.create({
        transaction_id: String(resourceId),
        gateway_name: 'Mercado Pago',
        client_email: clientEmail,
        amount,
        status: paymentStatus === 'paid' ? 'approved' :
                paymentStatus === 'failed' ? 'declined' :
                paymentStatus === 'refunded' ? 'refunded' :
                paymentStatus === 'expired' ? 'cancelled' : 'pending',
        event_type: eventType,
        api_message: mpData?.status_detail || mpData?.status || '',
      });
    }

    if (!tenantId || !subscriptionStatus) {
      return Response.json({ received: true }, { status: 200 });
    }

    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ tenant_id: tenantId });
    const sub = subscriptions?.[0];
    if (!sub?.id) {
      return Response.json({ received: true, warning: 'Subscription not found for tenant' }, { status: 200 });
    }

    const today = new Date();
    const todayIso = today.toISOString().split('T')[0];
    const updateData: Record<string, any> = {
      status: subscriptionStatus,
      payment_method: method,
    };

    if (subscriptionStatus === 'active') {
      updateData.last_payment_date = todayIso;
      updateData.next_billing_date = addMonth(today);
      updateData.cancelled_date = null;
      updateData.cancellation_reason = null;
      updateData.auto_renew = true;
    } else if (subscriptionStatus === 'cancelled') {
      updateData.cancelled_date = todayIso;
      updateData.auto_renew = false;
    }

    await base44.asServiceRole.entities.Subscription.update(sub.id, updateData);
    const tenantUpdate: Record<string, any> = {
      subscription_status: subscriptionStatus,
    };
    if (updateData.next_billing_date) {
      tenantUpdate.subscription_end_date = updateData.next_billing_date;
    }
    await base44.asServiceRole.entities.Tenant.update(tenantId, tenantUpdate).catch(() => {});

    if (paymentStatus === 'paid' && amount > 0) {
      await base44.asServiceRole.entities.Payment.create({
        tenant_id: tenantId,
        amount,
        method,
        status: 'paid',
        payment_date: todayIso,
        due_date: todayIso,
        transaction_id: String(resourceId),
        description: 'Assinatura FarmaLucro AI - Mercado Pago',
      });
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
