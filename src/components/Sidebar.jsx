import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, FileUp, BarChart3, Bot, Tag, Megaphone, FileText,
  Settings, CreditCard, Users, Globe, Building2, DollarSign, Wallet, Layers,
  ScrollText, X, ShieldCheck, Boxes, ShoppingCart, TrendingUp, User
} from 'lucide-react';
import { usePharmacy } from '@/lib/pharmacyContext';
import { useSubscription, SUBSCRIPTION_STATUSES } from '@/lib/subscriptionContext';
import { useUserRole, getNavForRole } from '@/lib/roles';
import { cn } from '@/lib/utils';

const ICONS = {
  LayoutDashboard, Package, FileUp, BarChart3, Bot, Tag, Megaphone, FileText,
  Settings, CreditCard, Users, Globe, Building2, DollarSign, Wallet, Layers, ScrollText,
  Boxes, ShoppingCart, TrendingUp, User,
};

export default function Sidebar({ isOpen, onClose }) {
  const { settings } = usePharmacy();
  const { subscription } = useSubscription();
  const { appRole, isSuperAdmin } = useUserRole();

  const navItems = getNavForRole(appRole);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-72 flex flex-col transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isSuperAdmin
          ? "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white"
          : "bg-primary text-primary-foreground"
      )}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              isSuperAdmin ? "bg-purple-500" : "bg-accent"
            )}>
              {isSuperAdmin ? <ShieldCheck className="w-6 h-6 text-white" /> : <Bot className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">FarmaLucro</h1>
              <p className="text-xs text-white/60">{isSuperAdmin ? 'Painel do Desenvolvedor' : 'AI Pricing'}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isSuperAdmin && settings && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{settings.name}</p>
                <p className="text-xs text-white/50 truncate">{settings.city || 'Defina sua cidade'}</p>
              </div>
            </div>
          </div>
        )}

        {isSuperAdmin && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-4 h-4 text-purple-300" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">Super Administrador</p>
                <p className="text-xs text-white/50 truncate">Acesso total à plataforma</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/' || item.path === '/admin'}
                onClick={onClose}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-accent text-white shadow-lg shadow-accent/20"
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {Icon && <Icon className="w-[18px] h-[18px] flex-shrink-0" />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {!isSuperAdmin && (
          <div className="px-4 py-4 border-t border-white/10">
            <NavLink to="/assinatura" onClick={onClose} className="block px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-white/80">Assinatura</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                  SUBSCRIPTION_STATUSES[subscription?.status]?.badge || 'bg-gray-500 text-white'
                )}>
                  {SUBSCRIPTION_STATUSES[subscription?.status]?.label || '—'}
                </span>
              </div>
              <p className="text-[11px] text-white/50">{subscription?.plan_name || 'FarmaLucro AI'}</p>
            </NavLink>
          </div>
        )}
      </aside>
    </>
  );
}