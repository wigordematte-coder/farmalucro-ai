import { Link } from 'react-router-dom';
import { Clock, CreditCard, ShieldCheck, Lock, TrendingUp } from 'lucide-react';
import { useSubscription } from '@/lib/subscriptionContext';

export default function AwaitingSubscription() {
  const { subscription } = useSubscription();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-5">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Período de teste finalizado</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Seu período de teste gratuito chegou ao fim. Contrate um plano para continuar utilizando todas as funcionalidades do FarmaLucro AI.
        </p>

        <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left space-y-2">
          <p className="text-xs font-medium text-foreground mb-2">Funcionalidades bloqueadas:</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" /> Importação de notas fiscais
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" /> Consultor FarmaLucro AI
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" /> Relatórios e análises
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" /> Precificação e promoções
          </div>
          <div className="flex items-center gap-2 text-sm text-accent-dark pt-1 border-t border-border mt-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" /> Seus dados estão seguros e preservados
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary to-primary-light rounded-2xl p-5 mb-6 text-primary-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">Plano Profissional</span>
          </div>
          <p className="text-3xl font-bold mb-1">R$ 197<span className="text-sm font-normal">/mês</span></p>
          <p className="text-xs text-primary-foreground/80">Todas as funcionalidades desbloqueadas</p>
        </div>

        <Link to="/assinatura" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark w-full justify-center">
          <CreditCard className="w-4 h-4" />
          Contratar Assinatura
        </Link>
        <p className="text-xs text-muted-foreground mt-3">
          Cancele quando quiser. Sem fidelidade.
        </p>
      </div>
    </div>
  );
}