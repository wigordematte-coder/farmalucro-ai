import { useState } from 'react';
import { Settings2, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CategoryMarginsConfig({ margins, onUpdate, onCreate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newMargin, setNewMargin] = useState(30);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newCategory.trim()) return;
    setCreating(true);
    try {
      await onCreate(newCategory.trim(), Number(newMargin));
      setNewCategory('');
      setNewMargin(30);
    } catch (e) {
      alert(e?.message || 'Erro ao criar margem por categoria');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground text-sm">Margens por Categoria</h3>
            <p className="text-xs text-muted-foreground">Configure a margem alvo para cada categoria de produtos</p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{expanded ? 'Recolher' : 'Expandir'}</span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
          {margins.map(m => (
            <CategoryMarginRow key={m.id} margin={m} onUpdate={onUpdate} onDelete={onDelete} />
          ))}

          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nova categoria" className="flex-1" />
            <Input type="number" value={newMargin} onChange={e => setNewMargin(e.target.value)} className="w-20" />
            <span className="text-sm text-muted-foreground">%</span>
            <Button size="icon" onClick={handleCreate} disabled={creating || !newCategory.trim()}>
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryMarginRow({ margin, onUpdate, onDelete }) {
  const [value, setValue] = useState(margin.margin_pct);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (value === margin.margin_pct) return;
    setSaving(true);
    await onUpdate(margin.id, Number(value));
    setSaving(false);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-sm text-foreground">{margin.category}</span>
      <Input type="number" value={value} onChange={e => setValue(e.target.value)} onBlur={handleSave}
        className="w-20 text-right" />
      <span className="text-sm text-muted-foreground w-4">%</span>
      {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
      <button onClick={() => onDelete(margin.id)} className="p-1 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
