import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { classifyABC, calculateProductMetrics, isExpiringSoon } from '@/lib/pricing';
import { usePharmacy } from '@/lib/pharmacyContext';
import { useUserRole } from '@/lib/roles';
import { filterByTenant } from '@/lib/tenant';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { settings } = usePharmacy();
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();

  const loadProducts = useCallback(async () => {
    try {
      if (roleLoading) return;
      setLoading(true);
      const list = await base44.entities.Product.list('-created_date', 500);
      const tenantProducts = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
      const classified = classifyABC(tenantProducts);
      const enriched = classified.map(p => {
        const metrics = calculateProductMetrics(p, settings);
        const enriched = {
          ...p,
          price_aggressive: p.price_aggressive || metrics.aggressive,
          price_balanced: p.price_balanced || metrics.balanced,
          price_premium: p.price_premium || metrics.premium,
          selected_price: p.selected_price || metrics.balanced,
          unit_profit: metrics.unit_profit,
          margin_pct: metrics.margin_pct,
          roi: metrics.roi,
          high_margin: (metrics.margin_pct || 0) >= 35,
          risk_of_obsolescence: p.risk_of_obsolescence || (p.monthly_sales || 0) < 5,
        };
        return enriched;
      });
      setProducts(enriched);
    } catch (e) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [settings, tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return { products, loading, reloadProducts: loadProducts, settings, tenantId };
}
