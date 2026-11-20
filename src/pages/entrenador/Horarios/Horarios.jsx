
import "./Horarios.css";
import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";

import CalendarioMes from "./CalendarioMes";
import TarjetaDia from "./TarjetaDia";
import TarjetaTipos from "./TarjetaTipos";
import ResumenMes from "./ResumenMes";
import ModalSesion from "./ModalSesion";
import SelectorNivel from "./SelectorNivel";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";
import { listarNiveles, listarSesiones, guardarSesion as guardarSesionApi } from "../../../services/horariosService";

import {
  TIPOS_BASE,
  todosLosDiasDelNivel,
  esDiaEntrenamiento,
  claveFecha,
  etiquetaFechaLarga,
  contarDiasEntrenamiento,
  sesionPorDefecto,
} from "./calendarioData";

function HorariosEntrenadorContenido({ esAdmin: esAdminProp }) {
  const { pathname } = useLocation();
  const esAdmin = esAdminProp ?? pathname.toLowerCase().startsWith("/admin");

  const [niveles, setNiveles] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [nivelActivoId, setNivelActivoId] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setNivelActivoId(null);

    Promise.all([
      listarNiveles(),
      listarSesiones(),
    ])
      .then(([n, s]) => {
        if (!activo) return;
        // El backend ya devuelve solo los niveles del entrenador (el administrador ve todos)
        setNiveles(n);
        setSesiones(s);
      })
      .catch((err) => activo && setError(err))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [esAdmin]);

  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });
  const avisoErrorApi = (err) =>
    mostrarAviso(err?.message || "No se pudo completar la acción. Inténtalo de nuevo.", "error");

  useEffect(() => {
    if (!niveles.length || nivelActivoId !== null) return;
    setNivelActivoId(niveles[0].id);
  }, [niveles, nivelActivoId]);

  const nivelActivo = useMemo(
    () => niveles.find((n) => String(n.id) === String(nivelActivoId)) || null,
    [niveles, nivelActivoId]
  );

  const diasEntrenamiento = useMemo(
    () => todosLosDiasDelNivel(nivelActivo),
    [nivelActivo]
  );

  const hoy = new Date();
  const [anio, setAnio] = useState(hoy.getFullYear());
  const [mes, setMes] = useState(hoy.getMonth());
  const [dia, setDia] = useState(hoy.getDate());

  const fechaActiva = claveFecha(anio, mes, dia);

  const sesionesDelNivel = useMemo(
    () => sesiones.filter((s) => String(s.nivelId) === String(nivelActivoId)),
    [sesiones, nivelActivoId]
  );
  const sesionGuardada = sesionesDelNivel.find((s) => s.fecha === fechaActiva);
  const numeroDiaSemana = new Date(anio, mes, dia).getDay();
  const sesionActiva =
    sesionGuardada || sesionPorDefecto(nivelActivo, fechaActiva, numeroDiaSemana);

  const hayEntrenamiento =
    !!nivelActivo && esDiaEntrenamiento(anio, mes, dia, diasEntrenamiento);


  const [tiposPersonalizados, setTiposPersonalizados] = useState([]);
  const [tiposSeleccionados, setTiposSeleccionados] = useState([]);
  const [guardadoOk, setGuardadoOk] = useState(false);

  useEffect(() => {
    setTiposSeleccionados(sesionGuardada?.tipos || []);
    setGuardadoOk(false);
  }, [fechaActiva, nivelActivoId, sesionGuardada?.id]);

  const tiposDisponibles = useMemo(() => {
    const extras = tiposPersonalizados.filter((t) => !TIPOS_BASE.includes(t));
    return [...TIPOS_BASE, ...extras];
  }, [tiposPersonalizados]);

  const alternarTipo = (tipo) => {
    setTiposSeleccionados((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const agregarTipoPersonalizado = (tipo) => {
    if (tiposDisponibles.includes(tipo)) {
      return mostrarAviso("Ese tipo ya existe.", "advertencia");
    }
    setTiposPersonalizados((prev) => [...prev, tipo]);
    setTiposSeleccionados((prev) => [...prev, tipo]);
  };


  const persistirSesion = (cambios) =>
    guardarSesionApi(
      sesionGuardada,
      cambios,
      sesionPorDefecto(nivelActivo, fechaActiva, numeroDiaSemana)
    ).then((guardada) => {
      setSesiones((prev) =>
        sesionGuardada
          ? prev.map((s) => (s.id === sesionGuardada.id ? guardada : s))
          : [...prev, guardada]
      );
      return guardada;
    });

  const guardarTipos = () => {
    if (!hayEntrenamiento) return;
    persistirSesion({ tipos: tiposSeleccionados })
      .then(() => {
        setGuardadoOk(true);
        mostrarAviso("Tipos de entrenamiento guardados.", "ok");
        setTimeout(() => setGuardadoOk(false), 2000);
      })
      .catch(avisoErrorApi);
  };

  const marcarAsistencia = () => {
    persistirSesion({ asistenciaMarcada: !sesionActiva.asistenciaMarcada })
      .then((s) => {
        mostrarAviso(
          s.asistenciaMarcada ? "Asistencia marcada." : "Asistencia desmarcada.",
          "ok"
        );
      })
      .catch(avisoErrorApi);
  };

  const [modalAbierto, setModalAbierto] = useState(false);
  const [formSesion, setFormSesion] = useState(sesionPorDefecto(null, ""));

  const abrirModal = () => {
    setFormSesion({ ...sesionActiva });
    setModalAbierto(true);
  };

  const guardarSesion = () => {
    const { horaInicio, horaFin } = formSesion;
    if (!horaInicio || !horaFin) {
      return mostrarAviso("Ingresa las horas de inicio y fin.", "error");
    }
    if (horaInicio >= horaFin) {
      return mostrarAviso("La hora de fin debe ser mayor a la de inicio.", "error");
    }

    persistirSesion({
      horaInicio,
      horaFin,
      enfoque: formSesion.enfoque.trim(),
      lugar: formSesion.lugar.trim(),
      notas: formSesion.notas.trim(),
      estado: formSesion.estado,
    })
      .then(() => {
        mostrarAviso("Sesión actualizada correctamente.", "ok");
        setModalAbierto(false);
      })
      .catch(avisoErrorApi);
  };

  const mesAnterior = () => {
    if (mes === 0) {
      setMes(11);
      setAnio((a) => a - 1);
    } else {
      setMes((m) => m - 1);
    }
    setDia(1);
  };

  const mesSiguiente = () => {
    if (mes === 11) {
      setMes(0);
      setAnio((a) => a + 1);
    } else {
      setMes((m) => m + 1);
    }
    setDia(1);
  };

  const totales = useMemo(() => {
    const totalSesiones = contarDiasEntrenamiento(anio, mes, diasEntrenamiento);
    const prefijoMes = `${anio}-${String(mes + 1).padStart(2, "0")}`;
    const delMes = sesionesDelNivel.filter((s) => s.fecha.startsWith(prefijoMes));

    const asistidas = delMes.filter((s) => s.asistenciaMarcada).length;
    const canceladas = delMes.filter((s) => s.estado !== "activa").length;
    const faltadas = Math.max(0, totalSesiones - asistidas - canceladas);
    const porcentaje = totalSesiones ? Math.round((asistidas / totalSesiones) * 100) : 0;

    return { sesiones: totalSesiones, asistidas, faltadas, tardes: 0, porcentaje };
  }, [anio, mes, diasEntrenamiento, sesionesDelNivel]);


  if (cargando) {
    return (
      <main className="ui-contenido container-fluid py-5 text-center text-secondary">
        <div className="spinner-border text-danger mb-3" role="status" />
        <p>Cargando calendario…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="ui-contenido container-fluid py-5 text-center text-danger">
        <p className="fw-semibold mb-2">No se pudo conectar con la API.</p>
        <p className="text-secondary small mb-0">
          Inténtalo de nuevo en unos minutos.
        </p>
      </main>
    );
  }

  if (!esAdmin && niveles.length === 0) {
    return (
      <main className="ui-contenido container-fluid py-5 text-center text-secondary">
        <i className="bi bi-exclamation-circle" style={{ fontSize: "2rem" }} />
        <p className="fw-semibold mt-2 mb-1">No tienes un nivel asignado.</p>
        <p className="small mb-0">Pídele al administrador que te asigne un nivel.</p>
      </main>
    );
  }

  return (
    <main className="ui-contenido">
      {/* Encabezado */}
      <div className="encabezado-calendario">
        <div className="contenedor-titulos">
          <h2 className="titulo-pagina">Calendario de Entrenamientos</h2>
          <p className="subtitulo-horario">
            {esAdmin
              ? "Gestione los horarios de entrenamiento de todos los niveles"
              : "Gestione los horarios de entrenamiento de su nivel"}
          </p>
        </div>

        <div className="d-flex align-items-center gap-3 flex-wrap">
          {/* Solo el admin puede cambiar de nivel; el entrenador ve el suyo fijo */}
          {esAdmin && niveles.length > 0 && (
            <SelectorNivel
              niveles={niveles}
              nivelActivoId={nivelActivoId}
              onCambiar={setNivelActivoId}
            />
          )}
          {!esAdmin && nivelActivo && (
            <div className="selector-nivel">
              <span className="etiqueta-selector-nivel">Tu nivel:</span>
              <span className="nivel-asignado">{nivelActivo.categoria}</span>
            </div>
          )}

          <div
            className={`asistencia-badge ${
              sesionActiva.asistenciaMarcada ? "registrada" : "pendiente"
            }`}
          >
            <i className={`bi ${sesionActiva.asistenciaMarcada ? "bi-check-circle" : "bi-clock"}`} />
            <div className="texto-insignia">
              <small>Asistencia del día:</small>
              <strong>{sesionActiva.asistenciaMarcada ? "Registrada" : "Pendiente"}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="disposicion-calendario">
        <div className="panel-izquierdo">
          <TarjetaDia
            anio={anio}
            mes={mes}
            dia={dia}
            sesion={sesionActiva}
            hayEntrenamiento={hayEntrenamiento}
            diasEntrenamiento={diasEntrenamiento}
            onMarcarAsistencia={marcarAsistencia}
            onEditarSesion={abrirModal}
          />

          <TarjetaTipos
            nivel={nivelActivo}
            tiposSeleccionados={tiposSeleccionados}
            tiposDisponibles={tiposDisponibles}
            deshabilitado={!hayEntrenamiento}
            onAlternarTipo={alternarTipo}
            onAgregarTipo={agregarTipoPersonalizado}
            onGuardar={guardarTipos}
            guardadoOk={guardadoOk}
          />
        </div>

        <div className="panel-derecho">
          <CalendarioMes
            anio={anio}
            mes={mes}
            diaSeleccionado={dia}
            diasEntrenamiento={diasEntrenamiento}
            sesiones={sesionesDelNivel}
            onSeleccionarDia={setDia}
            onMesAnterior={mesAnterior}
            onMesSiguiente={mesSiguiente}
          />

          <ResumenMes anio={anio} mes={mes} totales={totales} />
        </div>
      </div>

      <ModalSesion
        abierto={modalAbierto}
        subtitulo={etiquetaFechaLarga(anio, mes, dia)}
        form={formSesion}
        setForm={setFormSesion}
        onCerrar={() => setModalAbierto(false)}
        onGuardar={guardarSesion}
      />

      <AvisoToast aviso={aviso} />
    </main>
  );
}

// Clase raíz del módulo: todos sus estilos viven bajo .ent-horarios
export default function HorariosEntrenador(props) {
  return (
    <div className="ent-horarios">
      <HorariosEntrenadorContenido {...props} />
    </div>
  );
}
