export function filterByTenant(records, tenantId, { includeLegacy = true } = {}) {
  const list = records || [];
  if (!tenantId) return [];
  return list.filter(record => record?.tenant_id === tenantId || (includeLegacy && !record?.tenant_id));
}

export function withTenantId(data, tenantId) {
  if (!tenantId) return data;
  return { ...data, tenant_id: tenantId };
}
