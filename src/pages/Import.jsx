import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, FileCode, CheckCircle2, Loader2, AlertCircle, Save, Package, Camera, RotateCcw, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import EmptyState from '@/components/EmptyState';
import { formatCurrency } from '@/lib/pricing';
import { useProducts } from '@/hooks/useProducts';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = '.xml,.pdf,.jpg,.jpeg,.png,.heic,image/*,application/pdf,text/xml,application/xml';
const ACCEPTED_EXTENSIONS = ['xml', 'pdf', 'jpg', 'jpeg', 'png', 'heic'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const STAGE_LABELS = {
  uploading: 'Enviando nota fiscal…',
  extracting: 'Analisando informações da nota…',
  generating: 'Gerando oportunidades de lucro…',
};

function getErrorMessage(err) {
  const msg = err?.message || '';
  if (msg.includes('format') || msg.includes('tipo de arquivo')) {
    return 'Este tipo de arquivo ainda não é aceito. Envie XML, PDF, JPG, PNG ou HEIC.';
  }
  if (msg.includes('size') || msg.includes('tamanho') || msg.includes('grande')) {
    return 'O arquivo é muito grande. Tente enviar uma imagem menor ou um PDF otimizado.';
  }
  if (msg.includes('network') || msg.includes('conexão') || msg.includes('fetch')) {
    return 'Não conseguimos enviar o arquivo. Verifique sua conexão e tente novamente.';
  }
  return 'Não conseguimos processar a nota fiscal. Tente novamente com outro arquivo.';
}

export default function Import() {
  const { settings, reloadProducts } = useProducts();
  const [stage, setStage] = useState(null); // null | 'uploading' | 'extracting' | 'generating'
  const [extractedItems, setExtractedItems] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const fileInputRefs = useRef({});

  const handleFile = useCallback(async (file) => {
    setError('');
    setExtractedItems([]);
    setInvoice(null);
    setSaved(false);

    if (!file) return;

    const ext = (file.name.split('.').pop() || '').toLowerCase();
    const isXML = ext === 'xml' || file.type === 'text/xml' || file.type === 'application/xml';
    const isPDF = ext === 'pdf' || file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'heic'].includes(ext);

    if (!isXML && !isPDF && !isImage) {
      setError('Este tipo de arquivo ainda não é aceito. Envie XML, PDF, JPG, PNG ou HEIC.');
      return;
    }

    if (file.size > MAX_SIZE) {
      setError('O arquivo é muito grande. Tente enviar uma imagem menor ou um PDF otimizado.');
      return;
    }

    try {
      setStage('uploading');
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
      setStage('extracting');

      let items = [];
      if (isXML) {
        items = await parseXmlNF(file);
      } else {
        items = await extractWithAI(fileUrl, fileType);
      }

      if (!items || items.length === 0) {
        throw new Error('Não foi possível extrair produtos da nota fiscal');
      }

      setStage('generating');
      await base44.entities.Invoice.update(invoiceRecord.id, {
        status: 'processed',
        extracted_count: items.length,
      });

      setExtractedItems(items);
      setStage(null);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setStage(null);
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
          last_purchase_date: new Date().toISOString().split('T')[0],
        };
      });

      if (records.length > 0) {
        await base44.entities.Product.bulkCreate(records);
        await base44.entities.Invoice.update(invoice.id, { status: 'processed', extracted_count: records.length });
        reloadProducts();
      }
    } catch {
      setError('Não conseguimos salvar os produtos. Verifique sua conexão e tente novamente.');
      setSaved(false);
    }
  };

  const reset = () => {
    setExtractedItems([]);
    setInvoice(null);
    setError('');
    setSaved(false);
    setStage(null);
  };

  const triggerInput = (key) => fileInputRefs.current[key]?.click();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-foreground">Importar Nota Fiscal</h1>
        <p className="text-sm text-muted-foreground">Envie a nota fiscal para a IA extrair produtos e gerar oportunidades de lucro.</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
            <button onClick={reset} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-700 hover:underline">
              <RotateCcw className="w-3 h-3" /> Tentar novamente
            </button>
          </div>
        </div>
      )}

      {stage && !error && (
        <div className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="w-12 h-12 text-accent animate-spin" />
          <div className="text-center">
            <p className="font-semibold text-foreground">{STAGE_LABELS[stage]}</p>
            <p className="text-xs text-muted-foreground mt-1">Isso pode levar alguns segundos</p>
          </div>
        </div>
      )}

      {!stage && !extractedItems.length && !saved && !error && (
        <UploadOptions onFile={handleFile} fileInputRefs={fileInputRefs} triggerInput={triggerInput} />
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
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Produto</th>
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
                        <td className="px-4 py-3 font-medium text-foreground max-w-[200px] truncate">{item.name || '—'}</td>
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20"
          >
            <Save className="w-5 h-5" /> Salvar {extractedItems.length} Produtos
          </button>
        </div>
      )}

      {saved && (
        <EmptyState
          icon={CheckCircle2}
          title="Nota importada com sucesso!"
          description={`${extractedItems.length} produtos foram cadastrados com precificação automática. A IA já está gerando oportunidades de lucro.`}
          action={
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark">
                <Sparkles className="w-4 h-4" /> Ver Oportunidades
              </Link>
              <Link to="/produtos" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-foreground font-medium text-sm hover:bg-muted">
                <Package className="w-4 h-4" /> Ver Produtos
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}

function UploadOptions({ onFile, fileInputRefs, triggerInput }) {
  const options = [
    {
      key: 'xml',
      icon: FileCode,
      title: 'Importar XML',
      desc: 'Melhor opção. Mais rápido e preciso.',
      color: 'blue',
      accept: '.xml,text/xml,application/xml',
    },
    {
      key: 'pdf',
      icon: FileText,
      title: 'Enviar PDF da nota',
      desc: 'Use quando tiver a nota em PDF.',
      color: 'red',
      accept: '.pdf,application/pdf',
    },
    {
      key: 'photo',
      icon: Camera,
      title: 'Tirar ou enviar foto',
      desc: 'Use a câmera do celular ou selecione uma imagem da galeria.',
      color: 'purple',
      accept: 'image/*,.jpg,.jpeg,.png,.heic,capture=camera',
    },
  ];

  const colors = {
    blue: 'bg-blue-50 text-blue-500 hover:border-blue-300',
    red: 'bg-red-50 text-red-500 hover:border-red-300',
    purple: 'bg-purple-50 text-purple-500 hover:border-purple-300',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {options.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              onClick={() => triggerInput(opt.key)}
              className={cn(
                "flex items-center gap-4 p-4 rounded-2xl border-2 border-border bg-card text-left transition-all active:scale-[0.99] hover:shadow-md",
                colors[opt.color]
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", colors[opt.color])}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{opt.title}</p>
                <p className="text-xs text-muted-foreground">{opt.desc}</p>
              </div>
              <Upload className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <input
                ref={el => { fileInputRefs.current[opt.key] = el; }}
                type="file"
                accept={opt.accept}
                className="hidden"
                onChange={e => e.target.files[0] && onFile(e.target.files[0])}
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2 pt-2">
        {ACCEPTED_EXTENSIONS.map(ext => (
          <span key={ext} className="px-2.5 py-1 rounded-full bg-muted text-xs text-muted-foreground font-medium uppercase">
            {ext}
          </span>
        ))}
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
    items.push({ name, quantity, cost, manufacturer: '', category: '' });
  });

  if (items.length === 0) {
    throw new Error('Não foi possível extrair produtos da nota fiscal');
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
  throw new Error('Não foi possível extrair produtos da nota fiscal');
}