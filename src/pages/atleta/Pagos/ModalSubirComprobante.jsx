import { useState, useEffect } from "react";
import Modal from "../../admin/Pagos/Modal";
import { listarMetodosPago } from "../../../services/pagosService";
import { prepararComprobante } from "../../../utils/archivos";
import { pesos } from "../../../components/utils/PagosAtleta";

const MAX_MB = 5;
const TIPOS = ["image/jpeg", "image/png", "application/pdf"];

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Pago de una mensualidad: método (los que configuró el admin), referencia, fecha y comprobante (imagen o PDF). */
function ModalSubirComprobante({ mensualidad, guardando, onCerrar, onGuardar }) {
  const [metodos, setMetodos] = useState([]);
  const [metodoId, setMetodoId] = useState("");
  const [referencia, setReferencia] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [archivo, setArchivo] = useState(null);
  const [vista, setVista] = useState("");
  const [error, setError] = useState("");

  // Reinicia el formulario cada vez que se abre para otra mensualidad
  useEffect(() => {
    if (!mensualidad) return;
    setMetodoId("");
    setReferencia(mensualidad.referencia ?? "");
    setFecha(hoyISO());
    setArchivo(null);
    setError("");
    let vivo = true;
    listarMetodosPago().then((l) => vivo && setMetodos(l)).catch(() => vivo && setMetodos([]));
    return () => { vivo = false; };
  }, [mensualidad]);

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

  const listo = !!metodoId && !!referencia.trim() && !!fecha && !!archivo;

  const enviar = async () => {
    setError("");
    try {
      const comprobante = await prepararComprobante(archivo);
      await onGuardar({ metodoId, referencia: referencia.trim(), fechaPago: fecha, comprobante });
    } catch (e) {
      setError(e.message || "No se pudo enviar el comprobante.");
    }
  };

  return (
    <Modal className="atl-pagos-menu-regis-atleta" abierto={!!mensualidad} onCerrar={onCerrar}>
      {mensualidad && (
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
            <div className="atl-pago-valor">
              <span>Valor a pagar</span>
              <strong>{pesos(mensualidad.valor)}</strong>
            </div>

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
              <div className="atl-pago-campo atl-pago-campo--completo">
                <label htmlFor="atl-pago-ref">N.° de referencia</label>
                <input id="atl-pago-ref" type="text" maxLength={40} placeholder="Ej: M000000"
                  value={referencia} onChange={(e) => setReferencia(e.target.value)} />
              </div>
            </div>

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

            {error && <p className="atl-pago-error" role="alert">{error}</p>}
          </div>

          <footer className="atl-pagos-conte-btn-atl">
            <button type="button" className="atl-pagos-cancelar-atl" onClick={onCerrar}>Cancelar</button>
            <button type="button" className="atl-pagos-registrar-atl" disabled={!listo || guardando} onClick={enviar}>
              {guardando ? "Enviando…" : "Enviar pago"}
            </button>
          </footer>
        </>
      )}
    </Modal>
  );
}
export default ModalSubirComprobante;
