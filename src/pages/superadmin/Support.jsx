import { useState, useEffect } from 'react';
import { LifeBuoy, MessageSquare, Mail, Clock, Loader2, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Support() {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const list = await base44.entities.Tenant.list('-created_date', 500);
        setTenants(list || []);
      } catch { setTenants([]); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = tenants.filter(t =>
    !search ||
    (t.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.responsible_email || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.cnpj || '').includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-purple-600" /> Suporte
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Atendimento e gestão de tickets dos clientes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Canal principal</p>
            <p className="font-semibold text-foreground">suporte@farmalucro.ai</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-accent-dark" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tempo de resposta</p>
            <p className="font-semibold text-foreground">Até 24 horas</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Horário</p>
            <p className="font-semibold text-foreground">Seg–Sex, 9h–18h</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <h3 className="font-semibold text-foreground">Clientes</h3>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou CNPJ..."
            className="px-3 py-1.5 rounded-lg border border-border text-sm bg-background w-64"
          />
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Farmácia</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Responsável</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Contato</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.cnpj || 'Sem CNPJ'}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.responsible_name || '—'}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-foreground">{t.responsible_email || '—'}</p>
                    <p className="text-xs text-muted-foreground">{t.responsible_phone || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      t.subscription_status === 'active' ? 'bg-accent/10 text-accent-dark' :
                      t.subscription_status === 'trial' ? 'bg-blue-50 text-blue-600' :
                      t.subscription_status === 'blocked' ? 'bg-red-50 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {t.subscription_status || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {t.responsible_email && (
                      <a
                        href={`mailto:${t.responsible_email}?subject=Suporte FarmaLucro AI - ${t.name}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                      >
                        <Send className="w-3 h-3" /> Contatar
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</div>
        )}
      </div>
    </div>
  );
}