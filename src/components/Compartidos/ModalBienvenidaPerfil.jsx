import { useEffect, useId, useRef } from 'react';
import { Check } from 'lucide-react';
import { almacenSesion } from '../../api/client';
import useEstadoSesion from '../../hooks/useEstadoSesion';
import { pasosDePerfil } from '../../utils/perfilFaltantes';
import { bienvenidaYaVista, marcarBienvenidaVista } from '../../utils/bienvenidaPerfil';
import logoClub from '../../assets/icons/Logo-Club.png';

/**
 * Primer ingreso con el perfil incompleto: el único camino es «Completar mi perfil» (sin «Más tarde», X, Escape ni cierre por
 * clic fuera). Completar el perfil es obligatorio: mientras `perfilCompleto` sea false, la app solo deja entrar a «Perfil».
 * No reaparece cuando el perfil ya está completo, ni después de pulsar el botón. Como el backend no guarda una marca de
 * "aviso visto", se recuerda en el navegador por id de usuario. Estilos: .ui-perfil-* en global.css
 */
export default function ModalBienvenidaPerfil({ rutaPerfil, onIrAlPerfil }) {
  const ref = useRef(null);
  const idTitulo = useId();
  const { perfilCompleto } = useEstadoSesion();
  const usuario = almacenSesion.usuario();
  const abierto = !!usuario?.id && !perfilCompleto && !bienvenidaYaVista(usuario.id);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  const irAlPerfil = () => {
    if (usuario?.id) marcarBienvenidaVista(usuario.id);
    ref.current?.close();
    onIrAlPerfil?.(`${rutaPerfil}?completar=1`);
  };

  if (!abierto) return null;

  return (
    // Escape (cancel) no cierra el aviso: la única salida es el botón
    <dialog
      ref={ref}
      className="ui-perfil-dialogo ui-perfil-dialogo--bienvenida ui-anim-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={idTitulo}
      onCancel={(e) => e.preventDefault()}
    >
      <span className="ui-perfil-dialogo__logo" aria-hidden="true"><img src={logoClub} alt="" /></span>
      <h2 id={idTitulo} className="ui-perfil-dialogo__titulo">¡Bienvenido a CheerClick{usuario?.nombre ? `, ${usuario.nombre.split(' ')[0]}` : ''}! <span aria-hidden="true">👋</span></h2>
      <p className="ui-perfil-dialogo__texto">
        Antes de empezar, completa tu perfil. Así tu entrenador y el club tendrán tus datos al día.
      </p>
      <ul className="ui-perfil-pasos">
        {pasosDePerfil(usuario?.rol).map((paso) => (
          <li key={paso}><span className="ui-perfil-pasos__check" aria-hidden="true"><Check size={13} strokeWidth={3} /></span>{paso}</li>
        ))}
      </ul>
      <div className="ui-perfil-dialogo__acciones">
        <button type="button" className="ui-confirmar__btn ui-confirmar__btn--peligro" onClick={irAlPerfil} autoFocus>
          Completar mi perfil
        </button>
      </div>
    </dialog>
  );
}
