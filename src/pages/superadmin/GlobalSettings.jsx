import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Loader2, CheckCircle2, Building2, Clock, DollarSign, Globe } from 'lucide-react';
import { useGlobalSettings } from '@/lib/globalSettingsContext';
import { logAudit } from '@/lib/audit';
import { cn } from '@/lib/utils';

export default function GlobalSettings() {
  const { settings, updateSettings } = useGlobalSettings();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        system_name: settings.system_name || 'FarmaLucro AI',
        logo_url: settings.logo_url || '',
        trial_duration_days: settings.trial_duration_days || 14,
        default_plan_price: settings.default_plan_price || 197,
        default_plan_name: settings.default_plan_name || 'FarmaLucro AI Profissional',
        support_email: settings.support_email || '',
        login_welcome_text: settings.login_welcome_text || '',
        registration_enabled: settings.registration_enabled ?? true,
        primary_color: settings.primary_color || '',
        terms_url: settings.terms_url || '',
        privacy_url: settings.privacy_url || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings({
        ...form,
        trial_duration_days: Number(form.trial_duration_days),
        default_plan_price: Number(form.default_plan_price),
      });
      await logAudit('super_admin_action', 'Atualizou configurações globais da plataforma');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-primary" /> Configurações Globais
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Parâmetros gerais da plataforma SaaS</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Identidade do Sistema</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do Sistema" value={form.system_name} onChange={v => setForm({ ...form, system_name: v })} />
          <Field label="Logo (URL)" value={form.logo_url} onChange={v => setForm({ ...form, logo_url: v })} />
          <Field label="E-mail de Suporte" value={form.support_email} onChange={v => setForm({ ...form, support_email: v })} />
          <Field label="Cor Primária (hex)" value={form.primary_color} onChange={v => setForm({ ...form, primary_color: v })} placeholder="#1e3a5f" />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">Texto de Boas-vindas do Login</label>
          <textarea value={form.login_welcome_text} onChange={e => setForm({ ...form, login_welcome_text: e.target.value })}
            rows={2} className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background"
            placeholder="Aparece na tela de login (opcional)" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-accent-dark" />
          <h2 className="font-semibold text-foreground">Período de Teste</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground">Duração do Teste (dias)</label>
            <input type="number" value={form.trial_duration_days}
              onChange={e => setForm({ ...form, trial_duration_days: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="reg_enabled" checked={form.registration_enabled}
              onChange={e => setForm({ ...form, registration_enabled: e.target.checked })}
              className="w-4 h-4 rounded" />
            <label htmlFor="reg_enabled" className="text-sm font-medium text-foreground">Cadastros abertos ao público</label>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-accent-dark" />
          <h2 className="font-semibold text-foreground">Plano Padrão</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nome do Plano Padrão" value={form.default_plan_name} onChange={v => setForm({ ...form, default_plan_name: v })} />
          <div>
            <label className="text-sm font-medium text-foreground">Preço Padrão (R$)</label>
            <input type="number" step="0.01" value={form.default_plan_price}
              onChange={e => setForm({ ...form, default_plan_price: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-foreground">Links Legais</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="URL dos Termos de Uso" value={form.terms_url} onChange={v => setForm({ ...form, terms_url: v })} placeholder="https://..." />
          <Field label="URL da Política de Privacidade" value={form.privacy_url} onChange={v => setForm({ ...form, privacy_url: v })} placeholder="https://..." />
        </div>
      </div>

      <div className="flex items-center gap-3 sticky bottom-20 lg:bottom-4">
        <button onClick={handleSave} disabled={saving}
          className={cn("inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-colors",
            saved ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary-light",
            saving && "opacity-70")}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
    </div>
  );
}