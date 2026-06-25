import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Bot, Tag, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_ITEMS = [
  { label: 'Início', path: '/', icon: LayoutDashboard, end: true },
  { label: 'Produtos', path: '/produtos', icon: Package },
  { label: 'Consultor', path: '/consultor-ia', icon: Bot },
  { label: 'Promoções', path: '/promocoes', icon: Tag },
  { label: 'Config', path: '/configuracoes', icon: Settings },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 glass border-t border-border lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {MOBILE_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => cn(
              "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-colors min-w-0",
              isActive ? "text-accent" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-medium truncate">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}