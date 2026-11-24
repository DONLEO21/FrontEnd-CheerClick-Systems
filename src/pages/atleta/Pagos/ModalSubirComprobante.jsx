import { useState, useEffect } from "react";
import useFormularioAsincrono from "../../../hooks/useFormularioAsincrono";
import EstadoTarjeta from "../../../components/Compartidos/EstadoTarjeta";
import Modal from "../../admin/Pagos/Modal";
import { listarMetodosPago } from "../../../services/pagosService";
import { prepararComprobante } from "../../../utils/archivos";
import { pesos } from "../../../components/utils/PagosAtleta";
import DatosPagoMetodo from "../../../components/Compartidos/DatosPagoMetodo";

const MAX_MB = 5;
const TIPOS = ["image/jpeg", "image/png", "application/pdf"];

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Pago de una mensualidad: método (los que configuró el admin), referencia, fecha y comprobante (imagen o PDF).
 * Guiado por datos: si el método elegido NO requiere comprobante (p. ej. Efectivo, `requiereComprobante: false`) se
 * ocultan referencia y comprobante, se quitan sus validaciones y no se envía ningún campo de archivo.
 */
function ModalSubirComprobante({ mensualidad, guardando, onCerrar, onGuardar }) {
  return (
    <Modal className="atl-pagos-menu-regis-atleta" abierto={!!mensualidad} onCerrar={onCerrar}>
      {/* key: al abrir otra mensualidad el formulario se monta de cero (nada de lo escrito se arrastra) */}
      {mensualidad && <FormularioPago key={mensualidad.id} mensualidad={mensualidad} guardando={guardando} onCerrar={onCerrar} onGuardar={onGuardar} />}
    </Modal>
  );
}

// PRIMERO los datos (métodos de pago del admin), DESPUÉS el formulario: ver hooks/useFormularioAsincrono.js
function FormularioPago({ mensualidad, guardando, onCerrar, onGuardar }) {
  const f = useFormularioAsincrono({
    clave: mensualidad.id,
    cargar: () => Promise.all([listarMetodosPago()]).then(([metodos]) => ({ metodos })),
    inicial: () => ({ metodoId: "", referencia: mensualidad.referencia ?? "", fecha: hoyISO() }),
  });
  const metodos = f.datos?.metodos ?? [];
  const { metodoId, referencia, fecha } = f.valores;
  const setMetodoId = (v) => f.cambiar("metodoId", v);
  const setReferencia = (v) => f.cambiar("referencia", v);
  const setFecha = (v) => f.cambiar("fecha", v);
  const [archivo, setArchivo] = useState(null);
  const [vista, setVista] = useState("");
  const [error, setError] = useState("");

  // Vista previa de la imagen elegida
  useEffect(() => {
    if (!archivo || !archivo.type.startsWith("image/")) { setVista(""); return undefined; }
    const url = URL.createObjectURL(archivo);
    setVista(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const elegirArchivo = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!TIPOS.includes(f.type)) return setError("El comprobante debe ser una imagen JPG o PNG, o un PDF.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`El archivo supera los ${MAX_MB} MB.`);
    setError("");
    setArchivo(f);
  };

  const metodoSel = metodos.find((m) => m.id === metodoId);
  // Mientras no se elige método se muestran los campos completos; un método sin comprobante los oculta
  const requiereComprobante = metodoSel ? metodoSel.requiereComprobante !== false : true;

  const listo = f.listo && !!metodoId && !!fecha && (!requiereComprobante || (!!referencia.trim() && !!archivo));

  const enviar = async () => {
    setError("");
    try {
      if (!requiereComprobante) {
        // Efectivo: solo método y fecha. Sin archivo, sin referencia (el backend lo deja pendiente de confirmación).
        await onGuardar({ metodoId, fechaPago: fecha, efectivo: true });
        return;
      }
      const comprobante = await prepararComprobante(archivo);
      await onGuardar({ metodoId, referencia: referencia.trim(), fechaPago: fecha, comprobante });
    } catch (e) {
      setError(e.message || "No se pudo enviar el comprobante.");
    }
  };

  return (
        <>
          <aside className="atl-pagos-cabe-menu-atl">
            <div className="atl-pagos-infor-cabe-atl">
              <svg className="atl-pagos-sim-menu-atl" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17V7" />
                <path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8" />
              </svg>
              <span className="atl-pagos-titu-menu-atl">Pagar mensualidad · {mensualidad.mes}</span>
            </div>
            <div>
              <svg className="atl-pagos-sim-x-atl" onClick={onCerrar} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </div>
          </aside>

          <div className="atl-pago-cuerpo">
            <EstadoTarjeta cargando={f.cargando} error={f.error} onReintentar={f.reintentar} lineas={4}>
            {/* Con un método elegido, el valor y el concepto salen junto a sus datos de pago (DatosPagoMetodo) */}
            {!metodoSel && (
              <div className="atl-pago-valor">
                <span>Valor a pagar</span>
                <strong>{pesos(mensualidad.valor)}</strong>
              </div>
            )}

            <div className="atl-pago-grid">
              <div className="atl-pago-campo">
                <label htmlFor="atl-pago-metodo">Método de pago</label>
                <select id="atl-pago-metodo" value={metodoId} onChange={(e) => setMetodoId(e.target.value)}>
                  <option value="">{metodos.length ? "Selecciona un método" : "No hay métodos disponibles"}</option>
                  {metodos.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </div>
              <div className="atl-pago-campo">
                <label htmlFor="atl-pago-fecha">Fecha del pago</label>
                <input id="atl-pago-fecha" type="date" max={hoyISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
              </div>
              {requiereComprobante && (
                <div className="atl-pago-campo atl-pago-campo--completo">
                  <label htmlFor="atl-pago-ref">N.° de referencia</label>
                  <input id="atl-pago-ref" type="text" maxLength={40} placeholder="Ej: M000000"
                    value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                </div>
              )}
            </div>

            {metodoSel && (
              <DatosPagoMetodo metodo={metodoSel} valor={mensualidad.valor} concepto={`Mensualidad · ${mensualidad.mes}`}
                textoEfectivo="Pagarás en el club. Tu solicitud quedará pendiente hasta que el administrador confirme la recepción." />
            )}

            {requiereComprobante && (
            <div className="atl-pago-comprobante">
              <span className="atl-pago-etiqueta">Comprobante de pago</span>
              <label className="atl-pago-subir">
                {vista ? (
                  <img className="atl-pago-vista" src={vista} alt="Vista previa del comprobante" />
                ) : (
                  <span className="atl-pago-subir__texto">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 15V3" /><path d="m7 10 5 5 5-5" /><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    </svg>
                    {archivo ? archivo.name : "Haz clic para elegir la imagen o el PDF"}
                  </span>
                )}
                <input type="file" accept="image/jpeg,image/png,application/pdf" hidden onChange={elegirArchivo} />
              </label>
              {archivo && vista && <span className="atl-pago-nota">{archivo.name} · haz clic en la imagen para cambiarla</span>}
              <span className="atl-pago-nota">JPG, PNG o PDF · máximo {MAX_MB} MB</span>
            </div>
            )}

            {error && <p className="atl-pago-error" role="alert">{error}</p>}
            </EstadoTarjeta>
          </div>

          <footer className="atl-pagos-conte-btn-atl">
            <button type="button" className="atl-pagos-cancelar-atl" onClick={onCerrar}>Cancelar</button>
            <button type="button" className="atl-pagos-registrar-atl" disabled={!listo || guardando} onClick={enviar}>
              {guardando ? "Enviando…" : requiereComprobante ? "Enviar pago" : "Solicitar pago"}
            </button>
          </footer>
        </>
  );
}
export default ModalSubirComprobante;
