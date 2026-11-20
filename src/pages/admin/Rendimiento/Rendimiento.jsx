import "./Rendimiento.css";
import { listarNivelesOpciones } from "../../../services/catalogos";
import { listarAtletas, listarAtletasEntrenador, listarProgresoTodos, listarHabilidades, guardarProgresoAtleta } from "../../../services/rendimientoAdminService";
import Filtros from "./Filtros";
import TargetaEstado from "./TargetaEstado";
import { useEffect, useMemo, useState } from 'react';
import ModalConfirmar from "../../../components/Compartidos/ModalConfirmar";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";
import TablaAtletas from "./TablaAtletas";
import Paginacion from "./Paginacion";
import ConsultarRendimiento from "./ConsultarRendimiento";
import EditarRendimiento from "./EditarRendimiento";
import RegistrarRendimiento from "./RegistrarRendimiento";
import GestionDeHabilidades from "./GestionDeHabilidades"; 
import TituloRen from "./TituloRen";
import RendimientoPorNivel from "./RendimientoPorNivel";


// esEntrenador: el entrenador solo ve los atletas de sus niveles
function RendimientoContenido({ esEntrenador = false }) {
  const [atletas, setAtletas] = useState([]);
  const [progreso, setProgreso] = useState([]);
  const [totalHabilidades, setTotalHabilidades] = useState(1);
  const [habilidadesActivas, setHabilidadesActivas] = useState(0); // conteo real (totalHabilidades nunca baja de 1 para dividir)
  const [cargando, setCargando] = useState(true);
  const [porReiniciar, setPorReiniciar] = useState(null); // atleta pendiente de confirmar el reinicio
  const [reiniciando, setReiniciando] = useState(false);
  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });
  const [busqueda, setBusqueda] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [nivelSeleccionado, setNivelSeleccionado] = useState("");
  const [niveles, setNiveles] = useState([]); // niveles reales (para el filtro)

  const itemsPorPagina = 6; 

  const cargarDatos = () => {
    Promise.all([esEntrenador ? listarAtletasEntrenador() : listarAtletas(), listarProgresoTodos(), listarHabilidades()])
      .then(([datosAtletas, datosProgreso, datosHabilidades]) => {
        setAtletas(datosAtletas);
        setProgreso(datosProgreso);
        const activas = datosHabilidades.filter((h) => h.estado === "activa").length;
        setTotalHabilidades(activas || 1);
        setHabilidadesActivas(activas);
      })
      .catch((error) => {
        console.error("Error al cargar atletas/rendimiento", error);
        setAtletas([]);
        setProgreso([]);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarDatos();
    listarNivelesOpciones().then((l) => setNiveles(l.map(([, nombre]) => nombre))).catch(() => setNiveles([]));
  }, []);

  // ── Rendimiento calculado dinámicamente a partir de progresoHabilidades ──
  const atletasConRendimiento = useMemo(() => {
    return atletas.map((atleta) => {
      const completadas = progreso.filter(
        (p) => p.atletaId === atleta.id && p.completado
      ).length;
      const rendimiento = Math.round((completadas / totalHabilidades) * 100);
      return { ...atleta, rendimiento };
    });
  }, [atletas, progreso, totalHabilidades]);

  // Tarjetas de resumen con datos reales (antes eran textos fijos vacíos)
  const targetasEstado = useMemo(() => {
    const total = atletasConRendimiento.length;
    const promedio = total ? Math.round(atletasConRendimiento.reduce((s, a) => s + a.rendimiento, 0) / total) : 0;
    const edades = atletasConRendimiento.map((a) => Number(a.edad)).filter((e) => e > 0);
    const promEdad = edades.length ? Math.round(edades.reduce((s, e) => s + e, 0) / edades.length) : null;
    return [
      { id: 1, titulo: "Total de atletas", dato: String(total), texto: "atletas registrados" },
      // TODO(backend): la edad vive en el perfil del atleta y la lista de usuarios no la trae.
      { id: 2, titulo: "Promedio de edad", dato: promEdad ? String(promEdad) : "—", texto: promEdad ? "años" : "sin datos de edad" },
      { id: 3, titulo: "Rendimiento", dato: promedio + "%", texto: "promedio de habilidades logradas" },
      { id: 4, titulo: "Habilidades activas", dato: String(habilidadesActivas), texto: "en el sistema de evaluación" },
    ];
  }, [atletasConRendimiento, habilidadesActivas]);

  // Rendimiento promedio por nivel (calculado con los mismos datos reales de la tabla)
  const rendimientoPorNivel = useMemo(() => {
    const grupos = new Map();
    atletasConRendimiento.forEach((a) => {
      const nivel = a.nivel || "Sin nivel";
      const g = grupos.get(nivel) ?? { nivel, atletas: 0, suma: 0 };
      g.atletas += 1;
      g.suma += a.rendimiento;
      grupos.set(nivel, g);
    });
    return [...grupos.values()]
      .map((g) => ({ nivel: g.nivel, atletas: g.atletas, promedio: Math.round(g.suma / g.atletas) }))
      .sort((x, y) => y.promedio - x.promedio);
  }, [atletasConRendimiento]);

  const handleBusquedaChange = (texto) => {
    setBusqueda(texto);
    setPaginaActual(1); 
  };

  const handleNivelChange = (nivel) => {
    setNivelSeleccionado(nivel);
    setPaginaActual(1);
  };

  const usuariosFiltrados = atletasConRendimiento.filter((atleta) => {
    const coincideNombre = atleta.nombre
      ?.toLowerCase()
      .includes(busqueda.toLowerCase().trim());

    const coincideNivel =
      nivelSeleccionado === "" ||
      atleta.nivel?.toLowerCase().trim() === nivelSeleccionado.toLowerCase().trim();

    return coincideNombre && coincideNivel;
  });

  const inicio = (paginaActual - 1) * itemsPorPagina;
  const fin = inicio + itemsPorPagina; 
  const atletasPaginados = usuariosFiltrados.slice(inicio, fin);

  {/* VISTAS DE ACUERDO CON DONDE SE DE CLICK */}
  const [vista, setVista] = useState("tabla"); 
  const [atletaSeleccionado, setAtletaSeleccionado] = useState(null);

  const handleVerAtleta = (atleta) => {
    setAtletaSeleccionado(atleta);
    setVista("consultar");
  };

  // mensaje (opcional): aviso que la vista hija pide mostrar al volver
  const handleVolver = (mensaje) => {
    if (typeof mensaje === "string" && mensaje) mostrarAviso(mensaje, "ok");
    setAtletaSeleccionado(null);
    setVista("tabla");
    cargarDatos(); // refresca por si el rendimiento cambió en otra vista
  };

  const handleEditarAtleta = (atleta) => {
    setAtletaSeleccionado(atleta);
    setVista("editar");
  };

  const handleRegistrarAtleta = (atleta) => {
    setAtletaSeleccionado(atleta);
    setVista("registrar");
  };

  const handleGestionarHabilidades = (atleta) => {
    setAtletaSeleccionado(atleta);
    setVista("habilidades");
  };

  // ── Botón de papelera: resetea el rendimiento del atleta a 0% (pide confirmación) ──
  const confirmarReinicio = async () => {
    const atleta = porReiniciar;
    if (!atleta) return;
    setReiniciando(true);
    try {
      const entradasDelAtleta = progreso.filter((p) => p.atletaId === atleta.id);
      await guardarProgresoAtleta(atleta.id, {
        cambios: entradasDelAtleta.filter((e) => e.completado).map((e) => ({ habilidadId: e.habilidadId, completado: false })),
      });
      // Actualiza el estado local sin necesidad de recargar todo desde el servidor
      setProgreso((prev) => prev.map((p) => (p.atletaId === atleta.id ? { ...p, completado: false } : p)));
      mostrarAviso(`${atleta.nombre} quedó en 0%.`, "ok");
      setPorReiniciar(null);
    } catch (error) {
      console.error(error);
      mostrarAviso(error.message || "No se pudo reiniciar el rendimiento.", "error");
    } finally {
      setReiniciando(false);
    }
  };

  return (
    <div className={vista === "tabla" ? "conteni ui-contenido ui-pagina" : "conteni"}>

      {vista === "tabla" ? (
        <>

        <TituloRen/>
          <section className="ui-tarjetas" id="targetasEstado">
            {targetasEstado.map((item) => (
              <TargetaEstado key={item.id} {...item} />
            ))}
          </section>

          <RendimientoPorNivel datos={rendimientoPorNivel} />

          <Filtros 
            busqueda={busqueda} 
            setBusqueda={handleBusquedaChange} 
            nivelSeleccionado={nivelSeleccionado}
            setNivelSeleccionado={handleNivelChange}
            onGestionarHabilidades={handleGestionarHabilidades}
            niveles={niveles}
          />
          
          <TablaAtletas 
            atletas={atletasPaginados} 
            cargando={cargando}
            onVerAtleta={handleVerAtleta} 
            onEditarAtleta={handleEditarAtleta}
            onRegistrarAtleta={handleRegistrarAtleta}
            onGestionarHabilidades={handleGestionarHabilidades}
            onEliminarAtleta={setPorReiniciar}
          />

          <Paginacion
            paginaActual={paginaActual}
            setPaginaActual={setPaginaActual}
            totalItems={usuariosFiltrados.length}
            itemsPorPagina={itemsPorPagina}
          />
        </>
      ) : vista === "consultar" ? (
        <ConsultarRendimiento 
          atleta={atletaSeleccionado} onVolver={handleVolver} 
        />
      ) : vista === "editar" ? (
        <EditarRendimiento 
          atleta={atletaSeleccionado} onVolver={handleVolver} onAviso={mostrarAviso}
        />
      ) : vista === "registrar" ? (
        <RegistrarRendimiento atleta={atletaSeleccionado} onVolver={handleVolver} onAviso={mostrarAviso} />
      ) : vista === "habilidades" ? (
        <GestionDeHabilidades atleta={atletaSeleccionado} onVolver={handleVolver} />
      ) : null}

      <ModalConfirmar
        abierto={!!porReiniciar}
        titulo="¿Reiniciar rendimiento?"
        mensaje={`El rendimiento de ${porReiniciar?.nombre ?? ""} quedará en 0% (se desmarcarán todas sus habilidades completadas). Esta acción no se puede deshacer.`}
        tipo="peligro"
        textoConfirmar="Sí, reiniciar"
        cargando={reiniciando}
        onConfirmar={confirmarReinicio}
        onCancelar={() => setPorReiniciar(null)}
      />

      <AvisoToast aviso={aviso} />
    </div>
  );
}

// Clase raíz del módulo: todos sus estilos viven bajo .adm-rendimiento
export default function Rendimiento(props) {
  return (
    <div className="adm-rendimiento">
      <RendimientoContenido {...props} />
    </div>
  );
}