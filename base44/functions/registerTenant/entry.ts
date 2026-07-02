import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLAN_NAME = 'FarmaLucro AI Profissional';
const PLAN_PRICE = 197;

function cleanCnpj(value: string) {
  return (value || '').replace(/\D/g, '');
}

function isValidCnpj(value: string) {
  const cnpj = cleanCnpj(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcDigit = (base: string) => {
    let pos = base.length - 7;
    let sum = 0;
    for (let i = base.length; i >= 1; i--) {
      sum += Number(base.charAt(base.length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    return String(result);
  };

  const first = calcDigit(cnpj.substring(0, 12));
  const second = calcDigit(cnpj.substring(0, 12) + first);
  return cnpj.endsWith(first + second);
}

function toDateOnly(date: Date) {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id && !user?.email) {
      return Response.json({ error: 'Usuario nao autenticado.' }, { status: 401 });
    }
    const userId = user.id || user._id;
    if (!userId) {
      return Response.json({ error: 'Nao foi possivel identificar o usuario autenticado.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const company = body.company || {};
    const cnpj = cleanCnpj(String(body.cnpj || company.cnpj || ''));
    if (!isValidCnpj(cnpj)) {
      return Response.json({ error: 'CNPJ invalido.' }, { status: 400 });
    }

    const legalName = text(company.razao_social);
    if (!legalName) {
      return Response.json({ error: 'Informe a razao social da farmacia.' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.Tenant.filter({ cnpj });
    const linkedToOtherTenant = existing?.find((tenant: any) => tenant.id !== user.tenant_id);
    if (linkedToOtherTenant) {
      return Response.json({ error: 'Este CNPJ ja esta cadastrado.' }, { status: 409 });
    }

    const trialStart = new Date();
    const trialEnd = addDays(trialStart, 14);
    const tenantPayload = {
      name: legalName,
      cnpj,
      trade_name: text(company.nome_fantasia),
      address: text(company.address),
      city: text(company.city),
      state: text(company.state).toUpperCase(),
      zip_code: text(company.zip_code),
      registration_status: text(company.registration_status),
      cnae: text(company.cnae),
      cnae_description: text(company.cnae_description),
      responsible_name: text(company.responsible_name),
      responsible_email: text(company.responsible_email) || user.email,
      responsible_phone: text(company.responsible_phone),
      plan_name: PLAN_NAME,
      subscription_status: 'trialing',
      subscription_start_date: toDateOnly(trialStart),
      subscription_end_date: toDateOnly(trialEnd),
      is_suspended: false,
    };

    const tenant = existing?.[0]?.id
      ? await base44.asServiceRole.entities.Tenant.update(existing[0].id, tenantPayload)
      : await base44.asServiceRole.entities.Tenant.create(tenantPayload);

    const tenantId = tenant.id;
    if (!tenantId) {
      return Response.json({ error: 'Nao foi possivel criar o tenant.' }, { status: 500 });
    }

    await base44.asServiceRole.entities.User.update(userId, {
      app_role: 'pharmacy_admin',
      tenant_id: tenantId,
    });

    const settingsPayload = {
      tenant_id: tenantId,
      name: text(company.nome_fantasia) || legalName,
      legal_name: legalName,
      trade_name: text(company.nome_fantasia),
      cnpj,
      address: text(company.address),
      city: text(company.city),
      state: text(company.state).toUpperCase(),
      zip_code: text(company.zip_code),
      registration_status: text(company.registration_status),
      cnae: text(company.cnae),
      cnae_description: text(company.cnae_description),
      min_margin: 15,
      ideal_margin: 30,
      max_margin: 50,
      objective: 'profit',
      subscription_status: 'trialing',
      subscription_plan: PLAN_NAME,
      trial_end_date: toDateOnly(trialEnd),
    };

    const currentSettings = await base44.asServiceRole.entities.PharmacySettings.filter({ tenant_id: tenantId });
    const pharmacySettings = currentSettings?.[0]?.id
      ? await base44.asServiceRole.entities.PharmacySettings.update(currentSettings[0].id, settingsPayload)
      : await base44.asServiceRole.entities.PharmacySettings.create(settingsPayload);

    const currentSubscriptions = await base44.asServiceRole.entities.Subscription.filter({ tenant_id: tenantId });
    const subscriptionPayload = {
      tenant_id: tenantId,
      plan_name: PLAN_NAME,
      plan_price: PLAN_PRICE,
      billing_cycle: 'monthly',
      status: 'trialing',
      trial_start_date: toDateOnly(trialStart),
      trial_end_date: toDateOnly(trialEnd),
      auto_renew: true,
      billing_company_name: legalName,
      billing_responsible_name: text(company.responsible_name),
      billing_email: text(company.responsible_email) || user.email,
      billing_phone: text(company.responsible_phone),
      billing_document: cnpj,
      billing_address: text(company.address),
    };
    const subscription = currentSubscriptions?.[0]?.id
      ? await base44.asServiceRole.entities.Subscription.update(currentSubscriptions[0].id, subscriptionPayload)
      : await base44.asServiceRole.entities.Subscription.create(subscriptionPayload);

    return Response.json({ tenant, pharmacySettings, subscription });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao finalizar cadastro.';
    return Response.json({ error: message }, { status: 500 });
  }
});
