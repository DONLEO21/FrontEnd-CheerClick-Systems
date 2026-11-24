import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import ModalBienvenidaPerfil from '../components/Compartidos/ModalBienvenidaPerfil';
import { bienvenidaPendiente } from '../utils/bienvenidaPerfil';
import ModalPerfilIncompleto from '../components/Compartidos/ModalPerfilIncompleto';
import { almacenSesion } from '../api/client';
import { camposFaltantesPerfil, irACampoPerfil } from '../utils/perfilFaltantes';
import { nombreDeRuta } from '../constants/titulosRutas';
import { cerrarSesion } from '../services/sesion';
import useEstadoSesion from '../hooks/useEstadoSesion';
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
  const { pathname, search, state } = useLocation();
  const { perfilCompleto } = useEstadoSesion(); // perfil incompleto: menú bloqueado y modal explicativo
  useTituloPagina(); // título de la pestaña según el módulo (una sola vez para los tres paneles)
  // El estado del menú vive aquí para que el header y el contenido se desplacen con él (ver global.css, sección 3)
  const [menuAbierto, setMenuAbierto] = useState(false);

  /* ── Modal «Completa tu perfil» al intentar abrir un módulo bloqueado ──
     Este layout es el ÚNICO que decide qué modal se muestra: si la bienvenida está abierta, este no se abre. Llega por el clic en el
     menú (onBloqueado) o por URL escrita a mano (Rutaprotegida redirige a Perfil con state.moduloBloqueado). */
  const [moduloBloqueado, setModuloBloqueado] = useState(null);
  const [consumido, setConsumido] = useState(null);
  const pedidoPorUrl = state?.moduloBloqueado ?? null;
  // Actualización durante el render con guarda (patrón de React): se lee el pedido de la URL UNA vez
  if (pedidoPorUrl && pedidoPorUrl !== consumido) {
    setConsumido(pedidoPorUrl);
    if (!bienvenidaPendiente()) setModuloBloqueado(pedidoPorUrl);
  } else if (!pedidoPorUrl && consumido) {
    setConsumido(null);
  }
  // El pedido se borra del historial para que recargar la página o volver atrás no vuelva a abrir el modal
  useEffect(() => {
    if (pedidoPorUrl) navigate(pathname + search, { replace: true, state: null });
  }, [pedidoPorUrl, pathname, search, navigate]);

  const pedirModulo = (item) => {
    if (bienvenidaPendiente()) return;
    setModuloBloqueado(nombreDeRuta(item.href) ?? item.titulo);
  };
  const completarPerfil = () => {
    setModuloBloqueado(null);
    const enPerfil = pathname.toLowerCase().replace(/\/+$/, '') === `${inicioHref}/perfil`;
    if (enPerfil) irACampoPerfil(camposFaltantesPerfil(almacenSesion.usuario())[0]?.campo);
    else navigate(`${inicioHref}/perfil?completar=1`);
  };

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
        bloqueado={!perfilCompleto}
        onBloqueado={pedirModulo}
      />
      <Header
        rol={rol}
        onCerrarSesion={() => cerrarSesion(navigate)}   // cierra la sesión y va a "/"
        onIrInicio={() => navigate(inicioHref)}         // el Header usa onIrInicio, no inicioHref
      />

      <ModalBienvenidaPerfil rutaPerfil={`${inicioHref}/perfil`} onIrAlPerfil={navigate} />
      <ModalPerfilIncompleto
        abierto={!!moduloBloqueado && !perfilCompleto}
        modulo={moduloBloqueado}
        faltantes={camposFaltantesPerfil(almacenSesion.usuario())}
        onCompletar={completarPerfil}
        onCerrar={() => setModuloBloqueado(null)}
      />

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