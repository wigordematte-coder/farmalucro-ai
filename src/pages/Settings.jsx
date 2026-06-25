import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save, Building2, Percent, Target, CreditCard, Upload, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { usePharmacy } from '@/lib/pharmacyContext';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';

const OBJECTIVES = [
  { key: 'revenue', label: 'Faturamento', desc: 'Maximizar receita total', icon: 'TrendingUp' },
  { key: 'profit', label: 'Lucro', desc: 'Maximizar margem de lucro', icon: 'DollarSign' },
  { key: 'turnover', label: 'Giro de Estoque', desc: 'Acelerar rotação de produtos', icon: 'RefreshCw' },
];

export default function Settings() {
  const { settings, updateSettings } = usePharmacy();
  const [form, setForm] = useState({
    name: settings?.name || '',
    city: settings?.city || '',
    cnpj: settings?.cnpj || '',
    logo: settings?.logo || '',
    min_margin: settings?.min_margin || 15,
    ideal_margin: settings?.ideal_margin || 30,
    max_margin: settings?.max_margin || 50,
    objective: settings?.objective || 'profit',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        ...form,
        min_margin: Number(form.min_margin),
        ideal_margin: Number(form.ideal_margin),
        max_margin: Number(form.max_margin),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file) => {
    setUploadingLogo(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, logo: res.file_url }));
    } catch (e) {
      alert('Erro ao enviar logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize os parâmetros de precificação e dados da farmácia</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Dados da Farmácia</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border">
            {form.logo ? <img src={form.logo} alt="Logo" className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm cursor-pointer hover:bg-primary-light">
              {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingLogo ? 'Enviando...' : 'Enviar Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleLogoUpload(e.target.files[0])} disabled={uploadingLogo} />
            </label>
            <p className="text-xs text-muted-foreground mt-1">PNG ou JPG, até 2MB</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nome da Farmácia</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Cidade</label>
            <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">CNPJ</label>
            <input value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Percent className="w-5 h-5 text-accent-dark" />
          <h2 className="font-semibold text-foreground">Margens de Precificação</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MarginInput label="Margem Mínima" value={form.min_margin} onChange={v => setForm({ ...form, min_margin: v })} color="blue" desc="Preço agressivo" />
          <MarginInput label="Margem Ideal" value={form.ideal_margin} onChange={v => setForm({ ...form, ideal_margin: v })} color="accent" desc="Preço equilibrado" />
          <MarginInput label="Margem Máxima" value={form.max_margin} onChange={v => setForm({ ...form, max_margin: v })} color="purple" desc="Preço premium" />
        </div>

        <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <strong className="text-foreground">Como funciona:</strong> A margem mínima gera o preço agressivo (mais competitivo), a ideal gera o preço equilibrado (recomendado), e a máxima gera o preço premium (maior lucro).
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-purple-500" />
          <h2 className="font-semibold text-foreground">Objetivo Principal</h2>
        </div>
        <p className="text-sm text-muted-foreground">A IA usará este objetivo para priorizar recomendações.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {OBJECTIVES.map(obj => (
            <button
              key={obj.key}
              onClick={() => setForm({ ...form, objective: obj.key })}
              className={cn(
                "p-4 rounded-xl border-2 text-left transition-all",
                form.objective === obj.key ? "border-accent bg-accent/5" : "border-border hover:border-muted"
              )}
            >
              <p className="font-semibold text-sm text-foreground">{obj.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{obj.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Link to="/assinatura" className="block bg-card border border-border rounded-2xl p-5 hover:border-accent/30 transition-colors">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-foreground">Assinatura e Cobrança</h2>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div>
            <p className="font-medium text-sm text-foreground">Gerencie sua assinatura</p>
            <p className="text-xs text-muted-foreground">Plano, pagamentos, histórico e faturamento</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>
      </Link>

      <div className="flex items-center gap-3 sticky bottom-20 lg:bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-colors",
            saved ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary-light",
            saving && "opacity-70"
          )}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}

function MarginInput({ label, value, onChange, color, desc }) {
  const colors = {
    blue: 'focus:ring-blue-500/30 border-blue-200',
    accent: 'focus:ring-accent/30 border-accent/30',
    purple: 'focus:ring-purple-500/30 border-purple-200',
  };
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label} (%)</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        className={cn("mt-1 w-full px-3 py-2 rounded-lg border-2 text-sm bg-background focus:outline-none focus:ring-2", colors[color])}
      />
      <p className="text-xs text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}