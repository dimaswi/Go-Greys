import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SiteConfigProvider } from './context/SiteConfigContext';
import { AppDialogProvider } from './context/AppDialogContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout';
import RoleRoute from './components/RoleRoute';
import { Toaster } from 'sonner';

import UsersIndex from './pages/users/index';
import UserCreate from './pages/users/create';
import UserEdit from './pages/users/edit';
import UserShow from './pages/users/show';
import Login from './pages/auth/login';

import RolesIndex from './pages/roles/index';
import RoleCreate from './pages/roles/create';
import RoleEdit from './pages/roles/edit';

import Dashboard from './pages/dashboard/index';

import BrandSettings from './pages/settings/brand';

import TreatmentsIndex from './pages/treatments/index';
import TreatmentCreate from './pages/treatments/create';
import TreatmentEdit from './pages/treatments/edit';

import TreatmentLogsIndex from './pages/treatment-logs/index';

import PatientsIndex from './pages/patients/index';
import PatientCreate from './pages/patients/create';
import PatientEdit from './pages/patients/edit';

import VisitsIndex from './pages/visits/index';
import VisitCreate from './pages/visits/create';
import VisitRoom from './pages/visits/room/index';

import PayrollIndex from './pages/payroll/index';
import PayrollList from './pages/payroll/list';

function DashboardLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <SiteConfigProvider>
        <AppDialogProvider>
          <Router>
            <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Dashboard />} />
                
                <Route element={<RoleRoute permissions={["users.view", "users.create", "users.edit", "users.delete"]} />}>
                  <Route path="/users" element={<UsersIndex />} />
                  <Route path="/users/create" element={<UserCreate />} />
                  <Route path="/users/:id" element={<UserShow />} />
                  <Route path="/users/:id/edit" element={<UserEdit />} />
                </Route>

                <Route element={<RoleRoute permissions={["roles.view", "roles.create", "roles.edit", "roles.delete"]} />}>
                  <Route path="/roles" element={<RolesIndex />} />
                  <Route path="/roles/create" element={<RoleCreate />} />
                  <Route path="/roles/:id/edit" element={<RoleEdit />} />
                  <Route path="/settings/brand" element={<BrandSettings />} />
                </Route>

                {/* Treatment Routes */}
                <Route element={<RoleRoute permissions={["treatments.view", "treatments.create", "treatments.edit", "treatments.delete"]} />}>
                  <Route path="/treatments" element={<TreatmentsIndex />} />
                  <Route path="/treatments/create" element={<TreatmentCreate />} />
                  <Route path="/treatments/:id/edit" element={<TreatmentEdit />} />
                </Route>
                
                {/* Patient Routes */}
                <Route element={<RoleRoute permissions={["patients.view", "patients.create", "patients.edit", "patients.delete"]} />}>
                  <Route path="/patients" element={<PatientsIndex />} />
                  <Route path="/patients/create" element={<PatientCreate />} />
                  <Route path="/patients/:id/edit" element={<PatientEdit />} />
                </Route>

                {/* Visit Routes */}
                <Route element={<RoleRoute permissions={["visits.view", "visits.create", "visits.edit", "visits.delete"]} />}>
                  <Route path="/visits" element={<VisitsIndex />} />
                  <Route path="/visits/create" element={<VisitCreate />} />
                  <Route path="/visits/:id/room" element={<VisitRoom />} />
                </Route>

                {/* Legacy Treatment Logs (if needed) */}
                <Route element={<RoleRoute permissions={["treatment_logs.view", "treatment_logs.create", "treatment_logs.delete"]} />}>
                  <Route path="/treatment-logs" element={<TreatmentLogsIndex />} />
                </Route>
                
                {/* Payroll Routes */}
                <Route element={<RoleRoute permissions={["payroll.view"]} />}>
                  <Route path="/payroll" element={<PayrollIndex />} />
                  <Route path="/payroll/list" element={<PayrollList />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Router>
          <Toaster position="top-right" richColors />
        </AppDialogProvider>
      </SiteConfigProvider>
    </AuthProvider>
  );
}

export default App;
