import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LayoutDashboard, ArrowLeftRight, Tag, Users, LogOut, TrendingUp, TrendingDown, CalendarRange, Menu, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions/income': 'Entradas',
  '/transactions/expense': 'Saídas',
  '/categories': 'Categorias',
  '/members': 'Membros',
  '/consolidation': 'Consolidação Mensal',
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isTransactions = pathname.startsWith('/transactions');
  const navLinkClass = (to: string) =>
    cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent', pathname === to && 'bg-accent font-medium');

  const currentTitle =
    routeTitles[pathname] ||
    (pathname.startsWith('/transactions') ? 'Entradas e Saídas' :
      pathname.startsWith('/consolidation') ? 'Consolidação Mensal' :
      'FinApp');

  const initials = user?.name
    ? user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')
    : 'U';

  return (
    <div className="flex h-screen bg-background">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <div className="flex h-full flex-col border-r bg-background">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-4">
              <div>
                <h1 className="text-lg font-bold">FinApp</h1>
                <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
              <Link to="/" className={navLinkClass('/')} onClick={() => setMobileMenuOpen(false)}>
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
                      <Link to="/transactions/income" className={cn(navLinkClass('/transactions/income'), 'text-xs py-1.5')} onClick={() => setMobileMenuOpen(false)}>
                        <TrendingUp className="h-3.5 w-3.5 text-green-600" /> Entradas
                      </Link>
                      <Link to="/transactions/expense" className={cn(navLinkClass('/transactions/expense'), 'text-xs py-1.5')} onClick={() => setMobileMenuOpen(false)}>
                        <TrendingDown className="h-3.5 w-3.5 text-red-600" /> Saídas
                      </Link>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Link to="/categories" className={navLinkClass('/categories')} onClick={() => setMobileMenuOpen(false)}>
                <Tag className="h-4 w-4" /> Categorias
              </Link>
              <Link to="/members" className={navLinkClass('/members')} onClick={() => setMobileMenuOpen(false)}>
                <Users className="h-4 w-4" /> Membros
              </Link>
              <Link to="/consolidation" className={navLinkClass('/consolidation')} onClick={() => setMobileMenuOpen(false)}>
                <CalendarRange className="h-4 w-4" /> Consolidação Mensal
              </Link>
            </nav>
            <div className="border-t px-4 py-3">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted p-3">
                <div>
                  <p className="text-xs text-muted-foreground">Logado como</p>
                  <p className="font-medium truncate">{user?.name}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  {initials}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="mt-3 w-full justify-start gap-3" onClick={handleLogout}>
                <LogOut className="h-4 w-4" /> Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden md:flex w-56 border-r flex flex-col">
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

      <div className="flex flex-1 flex-col">
        <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between border-b border-slate-200/70 bg-background px-4 shadow-sm md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="text-base font-semibold">{currentTitle}</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </div>
        </header>

        <main className="flex-1 overflow-auto pt-14 px-4 pb-6 md:pt-0 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
