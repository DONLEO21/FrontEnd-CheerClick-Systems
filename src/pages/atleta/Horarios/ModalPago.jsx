import { useEffect, useMemo, useRef, useState } from "react";
import { formatearMoneda } from "./horariosAtletaData";
import { getMetodosPago } from "../../../services/MetodosPagoService";
import { prepararComprobante } from "../../../utils/archivos";

const CAMPOS_VACIOS = { metodoId: "", referencia: "", fecha: "" };

// Hoy en America/Bogota ('AAAA-MM-DD'): el pago no puede tener fecha futura
const hoyISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/**
 * Pago de la inscripción a una competencia. Los métodos salen de la API y SU atributo `requiereComprobante` decide si se
 * pide archivo (Efectivo no). El monto es el precio oficial (lo valida y fija el backend). El error del backend (403,
 * 409, 400…) se muestra DENTRO del modal con su mensaje real. `onEnviar` debe devolver una promesa.
 */
export default function ModalPago({ torneo, inscripcion, onCerrar, onEnviar }) {
  const [campos, setCampos] = useState(CAMPOS_VACIOS);
  const [errores, setErrores] = useState({});
  const [metodos, setMetodos] = useState([]);
  const [cargandoMetodos, setCargandoMetodos] = useState(true);
  const [errorMetodos, setErrorMetodos] = useState("");
  const [comprobante, setComprobante] = useState(""); // data-URL listo para enviar
  const [archivo, setArchivo] = useState(null); // { nombre, tamanoKB }
  const [errorArchivo, setErrorArchivo] = useState("");
  const [zonaActiva, setZonaActiva] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");
  const inputArchivoRef = useRef(null);

  useEffect(() => {
    let vivo = true;
    getMetodosPago()
      .then((lista) => vivo && setMetodos(lista.filter((m) => m.activo)))
      .catch((e) => vivo && setErrorMetodos(e?.message || "No se pudieron cargar los métodos de pago."))
      .finally(() => vivo && setCargandoMetodos(false));
    return () => { vivo = false; };
  }, []);

  const metodo = useMemo(() => metodos.find((m) => m.id === campos.metodoId) ?? null, [metodos, campos.metodoId]);
  if (!torneo) return null;

  const esEfectivo = !!metodo && !metodo.requiereComprobante;
  const requiereComprobante = !!metodo && metodo.requiereComprobante;

  const actualizarCampo = (campo, valor) => {
    setCampos((c) => ({ ...c, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: false }));
    setErrorEnvio("");
  };

  const cambiarMetodo = (id) => {
    actualizarCampo("metodoId", id);
    setComprobante("");
    setArchivo(null);
    setErrorArchivo("");
  };

  const manejarArchivo = async (file) => {
    if (!file) return;
    setErrorEnvio("");
    try {
      setComprobante(await prepararComprobante(file)); // valida tipo (imagen o PDF) y 5 MB; comprime imágenes
      setArchivo({ nombre: file.name, tamanoKB: Math.round(file.size / 1024), esImagen: file.type.startsWith("image/") });
      setErrorArchivo("");
    } catch (e) {
      setComprobante("");
      setArchivo(null);
      setErrorArchivo(e.message);
    }
  };

  const enviarComprobante = async () => {
    if (enviando) return; // sin dobles envíos
    const nuevosErrores = {};
    if (!campos.metodoId) nuevosErrores.metodo = true;
    if (!campos.fecha) nuevosErrores.fecha = true;
    if (requiereComprobante && !comprobante) nuevosErrores.archivo = true;
    setErrores(nuevosErrores);
    if (nuevosErrores.archivo) setErrorArchivo("Adjunta el comprobante de pago para continuar.");
    if (Object.keys(nuevosErrores).length) return;

    setEnviando(true);
    setErrorEnvio("");
    try {
      await onEnviar({
        torneoId: torneo.id,
        metodoPagoId: campos.metodoId,
        fechaPago: campos.fecha,
        referencia: esEfectivo ? "" : campos.referencia.trim(),
        comprobante: requiereComprobante ? comprobante : "",
      });
    } catch (e) {
      setErrorEnvio(e?.message || "No se pudo enviar el comprobante.");
      setEnviando(false);
    }
  };

  const reenvio = inscripcion?.estado === "rechazado";

  return (
    <div
      className="superposicion-modal-atleta activo"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && !enviando && onCerrar()}
    >
      <div className="contenedor-modal-atleta contenedor-modal-atleta--pago">
        <header className="cabecera-modal cabecera-modal--pago">
          <div className="fila-titulo-modal-atleta">
            <div className="icono-categoria-modal"><i className="bi bi-credit-card" /></div>
            <span className="titulo-modal-atleta">
              {torneo.nombre ? `${reenvio ? "Reenviar comprobante" : "Subir comprobante"} — ${torneo.nombre}` : "Subir comprobante de pago"}
            </span>
          </div>
          <button className="cerrar-modal" onClick={onCerrar} aria-label="Cerrar" disabled={enviando}>
            <i className="bi bi-x-lg" />
          </button>
        </header>

        <div className="cuerpo-modal-atleta cuerpo-modal-atleta--pago">
          {reenvio && (
            <p className="nota-pago-efectivo" role="note">
              Tu pago anterior fue rechazado{inscripcion.observaciones ? `: ${inscripcion.observaciones}` : "."} Envía un nuevo comprobante.
            </p>
          )}

          <div className="cuadricula-campos-pago">
            <div className="campo-formulario-atleta">
              <label className="etiqueta-campo-atleta" htmlFor="metodo-pago">Método de pago</label>
              <select
                id="metodo-pago"
                className={`entrada-campo ${errores.metodo ? "entrada-campo--error" : ""}`}
                value={campos.metodoId}
                disabled={cargandoMetodos || !!errorMetodos}
                onChange={(e) => cambiarMetodo(e.target.value)}
              >
                <option value="" disabled>{cargandoMetodos ? "Cargando…" : "Método de pago"}</option>
                {metodos.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
              {errorMetodos && <span className="pista-campo-bloqueado" role="alert">{errorMetodos}</span>}
            </div>
            <div className="campo-formulario-atleta">
              <label className="etiqueta-campo-atleta" htmlFor="monto-pago">Monto a pagar</label>
              <input
                id="monto-pago"
                type="text"
                className="entrada-campo entrada-campo--bloqueada"
                value={formatearMoneda(torneo.costo).replace("$", "") + ",00"}
                disabled
                readOnly
              />
              <span className="pista-campo-bloqueado">
                <i className="bi bi-lock-fill" /> Precio oficial de inscripción
              </span>
            </div>
          </div>

          <div className={`cuadricula-campos-pago ${requiereComprobante ? "" : "cuadricula-campos-pago--una-col"}`}>
            {requiereComprobante && (
              <div className="campo-formulario-atleta">
                <label className="etiqueta-campo-atleta" htmlFor="referencia-pago">N.° de referencia (opcional)</label>
                <input
                  id="referencia-pago"
                  type="text"
                  placeholder="Ej: M000000"
                  maxLength={60}
                  className="entrada-campo"
                  value={campos.referencia}
                  onChange={(e) => actualizarCampo("referencia", e.target.value)}
                />
              </div>
            )}
            <div className="campo-formulario-atleta">
              <label className="etiqueta-campo-atleta" htmlFor="fecha-pago">Fecha del pago</label>
              <input
                id="fecha-pago"
                type="date"
                max={hoyISO()}
                className={`entrada-campo ${errores.fecha ? "entrada-campo--error" : ""}`}
                value={campos.fecha}
                onChange={(e) => actualizarCampo("fecha", e.target.value)}
              />
            </div>
          </div>

          <hr className="divisor-modal" />

          {esEfectivo && (
            <p className="nota-pago-efectivo">
              Para pagos en efectivo no es necesario subir comprobante. Tu inscripción quedará pendiente hasta que el club confirme el pago.
            </p>
          )}

          {requiereComprobante && (
            <>
              <p className="titulo-zona-carga">Comprobante de pago</p>
              <label
                htmlFor="archivo-comprobante"
                className={`zona-carga-archivo ${zonaActiva ? "zona-carga-activa" : ""} ${errores.archivo ? "entrada-campo--error" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setZonaActiva(true); }}
                onDragLeave={() => setZonaActiva(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setZonaActiva(false);
                  manejarArchivo(e.dataTransfer.files[0]);
                }}
              >
                <span className="icono-zona-carga"><i className="bi bi-cloud-arrow-up" /></span>
                <span className="texto-zona-carga">
                  Arrastra tu archivo aquí o <span className="enlace-zona-carga">haz clic para buscarlo</span>
                </span>
                <span className="formatos-zona-carga">PDF, JPG o PNG — máximo 5 MB</span>
                <input
                  ref={inputArchivoRef}
                  id="archivo-comprobante"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="ui-sr-only"
                  onChange={(e) => { manejarArchivo(e.target.files[0]); e.target.value = ""; }}
                />
              </label>
              {archivo && (
                <div className="nombre-archivo-cargado" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {archivo.esImagen && comprobante && <img src={comprobante} alt="Vista previa del comprobante" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} />}
                  <span>📎 {archivo.nombre} · {archivo.tamanoKB} KB</span>
                </div>
              )}
              {errorArchivo && <p className="pista-campo-bloqueado" role="alert" style={{ color: "#cc0000" }}>{errorArchivo}</p>}
            </>
          )}

          {errorEnvio && <p className="nota-pago-efectivo" role="alert" style={{ color: "#b00000", background: "#fdeaea" }}>{errorEnvio}</p>}
        </div>

        <footer className="pie-modal-pago">
          <button className="btn-cancelar-pago" type="button" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button className="btn-enviar-comprobante" type="button" onClick={enviarComprobante} disabled={enviando} aria-busy={enviando}>
            {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
            {enviando ? "Enviando…" : reenvio ? "Reenviar comprobante" : "Enviar comprobante"}
          </button>
        </footer>
      </div>
    </div>
  );
}
