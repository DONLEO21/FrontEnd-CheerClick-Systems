import { useEffect, useMemo, useRef, useState } from "react";
import { fechaCorta, parsearFecha, unidadesPedido } from "../../../data/pedidos";
import { getPedidos, aprobarPedido } from "../../../services/PedidosService";
import FiltroSelect from "../../../components/Compartidos/FiltroSelect";
import ModalVerPedido from "./ModalVerPedido";
import ModalRechazarPedido from "./ModalRechazarPedido";

const badgePorEstado = {
  Pendiente: "badge-amarilla",
  Aprobado: "badge-verde",
  Rechazado: "badge-roja",
  Cancelado: "badge-roja",
};

export default function PedidosImplementos({ onAviso }) {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroFecha, setFiltroFecha] = useState("Todos");

  const modalVerRef = useRef(null);
  const modalRechazarRef = useRef(null);

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const datos = await getPedidos();
      setPedidos([...datos].sort((a, b) => parsearFecha(b.fecha) - parsearFecha(a.fecha)));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const verDetalle = (p) => {
    setSeleccionado(p);
    modalVerRef.current.showModal();
  };

  const pedirRechazo = (p) => {
    setSeleccionado(p);
    modalRechazarRef.current.showModal();
  };

  const aprobar = async (p) => {
    try {
      await aprobarPedido(p);
      cargar();
      onAviso("Pedido aprobado.");
    } catch (err) {
      onAviso(err.message, "error");
    }
  };

  const dentroDelRangoFecha = (iso) => {
    if (filtroFecha === "Todos") return true;
    const fecha = parsearFecha(iso);
    const ahora = new Date();
    const dias = (ahora - fecha) / (1000 * 60 * 60 * 24);
    if (filtroFecha === "Hoy") return fecha.toDateString() === ahora.toDateString();
    if (filtroFecha === "Esta semana") return dias >= 0 && dias <= 7;
    if (filtroFecha === "Este mes")
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    return true;
  };

  const pedidosFiltrados = useMemo(() => {
  const texto = busqueda.trim().toLowerCase();
  return pedidos.filter((p) => {
    const coincideTexto =
      !texto ||
      (p.codigo ?? p.id)?.toLowerCase().includes(texto) ||
      p.atleta?.toLowerCase().includes(texto) ||
      (p.items ?? []).some((i) => i.implementoNombre?.toLowerCase().includes(texto));
    const coincideEstado = filtroEstado === "Todos" || p.estado === filtroEstado;
    return coincideTexto && coincideEstado && dentroDelRangoFecha(p.fecha);
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [pedidos, busqueda, filtroEstado, filtroFecha]);

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="search-box">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
          </svg>
          <input
            type="text"
            placeholder="Buscar pedido..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 ms-md-auto">
          <FiltroSelect
            label="Estado"
            value={filtroEstado}
            onChange={setFiltroEstado}
            options={[
              { value: "Todos", label: "Todos" },
              { value: "Pendiente", label: "Pendiente" },
              { value: "Aprobado", label: "Aprobado" },
              { value: "Rechazado", label: "Rechazado" },
              { value: "Cancelado", label: "Cancelado" },
            ]}
          />

          <FiltroSelect
            label="Fecha"
            value={filtroFecha}
            onChange={setFiltroFecha}
            options={[
              { value: "Todos", label: "Todos" },
              { value: "Hoy", label: "Hoy" },
              { value: "Esta semana", label: "Esta semana" },
              { value: "Este mes", label: "Este mes" },
            ]}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle tabla-implementos tabla-pedidos">
          <thead>
            <tr>
              <th>Código de pedido</th>
              <th>Productos</th>
              <th>Atleta</th>
              <th>Unidades</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={7} className="text-center text-muted py-4">Cargando pedidos...</td></tr>
            )}
            {!cargando && pedidosFiltrados.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted py-4">No hay pedidos.</td></tr>
            )}
            {!cargando &&
              pedidosFiltrados.map((p) => {
                const items = p.items ?? [];
                const primero = items[0];
                return (
                  <tr key={p.id}>
                    <td>{p.codigo ?? p.id}</td>
                    <td>
                      <div className="celda-productos">
                        <img
                          src={primero?.implementoImagen}
                          alt={primero?.implementoNombre ?? "Producto"}
                          className="img-producto"
                        />
                        <div className="celda-productos-texto">
                          <span className="fw-semibold">{primero?.implementoNombre ?? "—"}</span>
                          {items.length > 1 && (
                            <span className="celda-productos-mas">+{items.length - 1} producto(s) más</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{p.atleta}</td>
                    <td>{unidadesPedido(p)}</td>
                    <td>{fechaCorta(p.fecha)}</td>
                    <td>
                      <span className={`badge-pastilla ${badgePorEstado[p.estado]}`}>{p.estado}</span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          type="button"
                          className="ui-accion ui-accion--detalle"
                          title="Ver detalle"
                          onClick={() => verDetalle(p)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                        </button>

                        <button
                          type="button"
                          className="ui-accion ui-accion--aprobar"
                          title="Aprobar"
                          disabled={p.estado !== "Pendiente"}
                          onClick={() => aprobar(p)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="ui-accion ui-accion--rechazar"
                          title="Rechazar"
                          disabled={p.estado !== "Pendiente"}
                          onClick={() => pedirRechazo(p)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <ModalVerPedido ref={modalVerRef} pedido={seleccionado} />
      <ModalRechazarPedido
        ref={modalRechazarRef}
        pedido={seleccionado}
        onRechazado={() => {
          cargar();
          onAviso("Pedido rechazado.");
        }}
      />
    </>
  );
}
