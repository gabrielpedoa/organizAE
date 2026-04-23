import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TransactionsPage } from '@/pages/TransactionsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { MembersPage } from '@/pages/MembersPage';
import { ConsolidationPage } from '@/pages/ConsolidationPage';
import { ConsolidationReportPage } from '@/pages/ConsolidationReportPage';
import { AccountsPage } from '@/pages/AccountsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { useAuth } from './context/AuthContext';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export function App() {
  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/transactions/income" element={<PrivateRoute><TransactionsPage type="INCOME" /></PrivateRoute>} />
        <Route path="/transactions/expense" element={<PrivateRoute><TransactionsPage type="EXPENSE" /></PrivateRoute>} />
        <Route path="/categories" element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
        <Route path="/members" element={<PrivateRoute><MembersPage /></PrivateRoute>} />
        <Route path="/accounts" element={<PrivateRoute><AccountsPage /></PrivateRoute>} />
        <Route path="/consolidation" element={<PrivateRoute><ConsolidationPage /></PrivateRoute>} />
        <Route path="/consolidation/:id" element={<PrivateRoute><ConsolidationReportPage /></PrivateRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
