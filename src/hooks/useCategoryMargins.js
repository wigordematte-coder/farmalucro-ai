import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import { filterByTenant, withRequiredTenantId } from '@/lib/tenant';

const DEFAULT_CATEGORY_MARGINS = [
  { category: 'Medicamentos', margin_pct: 25 },
  { category: 'Vitaminas', margin_pct: 40 },
  { category: 'Dermocosméticos', margin_pct: 55 },
  { category: 'Infantil', margin_pct: 35 },
  { category: 'Higiene', margin_pct: 45 },
  { category: 'Suplementos', margin_pct: 50 },
];

export function useCategoryMargins() {
  const [margins, setMargins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();

  const load = useCallback(async () => {
    try {
      if (roleLoading) return;
      setLoading(true);
      const list = await base44.entities.CategoryMargin.list('-created_date', 100);
      const tenantMargins = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
      if (tenantMargins && tenantMargins.length > 0) {
        setMargins(tenantMargins);
      } else if (!tenantId) {
        setMargins([]);
      } else {
        const defaults = DEFAULT_CATEGORY_MARGINS.map(margin => withRequiredTenantId(margin, tenantId));
        const created = await base44.entities.CategoryMargin.bulkCreate(defaults);
        setMargins(created || DEFAULT_CATEGORY_MARGINS);
      }
    } catch (e) {
      setMargins(DEFAULT_CATEGORY_MARGINS);
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => { load(); }, [load]);

  const updateMargin = useCallback(async (id, margin_pct) => {
    try {
      await base44.entities.CategoryMargin.update(id, { margin_pct });
      setMargins(prev => prev.map(m => m.id === id ? { ...m, margin_pct } : m));
    } catch (e) {}
  }, []);

  const createMargin = useCallback(async (category, margin_pct) => {
    try {
      const created = await base44.entities.CategoryMargin.create(withRequiredTenantId({ category, margin_pct }, tenantId));
      setMargins(prev => [...prev, created]);
      return created;
    } catch (e) { throw e; }
  }, [tenantId]);

  const deleteMargin = useCallback(async (id) => {
    try {
      await base44.entities.CategoryMargin.delete(id);
      setMargins(prev => prev.filter(m => m.id !== id));
    } catch (e) {}
  }, []);

  return { margins, loading, reload: load, updateMargin, createMargin, deleteMargin };
}
