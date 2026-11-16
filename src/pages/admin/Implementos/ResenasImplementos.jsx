import { useEffect, useMemo, useRef,  useState } from "react";
import { getResenas } from "../../../services/ResenaService";
import { getImplementos } from "../../../services/ImplementosService";
import { fechaCorta, parsearFecha } from "../../../data/pedidos";
import FiltroSelect from "../../../components/Compartidos/FiltroSelect";

function Estrellas({ valor }) {
  return (
    <span className="estrellas-tabla" aria-label={`${valor} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < valor ? "estrella-llena" : "estrella-vacia"}>★</span>
      ))}
    </span>
  );
}

function ComentarioResena({ texto }) {
  const ref = useRef(null);
  const [expandido, setExpandido] = useState(false);
  const [recortado, setRecortado] = useState(false);

  useEffect(() => {
    const medir = () => {
      const el = ref.current;
      if (el && !expandido) setRecortado(el.scrollHeight > el.clientHeight + 1);
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [texto, expandido]);

  return (
    <div className="comentario-resena">
      <p ref={ref} className={`comentario-resena-texto ${expandido ? "expandido" : ""}`}>
        {texto}
      </p>
      {(recortado || expandido) && (
        <button
          type="button"
          className="comentario-resena-mas"
          aria-expanded={expandido}
          title={expandido ? "Ver menos" : "Ver comentario completo"}
          onClick={() => setExpandido((v) => !v)}
        >
          {expandido ? "Ver menos" : "···"}
        </button>
      )}
    </div>
  );
}

export default function ResenasImplementos() {
  const [resenas, setResenas] = useState([]);
  const [imagenes, setImagenes] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroProducto, setFiltroProducto] = useState("todos");
  const [filtroCalificacion, setFiltroCalificacion] = useState("todas");
  const [orden, setOrden] = useState("recientes");

  useEffect(() => {
    (async () => {
      try {
        const [lista, implementos] = await Promise.all([getResenas(), getImplementos().catch(() => [])]);
        setResenas(lista);
        setImagenes(Object.fromEntries(implementos.map((i) => [i.id, i.imagen])));
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Resumen general (sobre todas las reseñas, sin filtros)
  const resumen = useMemo(() => {
    const total = resenas.length;
    const suma = resenas.reduce((s, r) => s + Number(r.calificacion || 0), 0);
    const positivas = resenas.filter((r) => r.calificacion >= 4).length;
    return {
      total,
      promedio: total ? (suma / total).toFixed(1) : "—",
      positivas: total ? Math.round((positivas / total) * 100) : 0,
    };
  }, [resenas]);

  const opcionesProducto = useMemo(() => {
    const mapa = new Map();
    resenas.forEach((r) => mapa.set(r.implementoId, r.implementoNombre));
    return [
      { value: "todos", label: "Todos" },
      ...[...mapa].map(([value, label]) => ({ value, label })),
    ];
  }, [resenas]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const lista = resenas.filter((r) => {
      const coincideTexto =
        !texto ||
        r.implementoNombre?.toLowerCase().includes(texto) ||
        r.atleta?.toLowerCase().includes(texto) ||
        r.comentario?.toLowerCase().includes(texto);
      const coincideProducto = filtroProducto === "todos" || r.implementoId === filtroProducto;
      const coincideCalificacion =
        filtroCalificacion === "todas" || r.calificacion === Number(filtroCalificacion);
      return coincideTexto && coincideProducto && coincideCalificacion;
    });
    return lista.sort((a, b) => {
      if (orden === "antiguas") return parsearFecha(a.fecha) - parsearFecha(b.fecha);
      if (orden === "mayor") return b.calificacion - a.calificacion;
      if (orden === "menor") return a.calificacion - b.calificacion;
      return parsearFecha(b.fecha) - parsearFecha(a.fecha);
    });
  }, [resenas, busqueda, filtroProducto, filtroCalificacion, orden]);

  return (
    <>
      {error && <div className="alert alert-danger py-2">{error}</div>}

      <div className="resenas-resumen">
        <div className="resenas-stat">
          <span className="resenas-stat-label">Total de reseñas</span>
          <strong className="resenas-stat-valor">{resumen.total}</strong>
        </div>
        <div className="resenas-stat">
          <span className="resenas-stat-label">Calificación promedio</span>
          <strong className="resenas-stat-valor">
            {resumen.promedio} <span className="resenas-stat-estrella">★</span>
          </strong>
        </div>
        <div className="resenas-stat">
          <span className="resenas-stat-label">Reseñas positivas (4★ o más)</span>
          <strong className="resenas-stat-valor">{resumen.positivas}%</strong>
        </div>
      </div>

      <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Buscar reseña..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 ms-md-auto">
          <FiltroSelect label="Producto" value={filtroProducto} onChange={setFiltroProducto} options={opcionesProducto} />

          <FiltroSelect
            label="Calificación"
            value={filtroCalificacion}
            onChange={setFiltroCalificacion}
            options={[
              { value: "todas", label: "Todas" },
              { value: "5", label: "5 estrellas" },
              { value: "4", label: "4 estrellas" },
              { value: "3", label: "3 estrellas" },
              { value: "2", label: "2 estrellas" },
              { value: "1", label: "1 estrella" },
            ]}
          />

          <FiltroSelect
            label="Orden"
            value={orden}
            onChange={setOrden}
            options={[
              { value: "recientes", label: "Más recientes" },
              { value: "antiguas", label: "Más antiguas" },
              { value: "mayor", label: "Mayor calificación" },
              { value: "menor", label: "Menor calificación" },
            ]}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle tabla-implementos tabla-resenas">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Atleta</th>
              <th>Calificación</th>
              <th>Comentario</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {cargando && (
              <tr><td colSpan={5} className="text-center text-muted py-4">Cargando reseñas...</td></tr>
            )}
            {!cargando && filtradas.length === 0 && (
              <tr><td colSpan={5} className="text-center text-muted py-4">No hay reseñas para mostrar.</td></tr>
            )}
            {!cargando &&
              filtradas.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="celda-productos">
                      <img
                        src={imagenes[r.implementoId] }
                        alt={r.implementoNombre}
                        className="img-producto"
                      />
                      <span className="fw-semibold">{r.implementoNombre}</span>
                    </div>
                  </td>
                  <td>{r.atleta}</td>
                  <td>
                    <Estrellas valor={r.calificacion} />
                  </td>
                  <td className="celda-comentario">
                    {r.comentario?.trim() ? (
                      <ComentarioResena texto={r.comentario} />
                    ) : (
                      <span className="text-muted">Sin comentario</span>
                    )}
                  </td>
                  <td>{fechaCorta(r.fecha)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
