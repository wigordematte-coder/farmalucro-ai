import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = await req.json().catch(() => ({}));
    const cnpj = cleanCnpj(String(body.cnpj || ''));
    if (!isValidCnpj(cnpj)) {
      return Response.json({ error: 'CNPJ invalido.' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const tenants = await base44.asServiceRole.entities.Tenant.filter({ cnpj });
    const tenant = tenants?.[0];
    if (!tenant) {
      return Response.json({ error: 'CNPJ nao encontrado.' }, { status: 404 });
    }

    return Response.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        cnpj: tenant.cnpj,
        responsible_email: tenant.responsible_email,
        subscription_status: tenant.subscription_status,
        is_suspended: Boolean(tenant.is_suspended),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao verificar CNPJ.';
    console.error('resolveTenantByCnpj failed', { message });
    return Response.json({ error: 'Erro ao verificar CNPJ.' }, { status: 500 });
  }
});
