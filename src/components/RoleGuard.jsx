import { Lock, Loader2 } from 'lucide-react';
import { useUserRole, APP_ROLES } from '@/lib/roles';

export default function RoleGuard({ allowedRoles, children }) {
  const { appRole, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!allowedRoles.includes(appRole)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <Lock className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Acesso negado</h2>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Seu perfil ({APP_ROLES[appRole]?.label || appRole}) não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }

  return children;
}