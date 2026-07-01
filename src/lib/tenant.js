// TODO(super_admin): add an admin-only reconciliation flow to backfill legacy
// records with tenant_id before exposing them through tenant-scoped screens.
export const TENANT_REQUIRED_MESSAGE = 'Não foi possível identificar a empresa vinculada ao seu usuário. Entre em contato com o suporte antes de continuar.';

export function filterByTenant(records, tenantId, { includeLegacy = false } = {}) {
  const list = records || [];
  if (!tenantId) return [];
  return list.filter(record => record?.tenant_id === tenantId || (includeLegacy && !record?.tenant_id));
}

export function requireTenantId(tenantId) {
  if (!tenantId) throw new Error(TENANT_REQUIRED_MESSAGE);
  return tenantId;
}

export function withRequiredTenantId(data, tenantId) {
  return { ...data, tenant_id: requireTenantId(tenantId) };
}

export function belongsToTenant(record, tenantId) {
  return Boolean(tenantId && record?.tenant_id === tenantId);
}
