import { useState } from 'react';
import { Building2, User, Mail, Phone, MessageCircle, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BillingInfoForm({ subscription, onSave }) {
  const [form, setForm] = useState({
    billing_company_name: subscription?.billing_company_name || '',
    billing_cnpj: subscription?.billing_cnpj || '',
    billing_responsible_name: subscription?.billing_responsible_name || '',
    billing_email: subscription?.billing_email || '',
    billing_phone: subscription?.billing_phone || '',
    billing_whatsapp: subscription?.billing_whatsapp || '',
    allow_whatsapp_notifications: subscription?.allow_whatsapp_notifications || false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Dados para Faturamento</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome da Empresa</label>
          <input value={form.billing_company_name} onChange={e => setForm({ ...form, billing_company_name: e.target.value })}
            placeholder="FarmaLucro Ltda." className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">CNPJ</label>
          <input value={form.billing_cnpj} onChange={e => setForm({ ...form, billing_cnpj: e.target.value })}
            placeholder="00.000.000/0000-00" className="mt-1 w-full px-3 py-2 rounded-lg border border-border text-sm bg-background" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Responsável</label>
          <div className="relative mt-1">
            <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.billing_responsible_name} onChange={e => setForm({ ...form, billing_responsible_name: e.target.value })}
              placeholder="João Silva" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <div className="relative mt-1">
            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.billing_email} onChange={e => setForm({ ...form, billing_email: e.target.value })}
              placeholder="contato@farmacia.com" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Telefone</label>
          <div className="relative mt-1">
            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.billing_phone} onChange={e => setForm({ ...form, billing_phone: e.target.value })}
              placeholder="(11) 9999-9999" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
          <div className="relative mt-1">
            <MessageCircle className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={form.billing_whatsapp} onChange={e => setForm({ ...form, billing_whatsapp: e.target.value })}
              placeholder="(11) 99999-9999" className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm bg-background" />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={form.allow_whatsapp_notifications}
          onChange={e => setForm({ ...form, allow_whatsapp_notifications: e.target.checked })}
          className="w-4 h-4 rounded border-border" />
        <span className="text-sm text-foreground">Receber lembretes de pagamento por WhatsApp</span>
      </label>

      <button onClick={handleSave} disabled={saving}
        className={cn("inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors",
          saved ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary-light",
          saving && "opacity-70")}>
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Dados'}
      </button>
    </div>
  );
}