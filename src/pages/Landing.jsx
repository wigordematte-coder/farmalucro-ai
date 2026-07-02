import { Link } from 'react-router-dom';
import {
  Sparkles, FileUp, TrendingUp, Bot, Shield, Zap, BarChart3, DollarSign,
  Check, ChevronDown, ArrowRight, Pill, Brain, Target, Clock
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [faqOpen, setFaqOpen] = useState(null);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl gradient-farma flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">FarmaLucro AI</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#beneficios" className="hover:text-foreground transition-colors">Benefícios</a>
            <a href="#como-funciona" className="hover:text-foreground transition-colors">Como Funciona</a>
            <a href="#planos" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-dark transition-colors">
                Ir para dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  Login
                </Link>
                <Link to="/register" className="px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent-dark transition-colors">
                  Teste Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-farma opacity-5" />
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-16 lg:py-24 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent-dark text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" /> IA dedicada para precificação farmacêutica
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
              Aumente o lucro da sua farmácia com <span className="text-accent-dark">precificação inteligente</span>
            </h1>
            <p className="text-base lg:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Importe sua nota fiscal e receba recomendações de preços, promoções e gestão de estoque com IA.
              Tudo justificado com dados reais do seu negócio.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent-dark transition-colors shadow-lg shadow-accent/20">
                <FileUp className="w-5 h-5" /> Teste Grátis por 14 Dias
              </Link>
              <a href="mailto:contato@farmalucro.com.br?subject=Agendar Demonstração" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors">
                <Clock className="w-4 h-4" /> Agendar Demonstração
              </a>
            </div>
            <p className="text-xs text-muted-foreground mt-3">14 dias grátis · Sem cartão de crédito · Cancele quando quiser</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-16 lg:py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Por que escolher o FarmaLucro AI?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Tudo o que você precisa para precificar com inteligência e maximizar margens</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Benefit icon={Brain} title="IA que justifica cada decisão" description="Nunca uma recomendação sem explicação. A IA mostra o porquê com base nos seus dados de giro, margem e estoque." />
            <Benefit icon={Target} title="Centro de Oportunidades" description="Em vez de números soltos, veja lucro potencial, estoque parado e promoções recomendadas em um só lugar." />
            <Benefit icon={Zap} title="Importação automática" description="Suba sua NF-e em XML, PDF ou foto. A IA extrai produtos e calcula preços automaticamente." />
            <Benefit icon={TrendingUp} title="Margens otimizadas" description="Defina suas metas de margem e a IA ajusta preços agressivo, equilibrado e premium para cada produto." />
            <Benefit icon={BarChart3} title="Relatórios acionáveis" description="Curva ABC, giro de estoque, vencimentos e rentabilidade — exportáveis em PDF e CSV." />
            <Benefit icon={Shield} title="Dados seguros" description="Seus dados ficam isolados e protegidos. Acesso restrito por papéis: admin, farmacêutico e operador." />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-16 lg:py-20 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Como funciona</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Em 3 passos você começa a lucrar mais</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step number="1" icon={FileUp} title="Importe sua nota fiscal" description="Suba o XML, PDF ou foto da NF-e. A IA extrai todos os produtos, custos e quantidades automaticamente." />
            <Step number="2" icon={Bot} title="A IA analisa e recomenda" description="Receba 3 preços sugeridos por produto, oportunidades de lucro e promoções — tudo justificado com dados." />
            <Step number="3" icon={DollarSign} title="Aplique e lucre mais" description="Escolha os preços, ative promoções e acompanhe o aumento de margem em tempo real." />
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="planos" className="py-16 lg:py-20 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Planos simples e transparentes</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Comece grátis por 14 dias. Sem cartão de crédito.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <PlanCard
              name="Teste Grátis"
              price="R$ 0"
              period="14 dias"
              description="Experimente todas as funcionalidades"
              features={["Importação de notas fiscais", "Centro de Oportunidades", "Consultor IA", "Precificação automática", "Relatórios completos"]}
              cta="Começar grátis"
              to="/register"
            />
            <PlanCard
              name="Profissional"
              price="R$ 197"
              period="/mês"
              description="Para farmácias que querem maximizar lucros"
              features={["Tudo do plano gratuito", "Produtos ilimitados", "Promoções automáticas", "Marketing com IA", "Suporte prioritário", "Relatórios exportáveis"]}
              cta="Assinar agora"
              to="/register"
              highlighted
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 lg:py-20 bg-muted/30 border-t border-border">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">Perguntas frequentes</h2>
            <p className="text-muted-foreground">Tire suas dúvidas antes de começar</p>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-foreground text-sm">{faq.q}</span>
                  <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform flex-shrink-0", faqOpen === i && "rotate-180")} />
                </button>
                {faqOpen === i && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 lg:py-20 border-t border-border">
        <div className="max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-primary to-primary-light rounded-3xl p-8 lg:p-12 text-primary-foreground">
            <Clock className="w-10 h-10 mx-auto mb-4 opacity-80" />
            <h2 className="text-2xl lg:text-3xl font-bold mb-3">Comece seu teste grátis hoje</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
              14 dias de acesso total. Importe sua primeira nota fiscal e descubra quanto lucro você está deixando na mesa.
            </p>
            <Link to="/register" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-primary font-semibold text-sm hover:bg-white/90 transition-colors">
              <FileUp className="w-5 h-5" /> Teste Grátis por 14 Dias
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-farma flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-foreground">FarmaLucro AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 FarmaLucro AI. Precificação inteligente para farmácias.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Login</Link>
            <Link to="/register" className="hover:text-foreground">Cadastro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Benefit({ icon: Icon, title, description }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-accent-dark" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({ number, icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl gradient-farma flex items-center justify-center">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-sm font-bold flex items-center justify-center">
          {number}
        </span>
      </div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{description}</p>
    </div>
  );
}

function PlanCard({ name, price, period, description, features, cta, to, highlighted }) {
  return (
    <div className={cn(
      "rounded-2xl p-6 border-2 relative",
      highlighted ? "border-accent bg-card shadow-lg" : "border-border bg-card"
    )}>
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold">
          Mais popular
        </span>
      )}
      <h3 className="font-bold text-foreground text-lg">{name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-3xl font-bold text-foreground">{price}</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="w-4 h-4 text-accent flex-shrink-0" /> {f}
          </li>
        ))}
      </ul>
      <Link to={to} className={cn(
        "block text-center px-4 py-3 rounded-xl font-semibold text-sm transition-colors",
        highlighted ? "bg-accent text-accent-foreground hover:bg-accent-dark" : "bg-primary text-primary-foreground hover:bg-primary-light"
      )}>
        {cta}
      </Link>
    </div>
  );
}

const FAQS = [
  { q: "Preciso de cartão de crédito para o teste?", a: "Não. O teste de 14 dias é 100% gratuito e não pede cartão. Você só decide assinar se gostar da plataforma." },
  { q: "Como funciona a importação de notas fiscais?", a: "Você sobe o arquivo XML da NF-e, um PDF ou até uma foto. A IA extrai automaticamente todos os produtos, custos e quantidades." },
  { q: "A IA realmente justifica suas recomendações?", a: "Sim. Toda recomendação vem com a justificativa baseada nos seus dados: giro de estoque, margem atual, meta definida e histórico de vendas." },
  { q: "Meus dados estão seguros?", a: "Sim. Cada farmácia tem seu ambiente isolado. O acesso é controlado por papéis: administrador, farmacêutico e operador." },
  { q: "Posso cancelar quando quiser?", a: "Sim. Não há fidelidade. Você pode cancelar a assinatura a qualquer momento diretamente nas configurações." },
  { q: "O que acontece quando o teste acaba?", a: "Após 14 dias, o acesso é restrito até a contratação do plano. Seus dados ficam preservados para quando você assinar." },
];