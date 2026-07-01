import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Package, FileUp, BarChart3, Bot, Tag, Megaphone, FileText,
  Settings, CreditCard, Users, Globe, Building2, DollarSign, Wallet, Layers, ScrollText,
  Boxes, ShoppingCart, TrendingUp, User, Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUserRole, getNavForRole } from '@/lib/roles';

const ICONS = {
  LayoutDashboard, Package, FileUp, BarChart3, Bot, Tag, Megaphone, FileText,
  Settings, CreditCard, Users, Globe, Building2, DollarSign, Wallet, Layers, ScrollText,
  Boxes, ShoppingCart, TrendingUp, User, Trophy,
};

export default function MobileNav() {
  const { appRole } = useUserRole();
  const allItems = getNavForRole(appRole);
  const items = allItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-border lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/' || item.path === '/admin'}
              className={({ isActive }) => cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-0",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
            >
              {Icon && <Icon className="w-[22px] h-[22px]" />}
              <span className="text-[10px] font-medium truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}