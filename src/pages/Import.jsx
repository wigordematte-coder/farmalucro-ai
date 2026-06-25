import { useState, useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, FileCode, CheckCircle2, Loader2, AlertCircle, Save, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/lib/pricing';
import { useProducts } from '@/hooks/useProducts';

export default function Import() {
  const { settings, reloadProducts } = useProducts();
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleFile = useCallback(async (file) => {
    setError('');
    setExtractedItems([]);
    setInvoice(null);
    setSaved(false);

    if (!file) return;

    const isXML = file.name.toLowerCase().endsWith('.xml');
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isXML && !isPDF && !isImage) {
      setError('Formato não suportado. Envie XML, PDF ou imagem da nota fiscal.');
      return;
    }

    try {
      setUploading(true);
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadRes.file_url;
      const fileType = isXML ? 'xml' : isPDF ? 'pdf' : 'image';

      const invoiceRecord = await base44.entities.Invoice.create({
        file_url: fileUrl,
        file_name: file.name,
        file_type: fileType,
        status: 'pending',
      });
      setInvoice(invoiceRecord);
      setUploading(false);

      setExtracting(true);
      let items = [];

      if (isXML) {
        items = await parseXmlNF(file);
      } else {
        items = await extractWithAI(fileUrl, fileType);
      }

      setExtractedItems(items);
      await base44.entities.Invoice.update(invoiceRecord.id, {
        status: 'processed',
        extracted_count: items.length,
      });
    } catch (e) {
      setError('Erro ao processar arquivo. Verifique o formato e tente novamente.');
    } finally {
      setUploading(false);
      setExtracting(false);
    }
  }, []);

  const handleSave = async () => {
    try {
      setSaved(true);
      const minMargin = settings?.min_margin || 15;
      const idealMargin = settings?.ideal_margin || 30;
      const maxMargin = settings?.max_margin || 50;

      const records = extractedItems.map(item => {
        const cost = Number(item.cost) || 0;
        const aggressive = cost / (1 - minMargin / 100);
        const balanced = cost / (1 - idealMargin / 100);
        const premium = cost / (1 - maxMargin / 100);
        const selectedPrice = balanced;
        const unitProfit = selectedPrice - cost;
        const marginPct = selectedPrice > 0 ? ((selectedPrice - cost) / selectedPrice) * 100 : 0;

        return {
          name: item.name,
          manufacturer: item.manufacturer || '',
          category: item.category || '',
          cost: cost,
          quantity: Number(item.quantity) || 0,
          price_aggressive: Math.round(aggressive * 100) / 100,
          price_balanced: Math.round(balanced * 100) / 100,
          price_premium: Math.round(premium * 100) / 100,
          selected_price: Math.round(selectedPrice * 100) / 100,
          unit_profit: Math.round(unitProfit * 100) / 100,
          margin_pct: Math.round(marginPct * 100) / 100,
          roi: cost > 0 ? Math.round((unitProfit / cost) * 100 * 100) / 100 : 0,
          invoice_id: invoice?.id || '',
          monthly_sales: 0,
          high_margin: marginPct >= 35,
          risk_of_obsolescence: true,
        };
      });

      if (records.length > 0) {
        await base44.entities.Product.bulkCreate(records);
        await base44.entities.Invoice.update(invoice.id, { status: 'processed', extracted_count: records.length });
        reloadProducts();
      }
    } catch (e) {
      setError('Erro ao salvar produtos. Tente novamente.');
      setSaved(false);
    }
  };

  const reset = () => {
    setExtractedItems([]);
    setInvoice(null);
    setError('');
    setSaved(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Importação de Nota Fiscal</h1>
        <p className="text-sm text-muted-foreground">Envie XML da NF-e, PDF ou foto da nota. A IA extrai produtos automaticamente.</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {!extractedItems.length && !saved && (
        <UploadZone onFile={handleFile} uploading={uploading} extracting={extracting} />
      )}

      {extractedItems.length > 0 && !saved && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">{extractedItems.length} itens extraídos</span>
            </div>
            <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground">Nova importação</button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Fabricante</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-center">Qtd</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Custo</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Preço Sugerido</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedItems.map((item, i) => {
                    const cost = Number(item.cost) || 0;
                    const suggestedPrice = cost / (1 - (settings?.ideal_margin || 30) / 100);
                    return (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-3 font-medium">{item.name || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.manufacturer || '—'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.category || '—'}</td>
                        <td className="px-4 py-3 text-center">{item.quantity || 1}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(cost)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-accent-dark">{formatCurrency(suggestedPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent-dark transition-colors"
          >
            <Save className="w-4 h-4" /> Salvar {extractedItems.length} Produtos
          </button>
        </div>
      )}

      {saved && (
        <EmptyState
          icon={CheckCircle2}
          title="Produtos salvos com sucesso!"
          description={`${extractedItems.length} produtos foram cadastrados com precificação automática. Você pode ajustá-los na página de Produtos.`}
          action={<Link to="/produtos" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark"><Package className="w-4 h-4" /> Ver Produtos</Link>}
        />
      )}
    </div>
  );
}

function UploadZone({ onFile, uploading, extracting }) {
  return (
    <div>
      <label className="block">
        <div className="border-2 border-dashed border-border rounded-2xl p-8 lg:p-12 text-center cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
          {uploading || extracting ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-accent animate-spin" />
              <p className="font-medium text-foreground">{uploading ? 'Enviando arquivo...' : 'Extraindo dados com IA...'}</p>
              <p className="text-xs text-muted-foreground">{extracting && 'Isso pode levar alguns segundos'}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-3 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center"><FileCode className="w-7 h-7 text-blue-500" /></div>
                <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center"><FileText className="w-7 h-7 text-red-500" /></div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center"><ImageIcon className="w-7 h-7 text-purple-500" /></div>
              </div>
              <p className="font-semibold text-foreground mb-1">Arraste ou clique para enviar</p>
              <p className="text-sm text-muted-foreground">XML da NF-e, PDF ou foto da nota fiscal</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium text-sm">
                <Upload className="w-4 h-4" /> Selecionar Arquivo
              </div>
            </>
          )}
        </div>
        <input
          type="file"
          accept=".xml,.pdf,image/*"
          className="hidden"
          onChange={e => e.target.files[0] && onFile(e.target.files[0])}
          disabled={uploading || extracting}
        />
      </label>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InfoCard icon={FileCode} title="XML da NF-e" desc="Extração 100% automática dos dados oficiais" color="blue" />
        <InfoCard icon={FileText} title="PDF da Nota" desc="OCR extrai produtos do PDF da nota fiscal" color="red" />
        <InfoCard icon={ImageIcon} title="Foto da Nota" desc="Tire foto da nota e a IA lê os produtos" color="purple" />
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, title, desc, color }) {
  const colors = { blue: 'bg-blue-50 text-blue-500', red: 'bg-red-50 text-red-500', purple: 'bg-purple-50 text-purple-500' };
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="font-semibold text-sm text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

async function parseXmlNF(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');
  const items = [];

  const products = doc.querySelectorAll('prod');
  products.forEach(prod => {
    const name = prod.querySelector('xProd')?.textContent || '';
    const quantity = parseFloat(prod.querySelector('qCom')?.textContent || '1');
    const cost = parseFloat(prod.querySelector('vUnCom')?.textContent || '0');
    const manufacturer = '';
    items.push({ name, quantity, cost, manufacturer, category: '' });
  });

  if (items.length === 0) {
    throw new Error('XML não contém produtos');
  }
  return items;
}

async function extractWithAI(fileUrl, fileType) {
  const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
    file_url: fileUrl,
    json_schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              manufacturer: { type: 'string' },
              category: { type: 'string' },
              quantity: { type: 'number' },
              cost: { type: 'number' },
            }
          }
        }
      }
    }
  });

  if (result?.status === 'success' && result?.output?.items) {
    return result.output.items;
  }
  throw new Error('Não foi possível extrair dados da nota fiscal');
}