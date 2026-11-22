import { ESTADOS_ASISTENCIA } from "../../utils/estadoAsistencia";

// Iconos de la asistencia: ✓ presente, reloj impuntual, ✗ falta, documento justificado.
// Un SOLO componente para la leyenda, las celdas del modal "Consultar asistencia" y cualquier otra vista.
// Los colores salen de las clases .ico-presente / .ico-inpuntual / .ico-falta / .ico-justificado (Asistencia.css).
const TRAZO = { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const SVG = {
  presente: (t) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={t} height={t} viewBox="0 0 24 24" strokeWidth="3" {...TRAZO}><path d="M20 6 9 17l-5-5" /></svg>
  ),
  falta: (t) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={t} height={t} viewBox="0 0 24 24" strokeWidth="3" {...TRAZO}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
  ),
  inpuntual: (t) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={t} height={t} viewBox="0 0 24 24" strokeWidth="2.5" {...TRAZO}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
  ),
  justificado: (t) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={t} height={t} viewBox="0 0 24 24" strokeWidth="2.5" {...TRAZO}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
  ),
};

/**
 * <IconoEstadoAsistencia estado="presente" fecha="2026-11-20" motivo="Cita médica" />
 * Muestra el icono con tooltip (estado y fecha) y aria-label. `tamano` es el lado del SVG en px.
 */
export default function IconoEstadoAsistencia({ estado, fecha, motivo, tamano = 16 }) {
  const info = ESTADOS_ASISTENCIA[estado];
  if (!info) return null;
  const fechaLegible = fecha ? fecha.split("-").reverse().join("/") : "";
  const texto = [info.etiqueta, fechaLegible].filter(Boolean).join(" · ") + (estado === "justificado" && motivo ? ` — ${motivo}` : "");
  return (
    <span className={`ico-${estado}`} role="img" title={texto} aria-label={texto}>
      {SVG[estado](tamano)}
    </span>
  );
}
