import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { listarTiposHabilidad } from "../../../services/rendimientoAdminService";

const sinTildes = (s) => (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const VACIA = { texto: "", categoria: "", estado: "activa" };
const MAX_NOMBRE = 80;

/**
 * Crear / editar una habilidad. El tipo sale de los tipos reales del backend (/tipo-habilidad).
 * TODO(backend): la habilidad no guarda "nivel"; por eso el formulario ya no lo pide.
 */
function ModalHabilidad({ habilidad, onCerrar, onGuardar }) {
  const ref = useRef(null);
  const [form, setForm] = useState(() => (habilidad ? { ...habilidad } : VACIA));
  const [tipos, setTipos] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const dialogo = ref.current;
    if (dialogo && !dialogo.open) dialogo.showModal();
  }, []);

  useEffect(() => {
    let vivo = true;
    listarTiposHabilidad()
      .then((l) => vivo && setTipos(l.map((t) => ({ valor: sinTildes(t.nombre), etiqueta: t.nombre }))))
      .catch(() => vivo && setTipos([]));
    return () => { vivo = false; };
  }, []);

  const cerrar = () => {
    if (guardando) return;
    ref.current?.close();
    onCerrar();
  };

  const cambiar = (campo) => (e) => setForm((prev) => ({ ...prev, [campo]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.texto.trim()) return setError("Escribe el nombre de la habilidad.");
    if (!form.categoria) return setError("Selecciona el tipo de habilidad.");
    setError("");
    setGuardando(true);
    try {
      await onGuardar({ ...form, texto: form.texto.trim() });
    } catch (err) {
      setError(err?.message || "No se pudo guardar la habilidad.");
    } finally {
      setGuardando(false);
    }
  };

  const esEdicion = Boolean(habilidad);

  return (
    <dialog
      className="adm-rendimiento-hab-modal"
      ref={ref}
      onCancel={(e) => { e.preventDefault(); cerrar(); }}
      onClick={(e) => { if (e.target === ref.current) cerrar(); }}
    >
      <form onSubmit={guardar} noValidate>
        <header className="adm-rendimiento-hab-cabeza">
          <span className="adm-rendimiento-hab-icono" aria-hidden="true"><Sparkles size={20} /></span>
          <div className="adm-rendimiento-hab-titulos">
            <h5>{esEdicion ? "Editar habilidad" : "Nueva habilidad"}</h5>
            <p>{esEdicion ? "Modifica los datos de la habilidad." : "Se agregará al sistema de evaluación."}</p>
          </div>
          <button type="button" className="adm-rendimiento-hab-cerrar" onClick={cerrar} aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="adm-rendimiento-hab-cuerpo">
          <label htmlFor="hab-nombre">Nombre de la habilidad</label>
          <input
            id="hab-nombre" type="text" autoFocus maxLength={MAX_NOMBRE}
            placeholder="Ej: Invertida en nivel PREP"
            value={form.texto} onChange={cambiar("texto")}
          />
          <small className="adm-rendimiento-hab-contador">{form.texto.length}/{MAX_NOMBRE}</small>

          <label htmlFor="hab-tipo">Tipo</label>
          <select id="hab-tipo" value={form.categoria} onChange={cambiar("categoria")}>
            <option value="">{tipos.length ? "Selecciona un tipo" : "No hay tipos disponibles"}</option>
            {tipos.map((t) => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
          </select>

          {esEdicion && (
            <>
              <label htmlFor="hab-estado">Estado</label>
              <select id="hab-estado" value={form.estado} onChange={cambiar("estado")}>
                <option value="activa">Activa</option>
                <option value="inhabilitada">Deshabilitada</option>
              </select>
            </>
          )}

          {error && <p className="adm-rendimiento-hab-error" role="alert">{error}</p>}
        </div>

        <footer className="adm-rendimiento-hab-pie">
          <button type="button" className="adm-rendimiento-hab-sec" onClick={cerrar} disabled={guardando}>Cancelar</button>
          <button type="submit" className="adm-rendimiento-hab-pri" disabled={guardando}>
            {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Crear habilidad"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}

export default ModalHabilidad;
