import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ImportData from './pages/ImportData';
import Login from './pages/Login';
import Journal from './pages/Journal';
import Reports from './pages/Reports';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="journal" element={<Journal />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Dashboard />} /> {/* Placeholder */}
            <Route path="import" element={<ImportData />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
