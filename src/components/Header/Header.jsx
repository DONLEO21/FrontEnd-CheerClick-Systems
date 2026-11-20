import './Header.css';
import logoClub from '../../assets/icons/Logo-Club.png';
import SelectorRol from './SelectorRol';
import PanelNotificaciones from './PanelNotificaciones';

function Header({ rol = 'Administrador', onCerrarSesion, onIrInicio }) {
  return (
    <header className="encabezado" role="banner">
      <div className="encabezado__contenedor d-flex align-items-center justify-content-between h-100 px-3">

        <nav aria-label="Opciones de sesión">
          <ul className="list-unstyled d-flex align-items-center gap-2 mb-0">
            <li>
              <button
                type="button"
                className="boton-cerrar-sesion"
                onClick={onCerrarSesion}
              >
                Cerrar Sesión
              </button>
            </li>
            <li>
              <SelectorRol rol={rol} />
            </li>
          </ul>
        </nav>

        <div className="encabezado__iconos-logo d-flex align-items-center">
          <PanelNotificaciones />
          <a
            href="#"
            className="icono-accion"
            aria-label="Ir al inicio"
            onClick={(e) => {
              e.preventDefault();
              onIrInicio?.();
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
              <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </a>
          <div className="encabezado__separador"></div>
          <figure className="logo-club mb-0">
            <img src={logoClub} alt="Logo del club deportivo" />
          </figure>
        </div>

      </div>
    </header>
  );
}

export default Header