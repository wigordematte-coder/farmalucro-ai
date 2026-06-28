import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await base44.entities.CategoryMargin.list('-created_date', 100);
      if (list && list.length > 0) {
        setMargins(list);
      } else {
        const created = await base44.entities.CategoryMargin.bulkCreate(DEFAULT_CATEGORY_MARGINS);
        setMargins(created || DEFAULT_CATEGORY_MARGINS);
      }
    } catch (e) {
      setMargins(DEFAULT_CATEGORY_MARGINS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateMargin = useCallback(async (id, margin_pct) => {
    try {
      await base44.entities.CategoryMargin.update(id, { margin_pct });
      setMargins(prev => prev.map(m => m.id === id ? { ...m, margin_pct } : m));
    } catch (e) {}
  }, []);

  const createMargin = useCallback(async (category, margin_pct) => {
    try {
      const created = await base44.entities.CategoryMargin.create({ category, margin_pct });
      setMargins(prev => [...prev, created]);
      return created;
    } catch (e) { return null; }
  }, []);

  const deleteMargin = useCallback(async (id) => {
    try {
      await base44.entities.CategoryMargin.delete(id);
      setMargins(prev => prev.filter(m => m.id !== id));
    } catch (e) {}
  }, []);

  return { margins, loading, reload: load, updateMargin, createMargin, deleteMargin };
}