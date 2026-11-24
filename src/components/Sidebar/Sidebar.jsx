
import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import './Sidebar.css';
function normalizarRuta(ruta) {
  return (ruta || '').toLowerCase().replace(/\/+$/, '');
}

function esRutaActiva(activeHref, href) {
  if (!activeHref) return false;
  const normalizada = normalizarRuta(activeHref);
  const actual = normalizada;
  const destino = normalizarRuta(href);
  return actual === destino || actual.startsWith(destino + '/');
}

// `abierto` / `onCambiarAbierto` (opcionales): el layout controla el estado para desplazar header y contenido.
// Perfil siempre está libre (es donde se completa el perfil); cerrar sesión y cambiar contraseña no están en este menú
const esExento = (item) => normalizarRuta(item.href).endsWith('/perfil');

// `bloqueado`: perfil incompleto. Los módulos se ven apagados con un candado y NO navegan, pero SÍ reciben clic, Enter y Espacio:
// llaman a `onBloqueado(item)` (el layout abre el modal explicativo). Usan aria-disabled (nunca `disabled` ni pointer-events: none).
function Sidebar({ items, activeHref, onNavigate, abierto, onCambiarAbierto, bloqueado = false, onBloqueado }) {
  const [abiertoInterno, setAbiertoInterno] = useState(false);
  const menuAbierto = abierto ?? abiertoInterno;
  const setMenuAbierto = onCambiarAbierto ?? setAbiertoInterno;
  const barraRef = useRef(null);

  useEffect(() => {
    if (!menuAbierto) return;

    const alPresionar = (e) => {
      if (e.key === 'Escape') setMenuAbierto(false);
    };
    const alHacerClic = (e) => {
      if (barraRef.current && !barraRef.current.contains(e.target)) setMenuAbierto(false);
    };

    document.addEventListener('keydown', alPresionar);
    document.addEventListener('mousedown', alHacerClic);
    return () => {
      document.removeEventListener('keydown', alPresionar);
      document.removeEventListener('mousedown', alHacerClic);
    };
  }, [menuAbierto, setMenuAbierto]);

  return (
    <aside
      ref={barraRef}
      className={'barra-lateral' + (menuAbierto ? ' barra-lateral--abierta' : '')}
      aria-label="Menú de navegación principal"
    >
      <button
        className="boton-menu"
        type="button"
        aria-label="Abrir o cerrar menú"
        aria-expanded={menuAbierto}
        onClick={() => setMenuAbierto((abierto) => !abierto)}
      >
        <span className="boton-menu__linea"></span>
        <span className="boton-menu__linea"></span>
        <span className="boton-menu__linea"></span>
      </button>

      <nav className="w-100">
        <ul className="menu-lateral list-unstyled mb-0" role="list">
          {items.map((item) => {
            const activo = esRutaActiva(activeHref, item.href);
            const sinAcceso = bloqueado && !esExento(item);

            return (
              <li
                key={item.href}
                className={'menu-lateral__elemento' + (activo ? ' menu-lateral__elemento--activo' : '') + (sinAcceso ? ' menu-lateral__elemento--bloqueado' : '')}
              >
                <a
                  href={item.href}
                  className="menu-lateral__enlace"
                  title={menuAbierto ? undefined : sinAcceso ? `${item.titulo} (bloqueado: completa tu perfil)` : item.titulo}
                  aria-current={activo ? 'page' : undefined}
                  aria-disabled={sinAcceso || undefined}
                  onKeyDown={(e) => {
                    // Enter ya activa el enlace; Espacio no: se hace lo mismo que el clic
                    if (sinAcceso && (e.key === ' ' || e.key === 'Spacebar')) { e.preventDefault(); e.currentTarget.click(); }
                  }}
                  onClick={(e) => {
                    if (sinAcceso) { e.preventDefault(); setMenuAbierto(false); onBloqueado?.(item); return; }
                    setMenuAbierto(false);
                    if (!onNavigate) return;
                    e.preventDefault();
                    onNavigate(item.href);
                  }}
                >
                  <img
                    className="menu-lateral__icono"
                    src={item.icono}
                    alt={menuAbierto ? '' : item.alt}
                  />
                  {sinAcceso && <span className="menu-lateral__candado" aria-hidden="true"><Lock size={10} strokeWidth={2.6} /></span>}
                  <span className="menu-lateral__texto" aria-hidden={!menuAbierto}>
                    {item.titulo}
                  </span>
                  {sinAcceso && <span className="ui-sr-only"> (bloqueado: completa tu perfil)</span>}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
export default Sidebar
