import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { LayoutDashboard, ArrowLeftRight, Tag, Users, LogOut, TrendingUp, TrendingDown, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isTransactions = pathname.startsWith('/transactions');
  const navLinkClass = (to: string) =>
    cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent', pathname === to && 'bg-accent font-medium');

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-56 border-r flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-bold text-lg">FinApp</h1>
          <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <Link to="/" className={navLinkClass('/')}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>

          <Accordion type="single" collapsible defaultValue={isTransactions ? 'transactions' : undefined}>
            <AccordionItem value="transactions" className="border-0">
              <AccordionTrigger
                className={cn(
                  'rounded-md px-3 py-2 text-sm hover:bg-accent hover:no-underline',
                  isTransactions && 'bg-accent font-medium',
                )}
              >
                <span className="flex items-center gap-3">
                  <ArrowLeftRight className="h-4 w-4" /> Entradas e Saídas
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-0 pt-1">
                <div className="ml-4 space-y-1 border-l pl-3">
                  <Link to="/transactions/income" className={cn(navLinkClass('/transactions/income'), 'text-xs py-1.5')}>
                    <TrendingUp className="h-3.5 w-3.5 text-green-600" /> Entradas
                  </Link>
                  <Link to="/transactions/expense" className={cn(navLinkClass('/transactions/expense'), 'text-xs py-1.5')}>
                    <TrendingDown className="h-3.5 w-3.5 text-red-600" /> Saídas
                  </Link>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Link to="/categories" className={navLinkClass('/categories')}>
            <Tag className="h-4 w-4" /> Categorias
          </Link>
          <Link to="/members" className={navLinkClass('/members')}>
            <Users className="h-4 w-4" /> Membros
          </Link>
          <Link to="/consolidation" className={navLinkClass('/consolidation')}>
            <CalendarRange className="h-4 w-4" /> Consolidação Mensal
          </Link>
        </nav>
        <div className="p-3 border-t">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
