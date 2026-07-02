import { cleanCNPJ, validateCNPJ } from '@/lib/auth-helpers';

export async function fetchCompanyByCNPJ(cnpj) {
  const clean = cleanCNPJ(cnpj);
  if (!validateCNPJ(clean)) {
    throw new Error('CNPJ invalido.');
  }

  const response = await fetch('/api/functions/lookupCnpj', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cnpj: clean }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.warn('lookupCnpj failed', {
      endpoint: '/api/functions/lookupCnpj',
      status: response.status,
      payload,
    });
    throw new Error(payload.error || 'Nao foi possivel consultar os dados publicos do CNPJ.');
  }

  return payload.company || {};
}

export async function resolveTenantByCNPJ(cnpj) {
  const clean = cleanCNPJ(cnpj);
  if (!validateCNPJ(clean)) {
    throw new Error('CNPJ invalido.');
  }

  const response = await fetch('/api/functions/resolveTenantByCnpj', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cnpj: clean }),
  });

  const payload = await response.json().catch(() => ({}));
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    console.warn('resolveTenantByCnpj failed', {
      endpoint: '/api/functions/resolveTenantByCnpj',
      status: response.status,
      payload,
    });
    throw new Error(payload.error || 'Erro ao verificar CNPJ. Tente novamente.');
  }

  return payload.tenant || null;
}
