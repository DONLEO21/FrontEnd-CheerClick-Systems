import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, Sparkles } from "lucide-react";
import {
  listarHabilidades,
  guardarHabilidad as guardarHabilidadApi,
  cambiarEstadoHabilidad as cambiarEstadoApi,
} from "../../../services/rendimientoAdminService";
import ModalConfirmar from "../../../components/Compartidos/ModalConfirmar";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import EstadoError from "../../../components/Compartidos/EstadoError";
import useAviso from "../../../hooks/useAviso";
import { etiquetaTipoHabilidad } from "../../../components/utils/nivelEstilosHabilidad";
import TarjetaHabilidad from "./TarjetaHabilidad";
import ModalHabilidad from "./ModalHabilidad";
import { listarNivelesOpciones } from "../../../services/catalogos";
import Paginacion from "./Paginacion";
import "./GestionHabilidades.css";
import "./Habilidades.css";

const ESTADOS = [
  { id: "todas", texto: "Todas" },
  { id: "habilitadas", texto: "Habilitadas" },
  { id: "deshabilitadas", texto: "Deshabilitadas" },
];
const POR_PAGINA = 12;

/**
 * Gestión de habilidades: UN solo módulo para administrador y entrenador (prop `esEntrenador`).
 *  - Administrador: crea, edita, habilita y deshabilita.
 *  - Entrenador: ve y habilita/deshabilita (el backend solo le deja cambiar `estado`).
 * Filtro por nivel: las opciones salen de la API de niveles (se leen al abrir la vista, así reflejan los niveles que el
 *   administrador creó, editó o deshabilitó). El entrenador ve SOLO sus niveles (preseleccionado; bloqueado si es uno).
 * SUPUESTO: la habilidad tiene un `nivel` opcional (null = general, aparece en todos los niveles).
 * TODO(backend): la habilidad no guarda descripción.
 */
function GestionDeHabilidades({ esEntrenador = false, onVolver }) {
  const puedeCrear = !esEntrenador;

  const [habilidades, setHabilidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [niveles, setNiveles] = useState([]);          // [[id, nombre], …] (el backend ya limita los del entrenador)
  const [nivelId, setNivelId] = useState("");          // "" = todos los niveles
  const [nivelesListos, setNivelesListos] = useState(false);
  const [estado, setEstado] = useState("todas");
  const [pagina, setPagina] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [porCambiar, setPorCambiar] = useState(null); // habilidad pendiente de habilitar/deshabilitar
  const [procesando, setProcesando] = useState(false);
  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });

  // Niveles reales (sin datos quemados). El entrenador arranca en su primer nivel.
  useEffect(() => {
    let vivo = true;
    listarNivelesOpciones()
      .then((l) => {
        if (!vivo) return;
        setNiveles(l);
        if (esEntrenador && l.length > 0) setNivelId(l[0][0]);
      })
      .catch(() => vivo && setNiveles([]))
      .finally(() => vivo && setNivelesListos(true));
    return () => { vivo = false; };
  }, [esEntrenador]);

  const cargar = useCallback(() => {
    if (!nivelesListos) return;
    setCargando(true);
    setError("");
    // El filtro por nivel lo aplica el backend (?nivelId=)
    listarHabilidades({ nivelId: nivelId || undefined })
      .then(setHabilidades)
      .catch((e) => setError(e?.message || "No se pudieron cargar las habilidades."))
      .finally(() => setCargando(false));
  }, [nivelId, nivelesListos]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // ── resumen (datos reales) ──
  const habilitadas = habilidades.filter((h) => h.estado !== "inhabilitada");
  const categorias = useMemo(() => [...new Set(habilidades.map((h) => h.categoria).filter(Boolean))], [habilidades]);
  const resumen = [
    { id: "total", titulo: "Total", valor: habilidades.length, punto: "negro" },
    { id: "hab", titulo: "Habilitadas", valor: habilitadas.length, punto: "verde" },
    { id: "des", titulo: "Deshabilitadas", valor: habilidades.length - habilitadas.length, punto: "gris" },
    ...categorias.map((c) => ({
      id: c, titulo: etiquetaTipoHabilidad(c), valor: habilitadas.filter((h) => h.categoria === c).length, punto: c,
    })),
  ];

  // ── filtros ──
  const filtradas = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return habilidades.filter((h) => {
      if (texto && !`${h.texto} ${h.codigo ?? ""}`.toLowerCase().includes(texto)) return false;
      if (categoria && h.categoria !== categoria) return false;
      if (estado === "habilitadas" && h.estado === "inhabilitada") return false;
      if (estado === "deshabilitadas" && h.estado !== "inhabilitada") return false;
      return true;
    });
  }, [habilidades, busqueda, categoria, estado]);

  const visibles = filtradas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);
  const cambiarFiltro = (setter) => (valor) => { setter(valor); setPagina(1); };

  // ── acciones ──
  const abrirNueva = () => { setSeleccionada(null); setModalAbierto(true); };
  const abrirEditar = (h) => { setSeleccionada(h); setModalAbierto(true); };
  const cerrarModal = () => { setModalAbierto(false); setSeleccionada(null); };

  // devuelve la promesa: si falla, el modal muestra el mensaje y se queda abierto
  const guardar = (form) =>
    guardarHabilidadApi({ ...form, estado: form.id ? form.estado || "activa" : "activa" }).then(() => {
      cargar();
      cerrarModal();
      mostrarAviso(form.id ? `Habilidad ${seleccionada?.codigo || ""} actualizada.`.replace("  ", " ") : "Habilidad creada.", "ok");
    });

  const confirmarCambioEstado = async () => {
    if (!porCambiar) return;
    const deshabilitar = porCambiar.estado !== "inhabilitada";
    setProcesando(true);
    try {
      // TODO(backend): no existe DELETE de habilidades; se deshabilita con PATCH { estado: 'Inactivo' }
      await cambiarEstadoApi(porCambiar, deshabilitar ? "inhabilitada" : "activa");
      cargar();
      mostrarAviso(deshabilitar ? "La habilidad quedó deshabilitada." : "La habilidad volvió a estar activa.", "ok");
      setPorCambiar(null);
    } catch (e) {
      mostrarAviso(e?.message || "No se pudo cambiar el estado de la habilidad.", "error");
    } finally {
      setProcesando(false);
    }
  };

  const deshabilitando = porCambiar && porCambiar.estado !== "inhabilitada";

  return (
    <div className="ui-contenido ui-ancho-total ui-pagina adm-hab">
      {/* 4.1 Encabezado */}
      <header className="adm-hab__encabezado">
        <div>
          {onVolver && (
            <button type="button" className="adm-hab__volver" onClick={() => onVolver()}>
              <ArrowLeft size={15} /> Volver a Rendimiento
            </button>
          )}
          <h3 className="adm-hab__titulo">Gestión de habilidades</h3>
          <p className="adm-hab__sub">
            {puedeCrear
              ? "Registra, edita y deshabilita las habilidades del sistema de evaluación."
              : "Consulta las habilidades del sistema de evaluación y habilítalas o deshabilítalas."}
          </p>
        </div>
        {puedeCrear && (
          <button type="button" className="adm-hab__nueva" onClick={abrirNueva}>
            <Plus size={17} /> Nueva habilidad
          </button>
        )}
      </header>

      {/* 4.2 Resumen */}
      <section className="ui-tarjetas adm-hab__resumen" aria-label="Resumen de habilidades">
        {resumen.map((r) => (
          <div className="adm-hab-resumen" key={r.id}>
            <span className={`adm-hab-punto adm-hab-punto--${r.punto}`} aria-hidden="true" />
            <strong>{cargando ? "—" : r.valor}</strong>
            <span>{r.titulo}</span>
          </div>
        ))}
      </section>

      {/* 4.3 Herramientas: buscador, categoría y estado (.ui-tabs) */}
      <div className="adm-hab__herramientas">
        <label className="adm-hab__buscar">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Buscar por nombre o código…"
            value={busqueda}
            onChange={(e) => cambiarFiltro(setBusqueda)(e.target.value)}
          />
        </label>

        <select
          className="adm-hab__select select form-select"
          value={nivelId}
          onChange={(e) => { setNivelId(e.target.value); setPagina(1); }}
          disabled={esEntrenador && niveles.length <= 1}
          aria-label="Filtrar por nivel"
        >
          {!esEntrenador && <option value="">Todos los niveles</option>}
          {niveles.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
        </select>

        <select
          className="adm-hab__select select form-select"
          value={categoria}
          onChange={(e) => cambiarFiltro(setCategoria)(e.target.value)}
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => <option key={c} value={c}>{etiquetaTipoHabilidad(c)}</option>)}
        </select>
      </div>

      <div className="ui-tabs" role="tablist" aria-label="Estado de la habilidad">
        {ESTADOS.map((e) => (
          <button
            key={e.id}
            type="button"
            role="tab"
            aria-selected={estado === e.id}
            className={`ui-tab${estado === e.id ? " ui-tab--activa" : ""}`}
            onClick={() => cambiarFiltro(setEstado)(e.id)}
          >
            {e.texto}
          </button>
        ))}
      </div>

      {/* 4.4 Contenido */}
      {error ? (
        <EstadoError mensaje={error} onReintentar={cargar} />
      ) : cargando ? (
        <div className="adm-hab__grid" aria-busy="true" aria-label="Cargando habilidades">
          {Array.from({ length: 6 }, (_, i) => <div key={i} className="adm-hab-skeleton" />)}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="adm-hab__vacio" role="status">
          <Sparkles size={36} strokeWidth={1.6} aria-hidden="true" />
          <p>
            {nivelId && habilidades.length === 0
              ? "No hay habilidades para este nivel"
              : habilidades.length === 0 ? "Aún no hay habilidades registradas." : "Ninguna habilidad coincide con los filtros."}
          </p>
          {habilidades.length === 0 && puedeCrear && !nivelId && <small>Crea la primera con «Nueva habilidad».</small>}
        </div>
      ) : (
        <>
          <div className="adm-hab__grid">
            {visibles.map((h) => (
              <TarjetaHabilidad
                key={h.id}
                habilidad={h}
                puedeEditar={puedeCrear}
                onEditar={abrirEditar}
                onCambiarEstado={setPorCambiar}
              />
            ))}
          </div>
          <Paginacion
            paginaActual={pagina}
            setPaginaActual={setPagina}
            totalItems={filtradas.length}
            itemsPorPagina={POR_PAGINA}
            etiqueta="habilidades"
          />
        </>
      )}

      {/* 4.5 Modales */}
      {modalAbierto && <ModalHabilidad habilidad={seleccionada} niveles={niveles} onCerrar={cerrarModal} onGuardar={guardar} />}

      <ModalConfirmar
        abierto={!!porCambiar}
        titulo={deshabilitando ? "¿Deshabilitar habilidad?" : "¿Habilitar habilidad?"}
        mensaje={
          deshabilitando
            ? `¿Desea deshabilitar la habilidad "${porCambiar?.texto ?? ""}"? Dejará de evaluarse, pero podrá habilitarla de nuevo cuando quiera.`
            : `¿Desea habilitar la habilidad "${porCambiar?.texto ?? ""}"? Volverá a evaluarse a los atletas.`
        }
        tipo={deshabilitando ? "peligro" : "ok"}
        textoConfirmar={deshabilitando ? "Sí, deshabilitar" : "Sí, habilitar"}
        cargando={procesando}
        onConfirmar={confirmarCambioEstado}
        onCancelar={() => setPorCambiar(null)}
      />

      <AvisoToast aviso={aviso} />
    </div>
  );
}

export default GestionDeHabilidades;
