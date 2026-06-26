import { useState, useEffect } from 'react';
import { ShoppingCart, FileUp, FileText, Image as ImageIcon, FileCode, CheckCircle2, Loader2, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/lib/pricing';

export default function Compras() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const list = await base44.entities.Invoice.list('-created_date', 50);
        setInvoices(list || []);
      } catch { setInvoices([]); }
      finally { setLoading(false); }
    };
    loadInvoices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const totalValue = invoices.reduce((s, inv) => s + (inv.total_value || 0), 0);
  const processed = invoices.filter(i => i.status === 'processed').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground">Compras</h1>
          <p className="text-sm text-muted-foreground">Importação de notas fiscais e histórico de compras</p>
        </div>
        <Link to="/importacao" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors">
          <FileUp className="w-4 h-4" /> Importar Nota Fiscal
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <p className="text-xs text-muted-foreground">Notas Importadas</p>
          <p className="text-lg font-bold text-foreground">{invoices.length}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-5 h-5 text-accent-dark" />
          </div>
          <p className="text-xs text-muted-foreground">Processadas</p>
          <p className="text-lg font-bold text-foreground">{processed}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center mb-2">
            <ShoppingCart className="w-5 h-5 text-accent-dark" />
          </div>
          <p className="text-xs text-muted-foreground">Valor Total</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nenhuma compra registrada"
          description="Importe sua primeira nota fiscal para registrar compras e atualizar o estoque automaticamente."
          action={<Link to="/importacao" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark transition-colors"><FileUp className="w-4 h-4" /> Importar Nota Fiscal</Link>}
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Histórico de Notas Fiscais</h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Arquivo</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Fornecedor</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Itens</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Valor</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {inv.file_type === 'xml' ? <FileCode className="w-4 h-4 text-blue-500" /> :
                         inv.file_type === 'pdf' ? <FileText className="w-4 h-4 text-red-500" /> :
                         <ImageIcon className="w-4 h-4 text-purple-500" />}
                        <span className="font-medium text-foreground truncate max-w-[200px]">{inv.file_name || 'Nota fiscal'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.supplier || '—'}</td>
                    <td className="px-4 py-3 text-center">{inv.extracted_count || 0}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(inv.total_value || 0)}</td>
                    <td className="px-4 py-3 text-center">
                      {inv.status === 'processed' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent-dark">Processada</span>
                      ) : inv.status === 'error' ? (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">Erro</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-600">Pendente</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}