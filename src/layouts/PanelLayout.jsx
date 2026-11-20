import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import ModalBienvenidaPerfil from '../components/Compartidos/ModalBienvenidaPerfil';
import { cerrarSesion } from '../services/sesion';

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
  // El estado del menú vive aquí para que el header y el contenido se desplacen con él (ver global.css, sección 3)
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className={'panel' + (menuAbierto ? ' panel--menu-abierto' : '')}>
      <Sidebar
        abierto={menuAbierto}
        onCambiarAbierto={setMenuAbierto}
        items={items}
        activeHref={pathname}        // marca el ítem activo según la URL
        onNavigate={navigate}        // navega sin recargar la página
      />
      <Header
        rol={rol}
        onCerrarSesion={() => cerrarSesion(navigate)}   // cierra la sesión y va a "/"
        onIrInicio={() => navigate(inicioHref)}         // el Header usa onIrInicio, no inicioHref
      />

      <ModalBienvenidaPerfil rutaPerfil={`${inicioHref}/perfil`} onIrAlPerfil={navigate} />

      <main className="contenido-principal">
        <div className="contenido-ancho">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default PanelLayout