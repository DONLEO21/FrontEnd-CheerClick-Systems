import { useEffect, useState } from "react";
import { Pencil, Plus, Power, X } from "lucide-react";
import Modal from "./Modal";
import { listarPlanes, crearPlan, actualizarPlan } from "../../../services/planesService";

const cop = (n) =>
  Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

const VACIO = { nombre: "", descripcion: "", valor: "", estado: "Activo" };

/**
 * Pestaña "Planes asociados" del módulo Pagos: el administrador crea y modifica los planes
 * (nombre, descripción, valor y estado). Lo que quede "Activo" es lo que ven los usuarios al
 * registrarse y lo que se asigna al crear una cuenta.
 * Backend: /api/plan-asociado. No hay DELETE: un plan se "deshabilita" (estado Inactivo) y puede
 * volver a habilitarse.
 */
export default function PlanesPanel({ mostrarAviso }) {
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  const [modal, setModal] = useState(null); // { tipo: 'crear' | 'editar' | 'estado', plan? }
  const [form, setForm] = useState(VACIO);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vivo = true;
    listarPlanes()
      .then((l) => vivo && setPlanes(l))
      .catch((e) => vivo && setErrorCarga(e.message))
      .finally(() => vivo && setCargando(false));
    return () => { vivo = false; };
  }, []);

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const cerrar = () => { if (!guardando) setModal(null); };

  const abrirCrear = () => { setForm(VACIO); setError(""); setModal({ tipo: "crear" }); };
  const abrirEditar = (plan) => {
    setForm({ nombre: plan.nombre, descripcion: plan.descripcion, valor: String(plan.valor), estado: plan.estado });
    setError("");
    setModal({ tipo: "editar", plan });
  };
  const abrirEstado = (plan) => { setError(""); setModal({ tipo: "estado", plan }); };

  const guardar = async (e) => {
    e.preventDefault();
    const nombre = form.nombre.trim();
    const valor = Number(form.valor);
    if (nombre.length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    if (!form.valor || Number.isNaN(valor) || valor < 1) return setError("Ingresa un valor mayor a 0.");
    if (planes.some((p) => p.id !== modal.plan?.id && p.nombre.trim().toLowerCase() === nombre.toLowerCase())) {
      return setError("Ya existe un plan con ese nombre.");
    }

    setGuardando(true);
    setError("");
    try {
      if (modal.tipo === "crear") {
        const nuevo = await crearPlan({ nombre, descripcion: form.descripcion.trim(), valor });
        setPlanes((prev) => [...prev, nuevo]);
        mostrarAviso("Plan creado");
      } else {
        const act = await actualizarPlan(modal.plan.id, { nombre, descripcion: form.descripcion.trim(), valor, estado: form.estado });
        setPlanes((prev) => prev.map((p) => (p.id === act.id ? act : p)));
        mostrarAviso("Plan actualizado");
      }
      setModal(null);
    } catch (err) {
      setError(err.message || "No se pudo guardar el plan.");
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async () => {
    const nuevo = modal.plan.estado === "Activo" ? "Inactivo" : "Activo";
    setGuardando(true);
    setError("");
    try {
      const act = await actualizarPlan(modal.plan.id, { estado: nuevo });
      setPlanes((prev) => prev.map((p) => (p.id === act.id ? act : p)));
      mostrarAviso(nuevo === "Activo" ? "Plan habilitado" : "Plan deshabilitado");
      setModal(null);
    } catch (err) {
      setError(err.message || "No se pudo cambiar el estado.");
    } finally {
      setGuardando(false);
    }
  };

  const esFormulario = modal && modal.tipo !== "estado";
  const deshabilitando = modal?.tipo === "estado" && modal.plan.estado === "Activo";

  return (
    <section className="adm-met">
      <header className="adm-met__cabecera">
        <div>
          <h4 className="adm-met__titulo">Planes asociados</h4>
          <p className="adm-met__sub">
            Los planes activos son los que se ofrecen al registrarse y al crear una cuenta.
          </p>
        </div>
        <button type="button" className="adm-met__nuevo" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo plan
        </button>
      </header>

      {errorCarga && <p className="adm-met__error" role="alert">{errorCarga}</p>}

      <div className="adm-plan__tabla-wrap">
        <table className="adm-plan__tabla">
          <thead>
            <tr>
              <th>Plan</th>
              <th>Descripción</th>
              <th>Valor mensual</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && <tr><td colSpan={5} className="adm-plan__vacio">Cargando planes…</td></tr>}
            {!cargando && planes.length === 0 && (
              <tr><td colSpan={5} className="adm-plan__vacio">Aún no hay planes. Crea el primero con «Nuevo plan».</td></tr>
            )}
            {planes.map((p) => (
              <tr key={p.id} className={p.estado === "Inactivo" ? "adm-plan__fila--inactiva" : ""}>
                <td><strong>{p.nombre}</strong>{p.codigo && <span className="ui-codigo">{p.codigo}</span>}</td>
                <td className="adm-plan__desc">{p.descripcion || "—"}</td>
                <td>{cop(p.valor)}</td>
                <td>
                  <span className={"adm-plan__estado " + (p.estado === "Activo" ? "adm-plan__estado--on" : "adm-plan__estado--off")}>
                    {p.estado === "Activo" ? "Activo" : "Deshabilitado"}
                  </span>
                </td>
                <td>
                  <div className="adm-met__acciones adm-plan__acciones">
                    <button type="button" className="adm-met__btn" title="Editar" aria-label={`Editar ${p.nombre}`} onClick={() => abrirEditar(p)}>
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      className={"adm-met__btn" + (p.estado === "Activo" ? " adm-met__btn--peligro" : " adm-plan__btn-on")}
                      title={p.estado === "Activo" ? "Deshabilitar" : "Habilitar"}
                      aria-label={(p.estado === "Activo" ? "Deshabilitar " : "Habilitar ") + p.nombre}
                      onClick={() => abrirEstado(p)}
                    >
                      <Power size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal className="adm-met__modal" abierto={!!modal} onCerrar={cerrar}>
        {esFormulario && (
          <form onSubmit={guardar} noValidate>
            <header className="adm-met__modal-cabeza">
              <h5>{modal.tipo === "crear" ? "Nuevo plan" : "Modificar plan"}</h5>
              <button type="button" className="adm-met__cerrar" onClick={cerrar} aria-label="Cerrar"><X size={18} /></button>
            </header>
            <div className="adm-met__modal-cuerpo">
              <label htmlFor="adm-plan-nombre">Nombre del plan</label>
              <input id="adm-plan-nombre" type="text" maxLength={40} autoFocus placeholder="Ej: Plan básico"
                value={form.nombre} onChange={cambiar("nombre")} />

              <label htmlFor="adm-plan-desc">Descripción</label>
              <textarea id="adm-plan-desc" rows={3} maxLength={200} placeholder="Qué incluye este plan"
                value={form.descripcion} onChange={cambiar("descripcion")} />

              <div className="adm-plan__fila">
                <div className="adm-plan__campo">
                  <label htmlFor="adm-plan-valor">Valor mensual (COP)</label>
                  <input id="adm-plan-valor" type="number" min="1" step="1000" placeholder="80000"
                    value={form.valor} onChange={cambiar("valor")} />
                </div>
                {modal.tipo === "editar" && (
                  <div className="adm-plan__campo">
                    <label htmlFor="adm-plan-estado">Estado</label>
                    <select id="adm-plan-estado" value={form.estado} onChange={cambiar("estado")}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Deshabilitado</option>
                    </select>
                  </div>
                )}
              </div>
              {error && <p className="adm-met__error" role="alert">{error}</p>}
            </div>
            <footer className="adm-met__modal-pie">
              <button type="button" className="adm-met__sec" onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="adm-met__pri" disabled={guardando}>
                {guardando ? "Guardando…" : modal.tipo === "crear" ? "Crear plan" : "Guardar cambios"}
              </button>
            </footer>
          </form>
        )}

        {modal?.tipo === "estado" && (
          <div>
            <header className="adm-met__modal-cabeza">
              <h5>{deshabilitando ? "Deshabilitar plan" : "Habilitar plan"}</h5>
              <button type="button" className="adm-met__cerrar" onClick={cerrar} aria-label="Cerrar"><X size={18} /></button>
            </header>
            <div className="adm-met__modal-cuerpo">
              <p className="adm-met__texto">
                {deshabilitando
                  ? <>¿Deshabilitar <strong>{modal.plan.nombre}</strong>? Dejará de ofrecerse al registrarse o crear cuentas; los atletas que ya lo tienen no se ven afectados. Podrás habilitarlo de nuevo.</>
                  : <>¿Habilitar <strong>{modal.plan.nombre}</strong>? Volverá a ofrecerse al registrarse y al crear cuentas.</>}
              </p>
              {error && <p className="adm-met__error" role="alert">{error}</p>}
            </div>
            <footer className="adm-met__modal-pie">
              <button type="button" className="adm-met__sec" onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button type="button" className={"adm-met__pri" + (deshabilitando ? " adm-met__pri--peligro" : "")} onClick={cambiarEstado} disabled={guardando}>
                {guardando ? "Guardando…" : deshabilitando ? "Deshabilitar" : "Habilitar"}
              </button>
            </footer>
          </div>
        )}
      </Modal>
    </section>
  );
}
