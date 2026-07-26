import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppDialogProvider } from './context/AppDialogContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout';
import RoleRoute from './components/RoleRoute';

import UsersIndex from './pages/users/index';
import UserCreate from './pages/users/create';
import UserEdit from './pages/users/edit';
import UserShow from './pages/users/show';
import Login from './pages/auth/login';

import RolesIndex from './pages/roles/index';
import RoleCreate from './pages/roles/create';
import RoleEdit from './pages/roles/edit';

import Dashboard from './pages/dashboard/index';

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
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AppDialogProvider>
    </AuthProvider>
  );
}

export default App;
