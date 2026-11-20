import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { cargarMiPerfil } from '../../services/perfil';
import { almacenSesion } from '../../api/client';

/**
 * Primer ingreso: invita al usuario a completar su perfil. Se muestra UNA sola vez por usuario.
 * Supuesto: "primer ingreso" = todavía no existe su perfil en el backend y no ha visto este aviso.
 * Como el backend no guarda una marca de "aviso visto", se recuerda en el navegador por id de usuario.
 * TODO(backend): campo `perfilBienvenidaVista` (o similar) para recordarlo entre dispositivos.
 */
const clave = (id) => `cheerclick:bienvenida-perfil:${id}`;

const yaVisto = (id) => { try { return localStorage.getItem(clave(id)) === '1'; } catch { return false; } };
const marcarVisto = (id) => { try { localStorage.setItem(clave(id), '1'); } catch { /* sin almacenamiento: se mostrará de nuevo */ } };

export default function ModalBienvenidaPerfil({ rutaPerfil, onIrAlPerfil }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);
  const usuarioId = almacenSesion.usuario()?.id;

  useEffect(() => {
    if (!usuarioId || yaVisto(usuarioId)) return undefined;
    let vivo = true;
    cargarMiPerfil()
      .then((mi) => { if (vivo && !mi?.perfil) setAbierto(true); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [usuarioId]);

  useEffect(() => {
    const dialogo = ref.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  const cerrar = () => {
    if (usuarioId) marcarVisto(usuarioId);
    setAbierto(false);
  };

  const irAlPerfil = () => {
    cerrar();
    onIrAlPerfil?.(rutaPerfil);
  };

  return (
    <dialog ref={ref} className="ui-bienvenida" onCancel={cerrar} aria-labelledby="ui-bienvenida-titulo">
      <div className="ui-bienvenida__icono" aria-hidden="true"><UserRound size={30} /></div>
      <h2 id="ui-bienvenida-titulo" className="ui-bienvenida__titulo">¡Bienvenido a CheerClick!</h2>
      <p className="ui-bienvenida__texto">
        Completa tu perfil con tus datos personales y contactos de emergencia para que el club
        pueda atenderte mejor. Puedes hacerlo ahora o más tarde desde «Perfil».
      </p>
      <div className="ui-bienvenida__acciones">
        <button type="button" className="ui-bienvenida__btn ui-bienvenida__btn--primario" onClick={irAlPerfil}>
          Completar mi perfil
        </button>
        <button type="button" className="ui-bienvenida__btn" onClick={cerrar}>
          Más tarde
        </button>
      </div>
    </dialog>
  );
}
