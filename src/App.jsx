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
import AdminHorarios from './pages/admin/Horarios/Horarios.jsx';
import AdminImplementos from './pages/admin/Implementos/Implementos';

// Entrenador
import DashboardEntrenador from './pages/entrenador/Dashboard/DashboardEntrenador.jsx';
import EntrenadorHorarios from './pages/entrenador/Horarios/Horarios.jsx';

// Atleta
import DashboardAtleta from './pages/atleta/Dashboard/DashboardAtleta.jsx';
import AtletaHorarios from './pages/atleta/Horarios/Horarios.jsx';
import AtletaImplementos from './pages/atleta/Implementos/Implementos';

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
          <Route path="horarios" element={<AdminHorarios />} />
          <Route path="implementos" element={<AdminImplementos />} />
          <Route path="perfil" element={<PerfilUsuario rol="admin" />} />

          {/* Vista Entrenador del Admin: es entrenador de TODOS los niveles,
              por eso esAdmin=true habilita el selector para cambiar de nivel. */}
          <Route path="calendario" element={<EntrenadorHorarios esAdmin={true} />} />

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
          {/* TODO: esAdmin y nivelIdEntrenador deben salir de la sesión real
              (auth). Por ahora, esAdmin=false simula un entrenador normal
              viendo solo su propio nivel (id 3 = Magic). */}
          <Route
            path="horarios"
            element={<EntrenadorHorarios esAdmin={false} nivelIdEntrenador={3} />}
          />
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
          <Route path="horarios" element={<AtletaHorarios />} />
          <Route path="implementos" element={<AtletaImplementos />} />
          <Route path="perfil" element={<PerfilUsuario rol="atleta" />} />
          <Route path="*" element={<Proximamente />} />
        </Route>

        {/* Cualquier URL que no exista: evita la pantalla en blanco */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}