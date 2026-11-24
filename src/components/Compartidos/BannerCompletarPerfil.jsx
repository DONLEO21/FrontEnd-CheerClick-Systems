import { useEffect, useState } from 'react';
import { CheckCircle2, UserRoundCheck } from 'lucide-react';
import { almacenSesion } from '../../api/client';
import useEstadoSesion from '../../hooks/useEstadoSesion';
import { camposFaltantesPerfil, irACampoPerfil, progresoPerfil } from '../../utils/perfilFaltantes';

/**
 * Aviso de «Completa tu perfil» en la vista de Perfil: tarjeta suave con borde de acento, progreso y chips de lo que falta
 * (cada chip lleva al campo: scroll suave y foco). Se queda mientras falte algo y, al completarse el perfil, muestra un aviso de
 * éxito y se despide con una transición (solo opacity/transform). Estilos: .ui-perfil-banner* en global.css
 */
export default function BannerCompletarPerfil() {
  const { perfilCompleto } = useEstadoSesion();
  const usuario = almacenSesion.usuario();
  // «Vio el perfil incompleto en esta pantalla»: solo entonces se celebra al completarlo (un perfil que ya estaba completo no muestra nada)
  const [vioIncompleto, setVioIncompleto] = useState(!perfilCompleto);
  if (!perfilCompleto && !vioIncompleto) setVioIncompleto(true);
  const [saliendo, setSaliendo] = useState(false);
  const [cerrado, setCerrado] = useState(false);

  useEffect(() => {
    if (!perfilCompleto || !vioIncompleto) return undefined;
    const t1 = setTimeout(() => setSaliendo(true), 4200);
    const t2 = setTimeout(() => setCerrado(true), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [perfilCompleto, vioIncompleto]);

  if (perfilCompleto && (!vioIncompleto || cerrado)) return null;

  const faltantes = camposFaltantesPerfil(usuario);
  const { porcentaje } = progresoPerfil(usuario);
  const exito = perfilCompleto;

  return (
    <section
      className={`ui-perfil-banner${exito ? ' ui-perfil-banner--exito' : ''}${saliendo ? ' ui-perfil-banner--saliendo' : ''}`}
      aria-label={exito ? 'Perfil completo' : 'Perfil incompleto'}
    >
      <span className="ui-perfil-banner__icono" aria-hidden="true">
        {exito ? <CheckCircle2 size={22} /> : <UserRoundCheck size={22} />}
      </span>
      <div className="ui-perfil-banner__cuerpo">
        {/* role=status: el lector de pantalla anuncia el cambio a «completo» sin interrumpir */}
        <div role="status" aria-live="polite">
          <h2 className="ui-perfil-banner__titulo">
            {exito ? '¡Perfil completo! Ya puedes usar todos los módulos' : 'Completa tu perfil para desbloquear todo el sistema'}
          </h2>
          {!exito && (
            <p className="ui-perfil-banner__sub">
              {faltantes.length === 1 ? 'Falta 1 dato' : `Faltan ${faltantes.length || 'algunos'} datos`} para terminar. Es obligatorio para usar el club.
            </p>
          )}
        </div>
        <div className="ui-perfil-progreso">
          <div className="ui-perfil-progreso__pista" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={exito ? 100 : porcentaje} aria-label="Progreso del perfil">
            <div className="ui-perfil-progreso__barra" style={{ transform: `scaleX(${(exito ? 100 : porcentaje) / 100})` }} />
          </div>
          <span className="ui-perfil-progreso__texto">{exito ? 100 : porcentaje}% completado</span>
        </div>
        {!exito && faltantes.length > 0 && (
          <ul className="ui-perfil-chips ui-perfil-chips--fila" aria-label="Datos que faltan">
            {faltantes.map((f) => (
              <li key={f.campo}>
                <button type="button" className="ui-perfil-chip ui-perfil-chip--btn" onClick={() => irACampoPerfil(f.campo)}>
                  {f.etiqueta}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
