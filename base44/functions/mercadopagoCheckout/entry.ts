import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLAN_NAME = 'FarmaLucro AI Profissional';
const PLAN_PRICE = 197;

function addMonth(date: Date) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
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
    const user = await base44.auth.me();
    const tenantId = user?.tenant_id;

    if (!tenantId) {
      return Response.json({ error: 'Tenant not found for authenticated user' }, { status: 403 });
    }

    const { method = 'credit_card' } = await req.json().catch(() => ({}));
    const paymentMethod = method === 'pix' ? 'pix' : 'credit_card';
    const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ tenant_id: tenantId });
    const subscription = subscriptions?.[0];

    if (!subscription?.id) {
      return Response.json({ error: 'Subscription not found for tenant' }, { status: 404 });
    }

    const origin = req.headers.get('origin') || Deno.env.get('APP_BASE_URL') || '';
    const notificationUrl = Deno.env.get('MERCADOPAGO_WEBHOOK_URL') || `${origin}/api/functions/mercadopagoWebhook`;
    const checkoutReturnUrl = `${origin}/assinatura`;

    const metadata = {
      tenant_id: tenantId,
      subscription_id: subscription.id,
      selected_method: paymentMethod,
      plan_name: PLAN_NAME,
    };
    const checkoutPayload = paymentMethod === 'credit_card'
      ? {
          reason: PLAN_NAME,
          external_reference: tenantId,
          payer_email: subscription.billing_email || user.email,
          notification_url: notificationUrl,
          back_url: checkoutReturnUrl,
          status: 'pending',
          metadata,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: PLAN_PRICE,
            currency_id: 'BRL',
          },
        }
      : {
          items: [{
            title: PLAN_NAME,
            quantity: 1,
            currency_id: 'BRL',
            unit_price: PLAN_PRICE,
          }],
          payer: {
            email: subscription.billing_email || user.email,
            name: subscription.billing_responsible_name || user.full_name || user.email,
          },
          external_reference: tenantId,
          metadata,
          notification_url: notificationUrl,
          back_urls: {
            success: checkoutReturnUrl,
            pending: checkoutReturnUrl,
            failure: checkoutReturnUrl,
          },
          auto_return: 'approved',
          statement_descriptor: 'FARMALUCRO',
        };
    const endpoint = paymentMethod === 'credit_card'
      ? 'https://api.mercadopago.com/preapproval'
      : 'https://api.mercadopago.com/checkout/preferences';

    const mpRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutPayload),
    });

    const checkout = await mpRes.json();
    if (!mpRes.ok) {
      return Response.json({ error: checkout?.message || 'Unable to create Mercado Pago checkout' }, { status: 502 });
    }

    const today = new Date();
    await base44.asServiceRole.entities.Subscription.update(subscription.id, {
      status: 'pending',
      payment_method: method,
      next_billing_date: subscription.next_billing_date || addMonth(today),
    });
    await base44.asServiceRole.entities.Tenant.update(tenantId, {
      subscription_status: 'pending',
    }).catch(() => {});

    await base44.asServiceRole.entities.Payment.create({
      tenant_id: tenantId,
      amount: PLAN_PRICE,
      method: paymentMethod,
      status: 'pending',
      due_date: today.toISOString().split('T')[0],
      transaction_id: `${paymentMethod === 'credit_card' ? 'mp_preapproval' : 'mp_pref'}_${checkout.id}`,
      description: `${PLAN_NAME} - Checkout Mercado Pago`,
    });

    return Response.json({
      preference_id: checkout.id,
      checkout_url: checkout.init_point || checkout.sandbox_init_point,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
