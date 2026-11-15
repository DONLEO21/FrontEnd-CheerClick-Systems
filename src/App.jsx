import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

import './App.css';
import './styles.css';

import { SesionProvider } from './context/SesionContext';

import menuAdmin from './data/menuAdmin';
import menuAtleta from './data/menuAtleta';

import Rutaprotegida from './components/Rutaprotegida.jsx';
import Header from './components/Header/Header';
import Sidebar from './components/Sidebar/Sidebar';

// Públicas
import Landing from './components/landing/Landing.jsx';
import AuthPage from './components/auth/AuthPage.jsx';

// Administrador
import DashboardAdmin from './pages/admin/Dashboard/DashboardAdmin.jsx';
import SolicitudesCuentas from './pages/admin/Cuentas/SolicitudesCuentas.jsx';
import AdminPagos from './pages/Admin/Pagos/Pagos';

// Entrenador
import DashboardEntrenador from './pages/entrenador/Dashboard/DashboardEntrenador.jsx';

// Atleta
import DashboardAtleta from './pages/atleta/Dashboard/DashboardAtleta.jsx';
import AtletaPagos from './pages/atleta/Pagos/Pagos';

// Compartida
import PerfilUsuario from './pages/Perfil/PerfilUsuario.jsx';

function Layout({ items, rol, inicioHref }) {
  return (
    <>
      <Sidebar items={items} />
      <Header rol={rol} inicioHref={inicioHref} />
      <main style={{ marginLeft: 56, marginTop: 55 }}>
        <Outlet />
      </main>
    </>
  );
}

export default function App() {
  return (
    <SesionProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/acceso" element={<AuthPage />} />

          {/* Administrador */}
          <Route
            path="/admin"
            element={
              <Rutaprotegida rolPermitido="administrador">
                <DashboardAdmin />
              </Rutaprotegida>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <Rutaprotegida rolPermitido="administrador">
                <SolicitudesCuentas />
              </Rutaprotegida>
            }
          />
          <Route
            path="/admin/perfil"
            element={
              <Rutaprotegida rolPermitido="administrador">
                <PerfilUsuario rol="admin" />
              </Rutaprotegida>
            }
          />
          {/* Administrador - páginas con Sidebar + Header */}
          <Route
            element={
              <Rutaprotegida rolPermitido="administrador">
                <Layout items={menuAdmin} rol="Administrador" inicioHref="/admin/pagos" />
              </Rutaprotegida>
            }
          >
            <Route path="/admin/pagos" element={<AdminPagos />} />
          </Route>

          {/* Entrenador */}
          <Route
            path="/entrenador"
            element={
              <Rutaprotegida rolPermitido="entrenador">
                <DashboardEntrenador />
              </Rutaprotegida>
            }
          />
          <Route
            path="/entrenador/perfil"
            element={
              <Rutaprotegida rolPermitido="entrenador">
                <PerfilUsuario rol="entrenador" />
              </Rutaprotegida>
            }
          />

          {/* Atleta */}
          <Route
            path="/atleta"
            element={
              <Rutaprotegida rolPermitido="atleta">
                <DashboardAtleta />
              </Rutaprotegida>
            }
          />
          <Route
            path="/atleta/perfil"
            element={
              <Rutaprotegida rolPermitido="atleta">
                <PerfilUsuario rol="atleta" />
              </Rutaprotegida>
            }
          />
          {/* Atleta - páginas con Sidebar + Header */}
          <Route
            element={
              <Rutaprotegida rolPermitido="atleta">
                <Layout items={menuAtleta} rol="Atleta" inicioHref="/atleta/pagos" />
              </Rutaprotegida>
            }
          >
            <Route path="/atleta/pagos" element={<AtletaPagos />} />
          </Route>

          {/* Cualquier URL que no exista: evita la pantalla en blanco */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SesionProvider>
  );
}
