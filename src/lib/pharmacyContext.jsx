import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useUserRole } from '@/lib/roles';
import { filterByTenant, withTenantId } from '@/lib/tenant';

const PharmacyContext = createContext(null);

export function PharmacyProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const { tenantId, isSuperAdmin, loading: roleLoading } = useUserRole();

  const loadSettings = useCallback(async () => {
    try {
      if (roleLoading) return null;
      const list = await base44.entities.PharmacySettings.list();
      const tenantSettings = isSuperAdmin ? (list || []) : filterByTenant(list, tenantId);
      if (tenantSettings && tenantSettings.length > 0) {
        setSettings(tenantSettings[0]);
        return tenantSettings[0];
      } else {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        const created = await base44.entities.PharmacySettings.create(withTenantId({
          name: 'Minha Farmácia',
          city: '',
          min_margin: 15,
          ideal_margin: 30,
          max_margin: 50,
          objective: 'profit',
          subscription_status: 'trial',
          subscription_plan: 'Mensal Único',
          trial_end_date: trialEnd.toISOString().split('T')[0],
        }, tenantId));
        setSettings(created);
        return created;
      }
    } catch (e) {
      const fallback = {
        name: 'Minha Farmácia',
        city: '',
        min_margin: 15,
        ideal_margin: 30,
        max_margin: 50,
        objective: 'profit',
        subscription_status: 'trial',
        subscription_plan: 'Mensal Único',
      };
      setSettings(fallback);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, [tenantId, isSuperAdmin, roleLoading]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(async (data) => {
    try {
      if (settings?.id) {
        const updated = await base44.entities.PharmacySettings.update(settings.id, data);
        setSettings(updated);
        return updated;
      } else {
        const created = await base44.entities.PharmacySettings.create(withTenantId(data, tenantId));
        setSettings(created);
        return created;
      }
    } catch (e) {
      setSettings(prev => ({ ...prev, ...data }));
      return { ...settings, ...data };
    }
  }, [settings, tenantId]);

  return (
    <PharmacyContext.Provider value={{ settings, loading, updateSettings, reloadSettings: loadSettings }}>
      {children}
    </PharmacyContext.Provider>
  );
}

export function usePharmacy() {
  const ctx = useContext(PharmacyContext);
  if (!ctx) {
    return {
      settings: {
        name: 'Minha Farmácia',
        min_margin: 15,
        ideal_margin: 30,
        max_margin: 50,
        objective: 'profit',
      },
      loading: false,
      updateSettings: async () => {},
      reloadSettings: async () => {},
    };
  }
  return ctx;
}
