import { useEffect, useMemo, useRef, useState } from "react";
// Corregido: sube 3 niveles hasta src (src/services/...)
import { getImplementos } from "../../../services/ImplementosService";
import { getResenas } from "../../../services/ResenaService";
import ProductoCard from "./ProductoCard";
import ModalAgregarCarrito from "./ModalAgregarCarrito";
import FiltroSelect from "../../../components/Compartidos/FiltroSelect";

export default function CatalogoImplementos({ onAviso }) {
  const [implementos, setImplementos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [filtroGenero, setFiltroGenero] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const modalRef = useRef(null);

  const [resenas, setResenas] = useState([]);
  useEffect(() => {
    getResenas()
      .then(setResenas)
      .catch(() => setResenas([]));
  }, []);

  const cargar = async () => {
    setCargando(true);
    setError("");
    try {
      const datos = await getImplementos();
      setImplementos(datos.filter((i) => i.estado === "Disponible"));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const productosFiltrados = useMemo(() => {
    return implementos.filter((item) => {
      const coincideBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideGenero = filtroGenero === "todos" || item.genero?.toLowerCase() === filtroGenero;
      const coincideTipo = filtroTipo === "todos" || item.tipo?.toLowerCase() === filtroTipo;
      return coincideBusqueda && coincideGenero && coincideTipo;
    });
  }, [implementos, busqueda, filtroGenero, filtroTipo]);

  const abrirAgregar = (producto) => {
    setProductoSeleccionado(producto);
    modalRef.current.showModal();
  };

  return (
    <section aria-label="Catálogo de implementos deportivos">
      <div className="barra-filtros-modulo">
        <div className="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Buscar Implemento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filtro-selectores">
          {/* Filtro de Género */}
          <FiltroSelect
            label="Género"
            value={filtroGenero}
            onChange={setFiltroGenero}
            options={[
              { value: "todos", label: "Todos" },
              { value: "femenino", label: "Femenino" },
              { value: "masculino", label: "Masculino" },
              { value: "unisex", label: "Unisex" },
            ]}
          />

          {/* Filtro de Categoría */}
          <FiltroSelect
            label="Categoría"
            value={filtroTipo}
            onChange={setFiltroTipo}
            options={[
              { value: "todos", label: "Todos" },
              { value: "ropa", label: "Ropa" },
              { value: "calzado", label: "Calzado" },
              { value: "accesorios", label: "Accesorios" },
            ]}
          />
        </div>
      </div>

      {error && <div className="alerta-error">{error}</div>}

      <h2 className="subtitulo-seccion">Catálogo de Productos</h2>

      <div className="grid-productos">
        {cargando && <p>Cargando catálogo...</p>}
        {!cargando && productosFiltrados.length === 0 && <p>No se encontraron productos.</p>}
        {!cargando &&
          productosFiltrados.map((item) => (
            <ProductoCard key={item.id} implemento={item} onAgregar={abrirAgregar} />
          ))}
      </div>

      <ModalAgregarCarrito
        ref={modalRef}
        implemento={productoSeleccionado}
        onAgregado={(implemento, { limitado }) =>
          onAviso(
            limitado
              ? `Agregado al carrito (máximo de unidades disponibles de ${implemento.nombre}).`
              : `${implemento.nombre} se agregó al carrito.`
          )
        }
      />

      <div className="seccion-comentarios-comunidad">
        <h2 className="subtitulo-seccion">Opiniones de la Comunidad</h2>
        <div className="contenedor-comentarios">
          {resenas.length === 0 && <p>Aún no hay opiniones de la comunidad.</p>}
          {resenas.map((r) => (
            <div className="bloque-comentario" key={r.id}>
              <div className="comentario-meta">
                <span className="nombre-usuario">{r.atleta}</span>
                <div className="estrellas-opinion" aria-label={`${r.calificacion} estrellas`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < r.calificacion ? "estrella-llena" : "estrella-vacia"}>★</span>
                  ))}
                </div>
              </div>
              <p className="comentario-texto">{r.comentario}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}