import { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Shield, Save, Loader2, CheckCircle2, Lock, Building2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useUserRole, APP_ROLES } from '@/lib/roles';
import { usePharmacy } from '@/lib/pharmacyContext';
import { cn } from '@/lib/utils';
import { logAudit } from '@/lib/audit';

export default function Perfil() {
  const { user, appRole } = useUserRole();
  const { settings } = usePharmacy();
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
  }, [user]);

  const roleCfg = APP_ROLES[appRole] || APP_ROLES.operator;

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.auth.updateMe({ full_name: fullName });
      await logAudit('settings_change', 'Atualizou o nome do perfil');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados pessoais</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-full gradient-accent flex items-center justify-center text-white font-bold text-2xl">
            {(fullName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div>
            <h2 className="font-semibold text-foreground text-lg">{fullName || 'Sem nome'}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || '—'}</p>
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1", roleCfg.color)}>
              <Shield className="w-3 h-3" /> {roleCfg.label}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Nome Completo</label>
            <div className="relative mt-1">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm bg-background" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">E-mail</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={user?.email || ''} readOnly
                className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm bg-muted/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">O e-mail não pode ser alterado.</p>
          </div>

          {settings?.name && (
            <div>
              <label className="text-sm font-medium text-foreground">Empresa</label>
              <div className="relative mt-1">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={settings.name} readOnly
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border text-sm bg-muted/50" />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground">Papel no Sistema</label>
            <div className="mt-1 p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium text-foreground">{roleCfg.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{roleCfg.description}</p>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className={cn("inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors",
              saved ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground hover:bg-primary-light",
              saving && "opacity-70")}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground">Segurança</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Para alterar sua senha, utilize a recuperação de senha pelo CNPJ.</p>
        <a href="/forgot-password" className="text-sm text-primary hover:underline">Redefinir senha</a>
      </div>
    </div>
  );
}