import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './styles.css';
import './App.css';

// Layout y menús
import PanelLayout from './layouts/PanelLayout';
import menuAdmin from './data/menuAdmin';
import menuAtleta from './data/menuAtleta';
import menuEntrenador from './data/menuEntrenador';

// Protección de rutas y páginas públicas
import Rutaprotegida from './components/Rutaprotegida.jsx';
import Landing from './components/landing/Landing.jsx';
import AuthPage from './components/auth/AuthPage.jsx';
import Proximamente from './components/Compartidos/Proximamente.jsx';

// Administrador
import DashboardAdmin from './pages/admin/Dashboard/DashboardAdmin.jsx';
import SolicitudesCuentas from './pages/admin/Cuentas/SolicitudesCuentas.jsx';
import AdminPQRS from './pages/admin/PQRS/PQRS.jsx';

// Entrenador
import DashboardEntrenador from './pages/entrenador/Dashboard/DashboardEntrenador.jsx';

// Atleta
import DashboardAtleta from './pages/atleta/Dashboard/DashboardAtleta.jsx';
import AtletaPQRS from './pages/atleta/PQRS/PQRS.jsx';

// Compartido
import PerfilUsuario from './pages/Perfil/PerfilUsuario.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<Landing />} />
        <Route path="/acceso" element={<AuthPage />} />

        {/* Área Administrador */}
        <Route
          path="/admin"
          element={
            <Rutaprotegida rolPermitido="administrador">
              <PanelLayout items={menuAdmin} rol="Administrador" inicioHref="/admin" />
            </Rutaprotegida>
          }
        >
          <Route index element={<DashboardAdmin />} />
          <Route path="usuarios" element={<SolicitudesCuentas />} />
          <Route path="pqrs" element={<AdminPQRS />} />
          <Route path="perfil" element={<PerfilUsuario rol="admin" />} />

          {/* Secciones del menú que aún no existen */}
          <Route path="*" element={<Proximamente />} />
        </Route>

        {/* Área Entrenador */}
        <Route
          path="/entrenador"
          element={
            <Rutaprotegida rolPermitido="entrenador">
              <PanelLayout items={menuEntrenador} rol="Entrenador" inicioHref="/entrenador" />
            </Rutaprotegida>
          }
        >
          <Route index element={<DashboardEntrenador />} />
          <Route path="perfil" element={<PerfilUsuario rol="entrenador" />} />
          <Route path="*" element={<Proximamente />} />
        </Route>

        {/* Área Atleta */}
        <Route
          path="/atleta"
          element={
            <Rutaprotegida rolPermitido="atleta">
              <PanelLayout items={menuAtleta} rol="Atleta" inicioHref="/atleta" />
            </Rutaprotegida>
          }
        >
          <Route index element={<DashboardAtleta />} />
          {/* TODO: `remitente` debe salir de la sesión real (auth).
              Por ahora simula al atleta con el que se prueban las PQRS. */}
          <Route path="pqrs" element={<AtletaPQRS remitente="Leonardo Jara Molina" />} />
          <Route path="perfil" element={<PerfilUsuario rol="atleta" />} />
          <Route path="*" element={<Proximamente />} />
        </Route>

        {/* Cualquier URL que no exista: evita la pantalla en blanco */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
