import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './views/dashboard/Dashboard';
import PropDashboard from './views/funded/PropDashboard';
import ImportData from './views/import/ImportData';
import Login from './views/auth/Login';
import ForgotPassword from './views/auth/ForgotPassword';
import Journal from './views/journal/Journal';
import Reports from './views/reports/Reports';
import Settings from './views/settings/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="funded" element={<PropDashboard />} />
            <Route path="journal" element={<Journal />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="import" element={<ImportData />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
