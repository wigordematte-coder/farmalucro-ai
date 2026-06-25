import { useState, useMemo } from 'react';
import { FileText, Download, TrendingUp, Package, AlertTriangle, Calendar, Tag, FileSpreadsheet, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { useProducts } from '@/hooks/useProducts';
import { usePharmacy } from '@/lib/pharmacyContext';
import { formatCurrency, formatPercent, isExpiringSoon, calculateInventoryValue } from '@/lib/pricing';
import { cn } from '@/lib/utils';

const REPORT_TYPES = [
  { key: 'most_profitable', label: 'Produtos Mais Lucrativos', icon: TrendingUp, desc: 'Maior margem de lucro', color: 'accent' },
  { key: 'most_sold', label: 'Produtos Mais Vendidos', icon: Package, desc: 'Maior volume de vendas', color: 'blue' },
  { key: 'low_turnover', label: 'Produtos com Baixo Giro', icon: AlertTriangle, desc: 'Risco de encalhe', color: 'red' },
  { key: 'expiring', label: 'Próximos da Validade', icon: Calendar, desc: 'Vencimento em 90 dias', color: 'amber' },
  { key: 'for_promotion', label: 'Sugestão para Promoção', icon: Tag, desc: 'Candidatos a desconto', color: 'purple' },
];

export default function Reports() {
  const { products, loading } = useProducts();
  const { settings } = usePharmacy();
  const [selectedReport, setSelectedReport] = useState('most_profitable');
  const [generating, setGenerating] = useState(false);

  const reportData = useMemo(() => {
    if (!products || products.length === 0) return [];

    switch (selectedReport) {
      case 'most_profitable':
        return [...products].sort((a, b) => (b.unit_profit || 0) - (a.unit_profit || 0)).slice(0, 20);
      case 'most_sold':
        return [...products].sort((a, b) => (b.monthly_sales || 0) - (a.monthly_sales || 0)).slice(0, 20);
      case 'low_turnover':
        return products.filter(p => p.abc_class === 'C' || p.risk_of_obsolescence).sort((a, b) => (a.monthly_sales || 0) - (b.monthly_sales || 0));
      case 'expiring':
        return products.filter(p => isExpiringSoon(p.expiration_date)).sort((a, b) => new Date(a.expiration_date) - new Date(b.expiration_date));
      case 'for_promotion':
        return products.filter(p => p.abc_class === 'C' || p.risk_of_obsolescence || (p.quantity > 0 && (p.monthly_sales || 0) < 3)).sort((a, b) => (b.cost * b.quantity) - (a.cost * a.quantity));
      default:
        return [];
    }
  }, [products, selectedReport]);

  const handleExportPDF = async () => {
    setGenerating(true);
    try {
      const reportConfig = REPORT_TYPES.find(r => r.key === selectedReport);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFillColor(15, 42, 84);
      doc.rect(0, 0, pageWidth, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('FarmaLucro AI', 14, 15);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(reportConfig.label, 14, 25);
      doc.setFontSize(9);
      doc.text(`${settings?.name || 'Farmácia'} · ${new Date().toLocaleDateString('pt-BR')}`, 14, 31);

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let y = 45;
      doc.text('Produto', 14, y);
      doc.text('Fabricante', 80, y);
      doc.text('Custo', 130, y);
      doc.text('Preço', 155, y);
      doc.text('Margem', 180, y);
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, pageWidth - 14, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      reportData.forEach((p, i) => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        if (i % 2 === 0) {
          doc.setFillColor(245, 248, 252);
          doc.rect(14, y - 4, pageWidth - 28, 6, 'F');
        }
        doc.text((p.name || '').substring(0, 35), 14, y);
        doc.text((p.manufacturer || '—').substring(0, 20), 80, y);
        doc.text(formatCurrency(p.cost), 130, y);
        doc.text(formatCurrency(p.selected_price), 155, y);
        doc.text(formatPercent(p.margin_pct), 180, y);
        y += 6;
      });

      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, pageWidth - 14, y);
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Total de produtos: ${reportData.length}`, 14, y);
      y += 5;
      doc.text(`Valor em estoque: ${formatCurrency(calculateInventoryValue(reportData))}`, 14, y);

      doc.save(`relatorio-${selectedReport}-${Date.now()}.pdf`);
    } catch (e) {
      alert('Erro ao gerar PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportExcel = () => {
    const headers = ['Produto', 'Fabricante', 'Categoria', 'Custo', 'Preço', 'Margem %', 'Lucro/Un', 'Quantidade', 'Vendas/Mês', 'Classe ABC', 'Validade'];
    const rows = reportData.map(p => [
      p.name || '', p.manufacturer || '', p.category || '',
      p.cost || 0, p.selected_price || 0, p.margin_pct || 0,
      p.unit_profit || 0, p.quantity || 0, p.monthly_sales || 0,
      p.abc_class || '', p.expiration_date || ''
    ]);

    const csv = [headers, ...rows].map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-${selectedReport}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const currentReport = REPORT_TYPES.find(r => r.key === selectedReport);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Gere e exporte relatórios em PDF e Excel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {REPORT_TYPES.map(report => {
          const Icon = report.icon;
          const colors = { accent: 'bg-accent/10 text-accent-dark', blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-600', purple: 'bg-purple-50 text-purple-600' };
          return (
            <button
              key={report.key}
              onClick={() => setSelectedReport(report.key)}
              className={cn(
                "text-left p-4 rounded-2xl border-2 transition-all",
                selectedReport === report.key ? "border-accent bg-accent/5 shadow-sm" : "border-border bg-card hover:border-muted"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colors[report.color])}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{report.label}</p>
                  <p className="text-xs text-muted-foreground">{report.desc}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-semibold text-foreground">{currentReport.label}</h2>
            <p className="text-xs text-muted-foreground">{reportData.length} produtos encontrados</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              disabled={generating || reportData.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-medium text-sm hover:bg-red-600 disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={reportData.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
          </div>
        </div>

        {reportData.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum produto encontrado para este relatório.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Categoria</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Custo</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right">Preço</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Margem</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Lucro/Un</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-center hidden lg:table-cell">Classe</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map((p, i) => (
                  <tr key={p.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{p.category || '—'}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.cost)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-accent-dark">{formatCurrency(p.selected_price)}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">{formatPercent(p.margin_pct)}</td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">{formatCurrency(p.unit_profit)}</td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className={cn("inline-block w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        p.abc_class === 'A' ? 'bg-accent' : p.abc_class === 'B' ? 'bg-amber-500' : 'bg-red-500'
                      )}>{p.abc_class || '?'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}