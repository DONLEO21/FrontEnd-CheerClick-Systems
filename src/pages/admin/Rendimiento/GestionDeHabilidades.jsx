import { useEffect, useState } from "react";
import { listarHabilidades, guardarHabilidad as guardarHabilidadApi, cambiarEstadoHabilidad as cambiarEstadoApi, eliminarHabilidad as eliminarHabilidadApi } from "../../../services/rendimientoAdminService";
import ModalConfirmar from "../../../components/Compartidos/ModalConfirmar";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";
import TargetasEstadoHabilidad from "./TargetasEstadoHabilidad";
import FiltrosHabilidades from "./FiltrosHabilidades";
import TablaHabilidades from "./TablaHabilidades";
import Paginacion from "./Paginacion";
import ModalHabilidad from "./ModalHabilidad";
import "./GestionHabilidades.css";




function GestionDeHabilidades() {
  const [habilidades, setHabilidades] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [nivelSeleccionado, setNivelSeleccionado] = useState("");
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [habilidadSeleccionada, setHabilidadSeleccionada] = useState(null);
  const [porDeshabilitar, setPorDeshabilitar] = useState(null); // habilidad pendiente de confirmar
  const [procesando, setProcesando] = useState(false);
  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });

  const itemsPorPagina = 6;

  // ── Cargar habilidades ──────────────────────────────
  const cargarHabilidades = () => {
    listarHabilidades()
      .then((datos) => setHabilidades(datos))
      .catch((error) => {
        console.error("Error al cargar habilidades", error);
        setHabilidades([]);
      });
  };

  useEffect(() => {
    cargarHabilidades();
  }, []);

  // ── Filtros ──────────────────────────────────────────
  const handleBusquedaChange = (texto) => {
    setBusqueda(texto);
    setPaginaActual(1);
  };

  const handleNivelChange = (nivel) => {
    setNivelSeleccionado(nivel);
    setPaginaActual(1);
  };

  const handleTipoChange = (tipo) => {
    setTipoSeleccionado(tipo);
    setPaginaActual(1);
  };

  const habilidadesFiltradas = habilidades.filter((h) => {
    const coincideTexto = h.texto
      ?.toLowerCase()
      .includes(busqueda.toLowerCase().trim());

    const coincideNivel =
      nivelSeleccionado === "" ||
      h.nivel?.toLowerCase().trim() === nivelSeleccionado.toLowerCase().trim();

    const coincideTipo =
      tipoSeleccionado === ""
        ? true
        : tipoSeleccionado === "inhabilitada"
        ? h.estado === "inhabilitada"
        : h.categoria === tipoSeleccionado && h.estado !== "inhabilitada";

    return coincideTexto && coincideNivel && coincideTipo;
  });

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina;
  const habilidadesPaginadas = habilidadesFiltradas.slice(inicio, fin);

  const abrirModalNueva = () => {
    setHabilidadSeleccionada(null);
    setModalAbierto(true);
  };

  const abrirModalEditar = (habilidad) => {
    setHabilidadSeleccionada(habilidad);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setHabilidadSeleccionada(null);
  };

  const guardarHabilidad = (form) => {
    const esEdicion = Boolean(form.id);

    // devuelve la promesa: si falla, el modal muestra el mensaje y se queda abierto
    return guardarHabilidadApi({ ...form, estado: esEdicion ? form.estado || "activa" : "activa" })
      .then(() => {
        cargarHabilidades();
        cerrarModal();
      });
  };

  // Deshabilitar (antes "eliminar"): la habilidad se conserva y se puede volver a habilitar.
  // TODO(backend): no existe DELETE de habilidades; se deshabilita con PATCH { estado: 'Inactivo' }.
  const confirmarDeshabilitar = async () => {
    if (!porDeshabilitar) return;
    setProcesando(true);
    try {
      await eliminarHabilidadApi(porDeshabilitar);
      cargarHabilidades();
      mostrarAviso("La habilidad quedó deshabilitada.", "ok");
      setPorDeshabilitar(null);
    } catch (error) {
      console.error(error);
      mostrarAviso(error.message || "No se pudo deshabilitar la habilidad.", "error");
    } finally {
      setProcesando(false);
    }
  };

  const cambiarEstadoHabilidad = (habilidad) => {
    // activa → pide confirmación para deshabilitar; deshabilitada → se habilita directamente
    if (habilidad.estado !== "inhabilitada") return setPorDeshabilitar(habilidad);

    cambiarEstadoApi(habilidad, "activa")
      .then(() => {
        cargarHabilidades();
        mostrarAviso("La habilidad volvió a estar activa.", "ok");
      })
      .catch((error) => {
        console.error(error);
        mostrarAviso(error.message || "No se pudo habilitar la habilidad.", "error");
      });
  };

  return (
    <div className="ui-contenido ui-ancho-total ui-pagina">
      <aside className="adm-rendimiento-titu-ren ui-pagina__titulo">
        <h3>Gestión de Habilidades</h3>
        <p>Registra, edita y deshabilita habilidades del sistema de evaluación</p>
      </aside>

      <TargetasEstadoHabilidad habilidades={habilidades} />

      <FiltrosHabilidades
        busqueda={busqueda}
        setBusqueda={handleBusquedaChange}
        nivelSeleccionado={nivelSeleccionado}
        setNivelSeleccionado={handleNivelChange}
        tipoSeleccionado={tipoSeleccionado}
        setTipoSeleccionado={handleTipoChange}
        onNuevaHabilidad={abrirModalNueva}
      />

      <TablaHabilidades
        habilidades={habilidadesPaginadas}
        onEditar={abrirModalEditar}
        onCambiarEstado={cambiarEstadoHabilidad}
      />

      <Paginacion
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalItems={habilidadesFiltradas.length}
        itemsPorPagina={itemsPorPagina}
        etiqueta="habilidades"
      />

      {modalAbierto && (
        <ModalHabilidad
          habilidad={habilidadSeleccionada}
          onCerrar={cerrarModal}
          onGuardar={guardarHabilidad}
        />
      )}

      <ModalConfirmar
        abierto={!!porDeshabilitar}
        titulo="¿Deshabilitar habilidad?"
        mensaje={`¿Desea deshabilitar la habilidad "${porDeshabilitar?.texto ?? ""}"? Dejará de evaluarse, pero podrá habilitarla de nuevo cuando quiera.`}
        tipo="peligro"
        textoConfirmar="Sí, deshabilitar"
        cargando={procesando}
        onConfirmar={confirmarDeshabilitar}
        onCancelar={() => setPorDeshabilitar(null)}
      />

      <AvisoToast aviso={aviso} />
    </div>
  );
}

export default GestionDeHabilidades;