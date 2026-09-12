import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LabsPage from './pages/LabsPage';
import LabDetailPage from './pages/LabDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import DevicesPage from './pages/DevicesPage';
import LoansPage from './pages/LoansPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="laboratorios" element={<LabsPage />} />
          <Route path="laboratorios/:id" element={<LabDetailPage />} />
          <Route path="projetos" element={<ProjectsPage />} />
          <Route path="projetos/:id" element={<ProjectDetailPage />} />
          <Route path="dispositivos" element={<DevicesPage />} />
          <Route path="emprestimos" element={<LoansPage />} />
          <Route path="relatorios" element={<ReportsPage />} />
          <Route
            path="usuarios"
            element={
              <ProtectedRoute adminOnly>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
