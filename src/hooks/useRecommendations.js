import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import { filterByTenant } from '@/lib/tenant';

export function useRecommendations() {
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = useCallback(async () => {
    if (roleLoading) return;

    try {
      setLoading(true);
      if (!isSuperAdmin && !tenantId) {
        setRecommendations([]);
        return;
      }

      const list = isSuperAdmin
        ? await base44.entities.Recommendation.list('-created_date', 500)
        : await base44.entities.Recommendation.filter({ tenant_id: tenantId }, '-created_date', 500);

      setRecommendations(isSuperAdmin ? (list || []) : filterByTenant(list, tenantId));
    } catch {
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const updateStatus = useCallback(async (recommendation, status) => {
    if (!recommendation?.id) return;
    if (!isSuperAdmin && recommendation.tenant_id !== tenantId) {
      throw new Error('Recomendacao fora do tenant atual.');
    }

    await base44.entities.Recommendation.update(recommendation.id, { status });
    await loadRecommendations();
  }, [tenantId, isSuperAdmin, loadRecommendations]);

  return { recommendations, loading, reloadRecommendations: loadRecommendations, updateStatus, tenantId, isSuperAdmin };
}
