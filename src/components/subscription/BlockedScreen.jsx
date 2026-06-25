import { Link } from 'react-router-dom';
import { Lock, CreditCard, ShieldCheck } from 'lucide-react';

export default function BlockedScreen() {
  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Assinatura bloqueada</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sua assinatura está em atraso há mais de 3 dias. Regularize o pagamento para restaurar o acesso a todas as funcionalidades do FarmaLucro AI.
        </p>

        <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" />
            Importação de notas fiscais bloqueada
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" />
            Consultor FarmaLucro AI bloqueado
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="w-4 h-4 flex-shrink-0" />
            Geração de relatórios bloqueada
          </div>
          <div className="flex items-center gap-2 text-sm text-accent-dark">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            Seus dados estão seguros e preservados
          </div>
        </div>

        <Link to="/assinatura" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:bg-accent-dark w-full justify-center">
          <CreditCard className="w-4 h-4" />
          Regularizar Assinatura
        </Link>
      </div>
    </div>
  );
}