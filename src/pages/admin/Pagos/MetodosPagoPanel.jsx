import { useState } from "react";
import { Wallet, Pencil, Trash2, Plus, X, QrCode } from "lucide-react";
import Modal from "./Modal";
import { crearMetodoPago, actualizarMetodoPago, eliminarMetodoPago } from "../../../services/MetodosPagoService";
import { esMetodoEfectivo, esMetodoPresencial } from "../../../utils/metodosPago";
import { prepararQR } from "../../../utils/archivos";

/**
 * Pestaña "Métodos de pago" del módulo Pagos: crear, editar y eliminar los métodos con los que
 * los atletas pagan. El formulario de "Registrar pago" y el pago del atleta usan SOLO estos métodos.
 * Backend: /api/metodo-pago (nombre + QR opcional). "Efectivo" no lleva QR; el QR solo aplica a los métodos
 * digitales (Nequi, Daviplata…). "Pago presencial" ya no existe: se reemplazó por Efectivo.
 * Datos opcionales para transferir: llave (texto libre), teléfono y cuenta (solo dígitos). El admin llena ninguno, uno o varios.
 */
const DATOS_VACIOS = { llave: "", numeroTelefono: "", numeroCuenta: "" };

export default function MetodosPagoPanel({ metodos, setMetodos, mostrarAviso }) {
  const [modal, setModal] = useState(null); // { tipo: 'crear' | 'editar' | 'eliminar', metodo? }
  const [nombre, setNombre] = useState("");
  const [qr, setQr] = useState(""); // data URL de la imagen del QR (opcional; no aplica a Efectivo)
  const [requiereComprobante, setRequiereComprobante] = useState(true); // ¿el atleta debe adjuntar comprobante?
  const [datosPago, setDatosPago] = useState(DATOS_VACIOS); // llave, teléfono y cuenta (opcionales)
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const abrirCrear = () => { setNombre(""); setQr(""); setDatosPago(DATOS_VACIOS); setRequiereComprobante(true); setError(""); setModal({ tipo: "crear" }); };
  const abrirEditar = (metodo) => { setNombre(metodo.nombre); setQr(metodo.qr ?? ""); setDatosPago({ llave: metodo.llave ?? "", numeroTelefono: metodo.numeroTelefono ?? "", numeroCuenta: metodo.numeroCuenta ?? "" }); setRequiereComprobante(metodo.requiereComprobante !== false); setError(""); setModal({ tipo: "editar", metodo }); };
  const abrirEliminar = (metodo) => { setError(""); setModal({ tipo: "eliminar", metodo }); };
  const cerrar = () => { if (!guardando) setModal(null); };

  const guardar = async (e) => {
    e.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    if (limpio.length > 40) return setError("El nombre no puede superar los 40 caracteres.");
    if (esMetodoPresencial(limpio)) return setError("«Pago presencial» ya no está disponible. Usa «Efectivo».");
    const repetido = metodos.some((m) => m.id !== modal.metodo?.id && m.nombre.trim().toLowerCase() === limpio.toLowerCase());
    if (repetido) return setError("Ya existe un método de pago con ese nombre.");

    // Validación suave de los datos opcionales (el backend vuelve a validar): ninguno es obligatorio
    if (!esMetodoEfectivo(limpio)) {
      if (datosPago.llave.trim().length > 60) return setError("La llave no puede superar los 60 caracteres.");
      if (datosPago.numeroTelefono.trim() && !/^\d{7,15}$/.test(datosPago.numeroTelefono.trim())) return setError("El teléfono debe tener solo dígitos (entre 7 y 15).");
      if (datosPago.numeroCuenta.trim() && !/^\d{6,25}$/.test(datosPago.numeroCuenta.trim())) return setError("El número de cuenta debe tener solo dígitos (entre 6 y 25).");
    }

    setGuardando(true);
    setError("");
    try {
      if (modal.tipo === "crear") {
        const nuevo = await crearMetodoPago({ nombre: limpio, qr, requiereComprobante, ...datosPago });
        setMetodos((prev) => [...prev, nuevo]);
        mostrarAviso("Método de pago creado");
      } else {
        const actualizado = await actualizarMetodoPago(modal.metodo.id, { nombre: limpio, qr, requiereComprobante, ...datosPago });
        setMetodos((prev) => prev.map((m) => (m.id === actualizado.id ? { ...m, ...actualizado } : m)));
        mostrarAviso("Método de pago actualizado");
      }
      setModal(null);
    } catch (err) {
      setError(err.message || "No se pudo guardar el método de pago.");
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    setGuardando(true);
    setError("");
    try {
      await eliminarMetodoPago(modal.metodo.id);
      setMetodos((prev) => prev.filter((m) => m.id !== modal.metodo.id));
      mostrarAviso("Método de pago eliminado");
      setModal(null);
    } catch (err) {
      setError(err.message || "No se pudo eliminar. Puede que ya tenga pagos asociados.");
    } finally {
      setGuardando(false);
    }
  };

  const esFormulario = modal && modal.tipo !== "eliminar";
  const pideQr = !esMetodoEfectivo(nombre); // el QR solo aplica a los métodos que lo necesitan

  const elegirQr = async (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    try {
      setQr(await prepararQR(archivo));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="adm-met">
      <header className="adm-met__cabecera">
        <div>
          <h4 className="adm-met__titulo">Métodos de pago</h4>
          <p className="adm-met__sub">
            Son los métodos que pueden elegir los atletas y que aparecen al registrar un pago.
          </p>
        </div>
        <button type="button" className="adm-met__nuevo" onClick={abrirCrear}>
          <Plus size={16} /> Nuevo método
        </button>
      </header>

      {metodos.length === 0 ? (
        <p className="adm-met__vacio">Aún no hay métodos de pago. Crea el primero con «Nuevo método».</p>
      ) : (
        <ul className="adm-met__lista">
          {metodos.map((m) => (
            <li key={m.id} className="adm-met__tarjeta">
              <span className="adm-met__icono" aria-hidden="true"><Wallet size={22} /></span>
              <div className="adm-met__info">
                <strong className="adm-met__nombre">{m.nombre}</strong>{m.codigo && <span className="ui-codigo">{m.codigo}</span>}
                <span className="adm-met__estado">
                  {esMetodoEfectivo(m.nombre) ? "Se paga en el club · sin comprobante" : `${[m.qr && "QR", m.llave && "llave", m.numeroTelefono && "teléfono", m.numeroCuenta && "cuenta"].filter(Boolean).join(" · ") || "Sin datos de pago"} · ${m.requiereComprobante === false ? "sin comprobante" : "con comprobante"}`}
                </span>
              </div>
              <div className="adm-met__acciones">
                <button type="button" className="adm-met__btn" title="Editar" aria-label={`Editar ${m.nombre}`} onClick={() => abrirEditar(m)}>
                  <Pencil size={16} />
                </button>
                <button type="button" className="adm-met__btn adm-met__btn--peligro" title="Eliminar" aria-label={`Eliminar ${m.nombre}`} onClick={() => abrirEliminar(m)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal className="adm-met__modal" abierto={!!modal} onCerrar={cerrar}>
        {esFormulario && (
          <form onSubmit={guardar} noValidate>
            <header className="adm-met__modal-cabeza">
              <h5>{modal.tipo === "crear" ? "Nuevo método de pago" : "Editar método de pago"}</h5>
              <button type="button" className="adm-met__cerrar" onClick={cerrar} aria-label="Cerrar"><X size={18} /></button>
            </header>
            <div className="adm-met__modal-cuerpo">
              <label htmlFor="adm-met-nombre">Nombre del método</label>
              <input
                id="adm-met-nombre" type="text" autoFocus maxLength={40}
                placeholder="Ej: Nequi, Efectivo, Transferencia"
                value={nombre} onChange={(e) => setNombre(e.target.value)}
              />
              {pideQr ? (
                <label className="adm-met__interruptor">
                  <input type="checkbox" checked={requiereComprobante} onChange={(e) => setRequiereComprobante(e.target.checked)} />
                  <span>El atleta debe adjuntar comprobante al pagar con este método</span>
                </label>
              ) : null}
              {pideQr ? (
                <div className="adm-met__qr">
                  <span className="adm-met__qr-etiqueta">Código QR <small>(opcional)</small></span>
                  {qr ? (
                    <div className="adm-met__qr-vista">
                      <img src={qr} alt="Vista previa del QR" />
                      <button type="button" className="adm-met__sec" onClick={() => setQr("")}>Quitar QR</button>
                    </div>
                  ) : (
                    <label className="adm-met__qr-subir">
                      <QrCode size={18} aria-hidden="true" /> Subir imagen del QR
                      <input type="file" accept="image/*" hidden onChange={elegirQr} />
                    </label>
                  )}
                </div>
              ) : (
                <p className="adm-met__texto">Efectivo se paga en el club: no necesita código QR ni comprobante. La solicitud queda «Pendiente de confirmación» hasta que la confirmes.</p>
              )}
              {pideQr && (
                <fieldset className="adm-met__datos">
                  <legend>Datos para transferir <small>(todos opcionales)</small></legend>
                  <label htmlFor="adm-met-llave">Llave (Bre-B u otra)</label>
                  <input id="adm-met-llave" type="text" maxLength={60} placeholder="Ej: @clubcheerclick"
                    value={datosPago.llave} onChange={(e) => setDatosPago((d) => ({ ...d, llave: e.target.value }))} />
                  <label htmlFor="adm-met-telefono">Número de teléfono</label>
                  <input id="adm-met-telefono" type="text" inputMode="numeric" maxLength={15} placeholder="Solo dígitos"
                    value={datosPago.numeroTelefono} onChange={(e) => setDatosPago((d) => ({ ...d, numeroTelefono: e.target.value.replace(/\D/g, "") }))} />
                  <label htmlFor="adm-met-cuenta">Número de cuenta</label>
                  <input id="adm-met-cuenta" type="text" inputMode="numeric" maxLength={25} placeholder="Solo dígitos"
                    value={datosPago.numeroCuenta} onChange={(e) => setDatosPago((d) => ({ ...d, numeroCuenta: e.target.value.replace(/\D/g, "") }))} />
                </fieldset>
              )}
              {error && <p className="adm-met__error" role="alert">{error}</p>}
            </div>
            <footer className="adm-met__modal-pie">
              <button type="button" className="adm-met__sec" onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button type="submit" className="adm-met__pri" disabled={guardando}>
                {guardando ? "Guardando…" : modal.tipo === "crear" ? "Crear método" : "Guardar cambios"}
              </button>
            </footer>
          </form>
        )}

        {modal?.tipo === "eliminar" && (
          <div>
            <header className="adm-met__modal-cabeza">
              <h5>Eliminar método de pago</h5>
              <button type="button" className="adm-met__cerrar" onClick={cerrar} aria-label="Cerrar"><X size={18} /></button>
            </header>
            <div className="adm-met__modal-cuerpo">
              <p className="adm-met__texto">
                ¿Seguro que quieres eliminar <strong>{modal.metodo.nombre}</strong>? Los atletas dejarán de poder
                elegirlo. Esta acción no se puede deshacer.
              </p>
              {error && <p className="adm-met__error" role="alert">{error}</p>}
            </div>
            <footer className="adm-met__modal-pie">
              <button type="button" className="adm-met__sec" onClick={cerrar} disabled={guardando}>Cancelar</button>
              <button type="button" className="adm-met__pri adm-met__pri--peligro" onClick={eliminar} disabled={guardando}>
                {guardando ? "Eliminando…" : "Eliminar"}
              </button>
            </footer>
          </div>
        )}
      </Modal>
    </section>
  );
}
