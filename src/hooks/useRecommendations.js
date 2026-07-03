import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import { filterByTenant } from '@/lib/tenant';
import { summarizeRecommendationCycle } from '@/lib/recommendationMetrics';

export function useRecommendations() {
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();
  const [recommendations, setRecommendations] = useState([]);
  const [actionResults, setActionResults] = useState([]);
  const [priceChangeLogs, setPriceChangeLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRecommendations = useCallback(async () => {
    if (roleLoading) return;

    try {
      setLoading(true);
      if (!isSuperAdmin && !tenantId) {
        setRecommendations([]);
        return;
      }

      const [list, results, priceLogs] = await Promise.all([
        isSuperAdmin
          ? base44.entities.Recommendation.list('-created_date', 500)
          : base44.entities.Recommendation.filter({ tenant_id: tenantId }, '-created_date', 500),
        isSuperAdmin
          ? base44.entities.ActionResult.list('-created_date', 500).catch(() => [])
          : base44.entities.ActionResult.filter({ tenant_id: tenantId }, '-created_date', 500).catch(() => []),
        isSuperAdmin
          ? base44.entities.PriceChangeLog.list('-created_date', 500).catch(() => [])
          : base44.entities.PriceChangeLog.filter({ tenant_id: tenantId }, '-created_date', 500).catch(() => []),
      ]);

      setRecommendations(isSuperAdmin ? (list || []) : filterByTenant(list, tenantId));
      setActionResults(isSuperAdmin ? (results || []) : filterByTenant(results, tenantId));
      setPriceChangeLogs(isSuperAdmin ? (priceLogs || []) : filterByTenant(priceLogs, tenantId));
    } catch {
      setRecommendations([]);
      setActionResults([]);
      setPriceChangeLogs([]);
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

  const applyRecommendation = useCallback(async (recommendation, realizedMonthlyGain = 0, notes = '') => {
    if (!recommendation?.id) return;
    if (!isSuperAdmin && recommendation.tenant_id !== tenantId) {
      throw new Error('Recomendacao fora do tenant atual.');
    }

    const effectiveTenantId = recommendation.tenant_id || tenantId;
    await base44.entities.Recommendation.update(recommendation.id, { status: 'applied' });

    const existingResults = await base44.entities.ActionResult
      .filter({ recommendation_id: recommendation.id, tenant_id: effectiveTenantId }, '-created_date', 10)
      .catch(() => []);

    if (!existingResults?.length) {
      await base44.entities.ActionResult.create({
        tenant_id: effectiveTenantId,
        recommendation_id: recommendation.id,
        product_id: recommendation.product_id || '',
        action_type: recommendation.type,
        status: Number(realizedMonthlyGain || 0) > 0 ? 'measured' : 'applied',
        estimated_monthly_gain: Number(recommendation.estimated_monthly_gain || 0),
        realized_monthly_gain: Number(realizedMonthlyGain || 0),
        applied_date: new Date().toISOString().split('T')[0],
        measured_date: Number(realizedMonthlyGain || 0) > 0 ? new Date().toISOString().split('T')[0] : '',
        notes,
      });
    }

    const oldPrice = Number(recommendation.current_price || 0);
    const newPrice = Number(recommendation.suggested_price || 0);
    if (recommendation.product_id && oldPrice > 0 && newPrice > 0 && oldPrice !== newPrice) {
      await base44.entities.PriceChangeLog.create({
        tenant_id: effectiveTenantId,
        recommendation_id: recommendation.id,
        product_id: recommendation.product_id,
        product_name: recommendation.product_name || '',
        old_price: oldPrice,
        new_price: newPrice,
        old_margin: Number(recommendation.current_margin || 0),
        new_margin: Number(recommendation.projected_margin || 0),
        change_reason: recommendation.reason || recommendation.description || '',
        status: 'applied',
        changed_at: new Date().toISOString(),
      }).catch(() => {});
    }

    await loadRecommendations();
  }, [tenantId, isSuperAdmin, loadRecommendations]);

  const metrics = summarizeRecommendationCycle(recommendations, actionResults);

  return {
    recommendations,
    actionResults,
    priceChangeLogs,
    metrics,
    loading,
    reloadRecommendations: loadRecommendations,
    updateStatus,
    applyRecommendation,
    tenantId,
    isSuperAdmin,
  };
}
