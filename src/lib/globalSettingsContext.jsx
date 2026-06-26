import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const GlobalSettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  system_name: 'FarmaLucro AI',
  trial_duration_days: 14,
  default_plan_price: 197,
  default_plan_name: 'FarmaLucro AI Profissional',
  registration_enabled: true,
};

export function GlobalSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const list = await base44.entities.GlobalSettings.list();
      if (list && list.length > 0) {
        setSettings({ ...DEFAULT_SETTINGS, ...list[0] });
        return list[0];
      } else {
        const created = await base44.entities.GlobalSettings.create(DEFAULT_SETTINGS);
        setSettings({ ...DEFAULT_SETTINGS, ...created });
        return created;
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
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
        const updated = await base44.entities.GlobalSettings.update(settings.id, data);
        setSettings({ ...DEFAULT_SETTINGS, ...updated });
        return updated;
      } else {
        const created = await base44.entities.GlobalSettings.create(data);
        setSettings({ ...DEFAULT_SETTINGS, ...created });
        return created;
      }
    } catch {
      return null;
    }
  }, [settings]);

  return (
    <GlobalSettingsContext.Provider value={{ settings, loading, updateSettings, reloadSettings: loadSettings }}>
      {children}
    </GlobalSettingsContext.Provider>
  );
}

export function useGlobalSettings() {
  const ctx = useContext(GlobalSettingsContext);
  if (!ctx) {
    return { settings: DEFAULT_SETTINGS, loading: false, updateSettings: async () => {}, reloadSettings: async () => {} };
  }
  return ctx;
}