import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import FOSListPage from './pages/fos/FOSListPage';
import FOSDetailPage from './pages/fos/FOSDetailPage';
import ProductionOrdersPage from './pages/production/ProductionOrdersPage';
import QualityInspectionsPage from './pages/quality/QualityInspectionsPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import InventoryPage from './pages/inventory/InventoryPage';
import CompetenciesPage from './pages/competencies/CompetenciesPage';
import SafetyPage from './pages/safety/SafetyPage';
import KaizenPage from './pages/kaizen/KaizenPage';
import PhvaBoardPage from './pages/kaizen/PhvaBoardPage';
import CostsPage from './pages/costs/CostsPage';
import LaborPage from './pages/labor/LaborPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import RolesPermissionsPage from './pages/admin/RolesPermissionsPage';
import AdminPlantsPage from './pages/admin/AdminPlantsPage';
import PlantConfigurationPage from './pages/admin/PlantConfigurationPage';
import FormTemplatesPage from './pages/templates/FormTemplatesPage';
import NotFoundPage from './pages/NotFoundPage';

function GuestRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();
    if (loading) return null; // Or a spinner
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
}

export default function App() {
    return (
        <Routes>
            {/* Auth routes */}
            <Route
                path="/login"
                element={
                    <GuestRoute>
                        <AuthLayout>
                            <LoginPage />
                        </AuthLayout>
                    </GuestRoute>
                }
            />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
                <Route
                    path="/"
                    element={<DashboardLayout />}
                >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="fos" element={<FOSListPage />} />
                    <Route path="fos/:id" element={<FOSDetailPage />} />
                    <Route path="production" element={<ProductionOrdersPage />} />
                    <Route path="quality" element={<QualityInspectionsPage />} />
                    <Route path="maintenance" element={<MaintenancePage />} />
                    <Route path="inventory" element={<InventoryPage />} />
                    <Route path="competencies" element={<CompetenciesPage />} />
                    <Route path="safety" element={<SafetyPage />} />
                    <Route path="kaizen" element={<KaizenPage />} />
                    <Route path="phva" element={<PhvaBoardPage />} />
                    <Route path="labor" element={<LaborPage />} />
                    <Route path="costs" element={<CostsPage />} />
                    <Route path="formats" element={<FormTemplatesPage />} />

                    {/* Admin Routes */}
                    <Route element={<ProtectedRoute requiredRole={['admin_global', 'admin_empresa']} />}>
                        <Route path="admin/users" element={<AdminUsersPage />} />
                        <Route path="admin/roles" element={<RolesPermissionsPage />} />
                        <Route path="admin/config" element={<PlantConfigurationPage />} />
                    </Route>
                    <Route element={<ProtectedRoute requiredRole="admin_global" />}>
                        <Route path="admin/plants" element={<AdminPlantsPage />} />
                    </Route>
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
