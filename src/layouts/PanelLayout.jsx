import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import ModalBienvenidaPerfil from '../components/Compartidos/ModalBienvenidaPerfil';
import { cerrarSesion } from '../services/sesion';
import useTituloPagina from '../hooks/useTituloPagina';

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
  useTituloPagina(); // título de la pestaña según el módulo (una sola vez para los tres paneles)
  // El estado del menú vive aquí para que el header y el contenido se desplacen con él (ver global.css, sección 3)
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Envoltorio de la ruta: .ui-montando (entrada escalonada de tarjetas y filas) solo dura el montaje de la vista;
  // se quita manualmente (sin estado de React) para que filtrar o paginar no vuelva a animar la lista.
  const rutaRef = useRef(null);
  useEffect(() => {
    const envoltorio = rutaRef.current;
    const id = setTimeout(() => envoltorio?.classList.remove('ui-montando'), 1400);
    return () => clearTimeout(id);
  }, [pathname]);

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
          {/* key={pathname}: al cambiar de ruta la vista entra con animación (solo opacity/transform, fill backwards) */}
          <div key={pathname} ref={rutaRef} className="ui-anim-pagina ui-montando">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}

export default PanelLayout