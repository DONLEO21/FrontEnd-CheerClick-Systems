import { useEffect, useMemo, useRef, useState } from "react";
import { formatearFechaLarga } from "../../../services/data";
import { horarioDelDia, textoHorario } from "../../../services/rendimientoCalculos";
import { ACEPTA_SOPORTE, validarSoporte } from "../../../services/justificacionesService";
import TextareaContador from "../../../components/Compartidos/TextareaContador";

const MINIMO_CARACTERES = 10;
const MAXIMO_CARACTERES = 250; // límite del backend

const tamanoLegible = (bytes) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`);

/**
 * Formulario "Justificar inasistencia". `fechas` = días en que el atleta tiene una falta sin justificar (pasados o de
 * hoy; nunca futuros), así que el selector solo ofrece fechas válidas. El atleta lo identifica el backend por la sesión.
 */
function ModalJustificar({ fechaISO, fechas = [], nivel, onCerrar, onEnviar }) {
  const dialogRef = useRef(null);
  const archivoRef = useRef(null);
  const [fecha, setFecha] = useState(fechaISO);
  const [motivo, setMotivo] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dialogo = dialogRef.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  // Vista previa del soporte si es una imagen (se libera al cambiar o cerrar)
  const vistaPrevia = useMemo(() => (archivo && archivo.type.startsWith("image/") ? URL.createObjectURL(archivo) : ""), [archivo]);
  useEffect(() => () => { if (vistaPrevia) URL.revokeObjectURL(vistaPrevia); }, [vistaPrevia]);

  const opciones = fechas.includes(fecha) ? fechas : [fecha, ...fechas];
  const horas = textoHorario(horarioDelDia(nivel.horarios, fecha));
  const faltan = Math.max(0, MINIMO_CARACTERES - motivo.trim().length);
  const puedeEnviar = faltan === 0 && !errorArchivo && !enviando;

  const elegirArchivo = (e) => {
    const elegido = e.target.files[0] ?? null;
    e.target.value = "";
    const mensaje = validarSoporte(elegido);
    setErrorArchivo(mensaje);
    setArchivo(mensaje ? null : elegido);
  };

  const quitarArchivo = () => {
    setArchivo(null);
    setErrorArchivo("");
  };

  const enviar = async () => {
    if (!puedeEnviar) return; // sin dobles envíos
    setEnviando(true);
    setError("");
    try {
      await onEnviar({ fecha, motivo, archivo });
    } catch (e) {
      setError(e.message || "No se pudo enviar la justificación. Intenta de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="rend-modal"
      aria-labelledby="rend-modal-titulo"
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === dialogRef.current && !enviando) dialogRef.current.close(); // clic en el fondo
      }}
    >
      <div className="rend-modal__header">
        <h2 id="rend-modal-titulo" className="rend-modal__titulo">Justificar inasistencia</h2>
        <button type="button" className="rend-modal__cerrar" aria-label="Cerrar" disabled={enviando} onClick={() => dialogRef.current.close()}>
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>

      <div className="rend-modal__body">
        <div className="rend-modal__campo">
          <label htmlFor="rend-fecha">Fecha de la falta <span aria-hidden="true">*</span></label>
          {opciones.length > 1 ? (
            <select id="rend-fecha" className="rend-modal__select" value={fecha} onChange={(e) => setFecha(e.target.value)}>
              {opciones.map((f) => (
                <option key={f} value={f}>{formatearFechaLarga(f)}</option>
              ))}
            </select>
          ) : (
            <div className="rend-modal__fecha" id="rend-fecha">{formatearFechaLarga(fecha)}</div>
          )}
          {(horas || nivel.entrenador) && (
            <div className="rend-modal__meta">
              {horas && <><i className="bi bi-clock" aria-hidden="true"></i><span>{horas}</span></>}
              {nivel.entrenador && <><i className="bi bi-person" aria-hidden="true"></i><span>{nivel.entrenador}</span></>}
            </div>
          )}
        </div>

        <div className="rend-modal__campo">
          <label htmlFor="rend-motivo">
            Motivo de la inasistencia <span aria-hidden="true">*</span>
          </label>
          <TextareaContador
            id="rend-motivo"
            className="rend-modal__textarea"
            placeholder="Consulta médica, viaje..."
            value={motivo}
            onChange={setMotivo}
            max={MAXIMO_CARACTERES}
          />
          <p
            id="rend-motivo-ayuda"
            className={`rend-modal__ayuda${faltan === 0 ? " rend-modal__ayuda--ok" : ""}`}
            aria-live="polite"
          >
            {faltan === 0
              ? "✓ Ya puedes enviar la justificación. El archivo es opcional."
              : `Escribe al menos ${MINIMO_CARACTERES} caracteres para poder enviar (${faltan === 1 ? "falta 1" : `faltan ${faltan}`}).`}
          </p>
        </div>

        <div className="rend-modal__adjunto">
          <span className="rend-modal__adjunto-label">Adjuntar archivo (opcional · PDF, JPG, PNG, DOC · máx. 5 MB)</span>
          <input ref={archivoRef} type="file" hidden accept={ACEPTA_SOPORTE} onChange={elegirArchivo} />
          {!archivo && (
            <button type="button" className="rend-btn-subir" onClick={() => archivoRef.current.click()} disabled={enviando}>
              <i className="bi bi-cloud-upload" aria-hidden="true"></i>
              Subir archivo
            </button>
          )}
          {archivo && (
            <div className="rend-modal__archivo-previa">
              {vistaPrevia ? <img src={vistaPrevia} alt="Vista previa del soporte" /> : <i className="bi bi-file-earmark-text" aria-hidden="true"></i>}
              <span className="rend-modal__archivo">{archivo.name} · {tamanoLegible(archivo.size)}</span>
              <button type="button" className="rend-btn-cancelar" onClick={quitarArchivo} disabled={enviando}>Quitar</button>
            </div>
          )}
          {errorArchivo && <p className="rend-modal__error" role="alert">{errorArchivo}</p>}
        </div>

        {error && <p className="rend-modal__error" role="alert">{error}</p>}
      </div>

      <div className="rend-modal__footer">
        <button type="button" className="rend-btn-cancelar" disabled={enviando} onClick={() => dialogRef.current.close()}>
          Cancelar
        </button>
        <button type="button" className="rend-btn-enviar" disabled={!puedeEnviar} onClick={enviar} aria-busy={enviando}>
          {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {enviando ? "Enviando…" : "Enviar justificación"}
        </button>
      </div>
    </dialog>
  );
}

export default ModalJustificar;
