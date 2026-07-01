import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json();

    // Validate it's a Mercado Pago notification
    const topic = body.topic || body.type;
    const resourceId = body.data?.id || body.resource?.split('/').pop();

    if (!topic || !resourceId) {
      return Response.json({ received: true }, { status: 200 });
    }

    // Use service role for DB updates
    const base44 = createClientFromRequest(req);

    // Load the MP gateway to get the access token
    const gateways = await base44.asServiceRole.entities.PaymentGateway.filter({ provider_type: 'mercadopago', status: 'active' });
    const gateway = gateways?.[0];
    if (!gateway?.api_key) {
      return Response.json({ error: 'Gateway not configured' }, { status: 500 });
    }

    // Fetch payment/subscription details from MP API
    let mpData = null;
    let eventType = 'unknown';
    let newStatus = null;
    let amount = 0;
    let clientEmail = '';

    if (topic === 'payment' || topic === 'payment.updated' || topic === 'payment.created') {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${gateway.api_key}` },
      });
      mpData = await mpRes.json();
      amount = mpData.transaction_amount || 0;
      clientEmail = mpData.payer?.email || '';

      if (mpData.status === 'approved') {
        eventType = 'payment_approved';
        newStatus = 'active';
      } else if (mpData.status === 'rejected' || mpData.status === 'cancelled') {
        eventType = 'payment_declined';
        newStatus = 'pending_payment';
      } else if (mpData.status === 'pending' || mpData.status === 'in_process') {
        eventType = 'payment_pending';
        newStatus = null; // Don't change subscription status yet
      } else if (mpData.status === 'refunded' || mpData.status === 'charged_back') {
        eventType = 'refund';
        newStatus = 'pending_payment';
      }
    } else if (topic === 'subscription_preapproval') {
      const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { Authorization: `Bearer ${gateway.api_key}` },
      });
      mpData = await mpRes.json();
      clientEmail = mpData.payer_email || '';

      if (mpData.status === 'cancelled') {
        eventType = 'cancellation';
        newStatus = 'cancelled';
      }
    }

    // Log the webhook event
    await base44.asServiceRole.entities.WebhookEvent.create({
      gateway_name: 'mercadopago',
      event_type: eventType,
      transaction_id: resourceId,
      status: mpData?.status || topic,
      payload: JSON.stringify(body),
      processed: true,
    });

    // Log the transaction
    if (mpData) {
      await base44.asServiceRole.entities.TransactionLog.create({
        transaction_id: resourceId,
        gateway_name: 'Mercado Pago',
        client_email: clientEmail,
        amount,
        status: eventType === 'payment_approved' ? 'approved' :
                eventType === 'payment_declined' ? 'declined' :
                eventType === 'payment_pending' ? 'pending' :
                eventType === 'refund' ? 'refunded' :
                eventType === 'cancellation' ? 'cancelled' : 'pending',
        event_type: eventType,
        api_message: mpData?.status_detail || mpData?.status || '',
      });
    }

    // Update subscription status if we have a new status
    if (newStatus && clientEmail) {
      const subscriptions = await base44.asServiceRole.entities.Subscription.filter({ billing_email: clientEmail });
      if (subscriptions && subscriptions.length > 0) {
        const sub = subscriptions[0];
        const today = new Date().toISOString().split('T')[0];
        const updateData = { status: newStatus };

        if (newStatus === 'active') {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          updateData.last_payment_date = today;
          updateData.next_billing_date = nextMonth.toISOString().split('T')[0];
        } else if (newStatus === 'cancelled') {
          updateData.cancelled_date = today;
          updateData.auto_renew = false;
        }

        await base44.asServiceRole.entities.Subscription.update(sub.id, updateData);

        // Also create a Payment record for approved payments
        if (newStatus === 'active' && amount > 0) {
          await base44.asServiceRole.entities.Payment.create({
            amount,
            method: mpData?.payment_method_id?.includes('pix') ? 'pix' : 'credit_card',
            status: 'paid',
            payment_date: today,
            due_date: today,
            transaction_id: resourceId,
            description: `Assinatura FarmaLucro AI - Mercado Pago`,
          });
        }
      }
    }

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});