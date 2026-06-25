import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const PharmacyContext = createContext(null);

export function PharmacyProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const list = await base44.entities.PharmacySettings.list();
      if (list && list.length > 0) {
        setSettings(list[0]);
        return list[0];
      } else {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        const created = await base44.entities.PharmacySettings.create({
          name: 'Minha Farmácia',
          city: '',
          min_margin: 15,
          ideal_margin: 30,
          max_margin: 50,
          objective: 'profit',
          subscription_status: 'trial',
          subscription_plan: 'Mensal Único',
          trial_end_date: trialEnd.toISOString().split('T')[0],
        });
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
  }, []);

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
        const created = await base44.entities.PharmacySettings.create(data);
        setSettings(created);
        return created;
      }
    } catch (e) {
      setSettings(prev => ({ ...prev, ...data }));
      return { ...settings, ...data };
    }
  }, [settings]);

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