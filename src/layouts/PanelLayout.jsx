import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import { cerrarSesion } from '../services/sesion';
import '../index.css'; // .contenido-principal

/**
 * Layout compartido entre Admin, Atleta y Entrenador.
 *
 *   <Route element={<PanelLayout items={menuAdmin} rol="Administrador" inicioHref="/admin" />}>
 *     <Route path="/admin/implementos" element={<Implementos />} />
 *   </Route>
 */
function PanelLayout({ items, rol, inicioHref = '/' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <>
      <Sidebar
        items={items}
        activeHref={pathname}        // marca el ítem activo según la URL
        onNavigate={navigate}        // navega sin recargar la página
      />
      <Header
        rol={rol}
        onCerrarSesion={() => cerrarSesion(navigate)}   // cierra sesión en Supabase y va a "/"
        onIrInicio={() => navigate(inicioHref)}         // el Header usa onIrInicio, no inicioHref
      />

      <main className="contenido-principal">
        <Outlet />
      </main>
    </>
  );
}

export default PanelLayout