import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function addMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
}

const PLAN_NAME = 'FarmaLucro AI Profissional';
const PLAN_PRICE = 197;

function getNotificationData(body: Record<string, any>) {
  const topic = body.topic || body.type || body.action;
  const resourceId = body.data?.id || body.resource?.split('/').pop() || body.id;
  return { topic, resourceId };
}

function parseSignature(header: string) {
  return Object.fromEntries(
    header.split(',').map(part => {
      const [key, value] = part.split('=');
      return [key?.trim(), value?.trim()];
    }).filter(([key, value]) => key && value)
  );
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hmacSha256Hex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

async function validateMercadoPagoSignature(req: Request, body: Record<string, any>) {
  const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
  if (!webhookSecret) return { ok: false, status: 500, error: 'Mercado Pago webhook secret not configured' };

  const signatureHeader = req.headers.get('x-signature') || '';
  const requestId = req.headers.get('x-request-id') || '';
  const signature = parseSignature(signatureHeader);
  const ts = signature.ts;
  const v1 = signature.v1;
  if (!requestId || !ts || !v1) return { ok: false, status: 401, error: 'Invalid webhook signature headers' };

  const url = new URL(req.url);
  const dataId = url.searchParams.get('data.id') || body.data?.id || body.id || '';
  const manifest = dataId
    ? `id:${dataId};request-id:${requestId};ts:${ts};`
    : `request-id:${requestId};ts:${ts};`;
  const expected = await hmacSha256Hex(webhookSecret, manifest);
  if (!timingSafeEqual(expected, v1)) return { ok: false, status: 403, error: 'Invalid webhook signature' };

  return { ok: true };
}

async function clearStoredMercadoPagoSecrets(base44: any) {
  const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ provider_type: 'mercadopago' });
  await Promise.all((gateways || [])
    .filter((gateway: any) => gateway.api_key || gateway.public_key || gateway.secret_key)
    .map((gateway: any) => base44.asServiceRole.entities.PaymentGateway.update(gateway.id, {
      api_key: '',
      public_key: '',
      secret_key: '',
    }).catch(() => {})));
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

    const body = await req.json();
    const signatureValidation = await validateMercadoPagoSignature(req, body);
    if (!signatureValidation.ok) {
      return Response.json({ error: signatureValidation.error }, { status: signatureValidation.status });
    }

    const base44 = createClientFromRequest(req);
    await clearStoredMercadoPagoSecrets(base44);

    const { topic, resourceId } = getNotificationData(body);

    if (!topic || !resourceId) {
      return Response.json({ received: true }, { status: 200 });
    }

    const eventKey = `${topic}_${body.id || body.data?.id || resourceId}`;
    const previousEvents = await base44.asServiceRole.entities.WebhookEvent.filter({
      gateway_name: 'mercadopago',
      transaction_id: eventKey,
    });
    if (previousEvents?.some((event: any) => event.processed)) {
      return Response.json({ received: true, duplicate: true }, { status: 200 });
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
      if (!mpRes.ok) return Response.json({ received: false, error: 'Unable to fetch Mercado Pago payment' }, { status: 502 });
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
      if (!mpRes.ok) return Response.json({ received: false, error: 'Unable to fetch Mercado Pago preapproval' }, { status: 502 });
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
      transaction_id: eventKey,
      status: mpData?.status || String(topic),
      payload: JSON.stringify({ body, tenant_id: tenantId }),
      processed: false,
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

    if (subscriptionStatus === 'active') {
      const metadata = mpData?.metadata || {};
      const metadataSubscriptionId = metadata.subscription_id;
      const metadataPlanName = metadata.plan_name;
      const currency = mpData.currency_id || mpData.auto_recurring?.currency_id;
      const isApproved = mpData.status === 'approved' || mpData.status === 'authorized';
      const amountMatches = Number(amount) === PLAN_PRICE;
      const tenantMatches = Boolean(tenantId && sub.tenant_id === tenantId);
      const subscriptionMatches = Boolean(metadataSubscriptionId && metadataSubscriptionId === sub.id);
      const planMatches = metadataPlanName === PLAN_NAME;
      const currencyMatches = currency === 'BRL';

      if (!tenantMatches || !subscriptionMatches || !planMatches || !amountMatches || !currencyMatches || !isApproved) {
        await base44.asServiceRole.entities.WebhookEvent.create({
          gateway_name: 'mercadopago',
          event_type: 'validation_failed',
          transaction_id: `${eventKey}_validation_failed`,
          status: mpData?.status || String(topic),
          payload: JSON.stringify({
            tenantMatches,
            subscriptionMatches,
            planMatches,
            amountMatches,
            currencyMatches,
            isApproved,
            tenant_id: tenantId,
            subscription_id: metadataSubscriptionId,
          }),
          processed: false,
        });
        return Response.json({ received: true, warning: 'Activation validation failed' }, { status: 200 });
      }
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
      const existingPayments = await base44.asServiceRole.entities.Payment.filter({ transaction_id: String(resourceId), tenant_id: tenantId });
      if (!existingPayments?.length) {
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
    }

    await base44.asServiceRole.entities.WebhookEvent.create({
      gateway_name: 'mercadopago',
      event_type: 'processed',
      transaction_id: eventKey,
      status: mpData?.status || String(topic),
      payload: JSON.stringify({ tenant_id: tenantId, subscription_id: sub.id }),
      processed: true,
    });

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
