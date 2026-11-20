// Saludo ÚNICO de los tres dashboards (admin, entrenador y atleta). Estilos: .ui-saludo en global.css
import { saludoPorHora, fechaLargaEs } from "../../utils/saludo";

/**
 * <SaludoDashboard nombre="Ana" className="clase-opcional">
 *   <button>Acción a la derecha (p. ej. Perfil)</button>
 * </SaludoDashboard>
 */
export default function SaludoDashboard({ nombre, className = "", children }) {
  const ahora = new Date();
  return (
    <section className={`ui-saludo ${className}`.trim()} aria-labelledby="ui-saludo-titulo">
      <div className="ui-saludo__texto">
        <h1 id="ui-saludo-titulo" className="ui-saludo__titulo">{saludoPorHora(ahora)}, {nombre}</h1>
        <p className="ui-saludo__fecha">{fechaLargaEs(ahora)}</p>
      </div>
      {children}
    </section>
  );
}
