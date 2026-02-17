import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GalaxyViewPage from './pages/GalaxyViewPage';
import CategoryViewPage from './pages/CategoryViewPage';
import GeneratorViewPage from './pages/GeneratorViewPage';
import SettingsPage from './pages/SettingsPage';
import EscoDashboardPage from './pages/EscoDashboardPage';
import OccupationNetworkPage from './pages/OccupationNetworkPage';


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/galaxy"
          element={
            <AuthGuard>
              <GalaxyViewPage />
            </AuthGuard>
          }
        />
        <Route
          path="/category/:id"
          element={
            <AuthGuard>
              <CategoryViewPage />
            </AuthGuard>
          }
        />
        <Route
          path="/job/:id"
          element={
            <AuthGuard>
              <GeneratorViewPage />
            </AuthGuard>
          }
        />
        <Route
          path="/occupation-network/:id"
          element={
            <AuthGuard>
              <OccupationNetworkPage />
            </AuthGuard>
          }
        />
        <Route
          path="/settings"
          element={
            <AuthGuard>
              <SettingsPage />
            </AuthGuard>
          }
        />
        <Route
          path="/esco-dashboard"
          element={
            <AuthGuard>
              <EscoDashboardPage />
            </AuthGuard>
          }
        />

        <Route path="/" element={<Navigate to="/galaxy" replace />} />
        <Route path="*" element={<Navigate to="/galaxy" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
