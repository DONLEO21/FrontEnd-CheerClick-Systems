import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import { cerrarSesion } from '../services/sesion';
import '../pages/admin/Dashboard/DashboardAdmin.css'; // estilos de .dashboard y .dashboard__contenido

function PanelLayout({ items, rol, inicioHref = '/' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="dashboard">
      <Sidebar items={items} activeHref={pathname} onNavigate={navigate} />

      <div className="dashboard__contenido">
        <Header
          rol={rol}
          onCerrarSesion={() => cerrarSesion(navigate)}
          onIrInicio={() => navigate(inicioHref)}
        />
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default PanelLayout;