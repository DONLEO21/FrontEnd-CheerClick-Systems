import { useCallback, useEffect, useMemo, useState } from "react";
import JustificacionCard from "./JustificacionCard";
import EstadoError from "../../../components/Compartidos/EstadoError";
import ModalConfirmar from "../../../components/Compartidos/ModalConfirmar";
import ModalAviso from "../../../components/Compartidos/ModalAviso";
import TextareaContador from "../../../components/Compartidos/TextareaContador";
import {
  obtenerJustificaciones,
  actualizarJustificacion,
  abrirSoporte,
  contarPorEstado,
} from "../../../services/justificacionesService";
import { fechaHoyISO } from "../../../services/data";

// Estados de la vista, MUTUAMENTE EXCLUYENTES: cargando (esqueleto) -> error (mensaje + Reintentar, sin pestañas ni
// contadores) -> vacío -> lista. Los contadores solo existen cuando los datos cargaron bien.
export default function JustificacionesPanel({ niveles = [], onCambio }) {
  const [justificaciones, setJustificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [nivelSel, setNivelSel] = useState(niveles[0] ? String(niveles[0].id) : "");
  const [accionActiva, setAccionActiva] = useState(null); // { justificacion, tipo: 'aprobar' | 'rechazar' }
  const [observacion, setObservacion] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null); // aviso compacto { tipo, titulo, mensaje }

  const nivelIds = useMemo(() => niveles.map((n) => String(n.id)), [niveles]);
  const claveNiveles = nivelIds.join(",");
  // Si el nivel elegido ya no existe (o aún no había ninguno), se toma el primero
  const nivelActivo = nivelIds.includes(nivelSel) ? nivelSel : nivelIds[0] ?? "";

  const cargarDatos = useCallback(() => {
    setCargando(true);
    setError("");
    obtenerJustificaciones()
      .then((lista) => setJustificaciones(lista.filter((j) => nivelIds.includes(String(j.nivelId)))))
      .catch((e) => {
        setJustificaciones([]);
        setError(e?.message || "No se han podido cargar las justificaciones.");
      })
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nivelIds cambia solo cuando cambia claveNiveles
  }, [claveNiveles]);

  useEffect(() => {
    if (nivelIds.length === 0) {
      setCargando(false);
      return;
    }
    cargarDatos();
  }, [cargarDatos, nivelIds.length]);

  const nivelPorId = useMemo(() => new Map(niveles.map((n) => [String(n.id), n])), [niveles]);

  const delNivel = useMemo(
    () => justificaciones.filter((j) => String(j.nivelId) === nivelActivo),
    [justificaciones, nivelActivo]
  );
  const conteos = useMemo(() => contarPorEstado(delNivel), [delNivel]);
  const pendientesPorNivel = useMemo(() => {
    const m = new Map();
    for (const j of justificaciones) if (j.estado === "pendiente") m.set(String(j.nivelId), (m.get(String(j.nivelId)) ?? 0) + 1);
    return m;
  }, [justificaciones]);

  const filtradas = useMemo(
    () =>
      delNivel
        .filter((j) => (filtroEstado === "todas" ? true : j.estado === filtroEstado))
        .sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [delNivel, filtroEstado]
  );

  const abrirAccion = (justificacion, tipo) => {
    setObservacion("");
    setErrorAccion("");
    setAccionActiva({ justificacion, tipo });
  };

  const confirmarAccion = async () => {
    if (!accionActiva) return;
    const { justificacion, tipo } = accionActiva;
    const texto = observacion.trim();
    // Rechazar exige un motivo (el atleta lo ve en su lista)
    if (tipo === "rechazar" && texto.length < 3) {
      setErrorAccion("Escribe el motivo del rechazo.");
      return;
    }
    setProcesando(true);
    setErrorAccion("");
    try {
      await actualizarJustificacion(justificacion.id, {
        estado: tipo === "aprobar" ? "aprobada" : "rechazada",
        observacion: texto,
        fechaRevision: fechaHoyISO(),
      });
      setAccionActiva(null);
      cargarDatos();   // la lista y los contadores se actualizan sin recargar la página
      onCambio?.();
      setResultado(
        tipo === "aprobar"
          ? { tipo: "ok", titulo: "Justificación aprobada", mensaje: "La asistencia del atleta quedó como justificada." }
          : { tipo: "ok", titulo: "Justificación rechazada", mensaje: "El atleta verá el motivo del rechazo." }
      );
    } catch (e) {
      // Mensaje real del backend (p. ej. 409 "Esta justificación ya fue revisada")
      setErrorAccion(e?.message || "No se pudo actualizar la justificación. Intenta de nuevo.");
    } finally {
      setProcesando(false);
    }
  };

  // Ver/descargar el soporte adjunto (si falla, mensaje real del backend en un aviso compacto)
  const verArchivo = (j) =>
    abrirSoporte(j.id, j.archivoNombre || "soporte").catch((e) =>
      setResultado({ tipo: "error", titulo: "No se pudo abrir el archivo", mensaje: e?.message || "Intenta de nuevo." })
    );

  const subtitulo =
    niveles.length > 1
      ? "Revisa, aprueba o rechaza las justificaciones enviadas por los atletas de tus niveles."
      : "Revisa, aprueba o rechaza las justificaciones enviadas por los atletas de tu nivel.";

  const esAprobar = accionActiva?.tipo === "aprobar";

  return (
    <div>
      <div className="asist-header">
        <div className="asist-header__titulo-bloque">
          <h1>Justificaciones</h1>
          <p>{subtitulo}</p>
        </div>

        {/* Pestañas de nivel: solo los niveles que devuelve la API (el entrenador, solo los suyos) */}
        {!error && niveles.length > 0 && (
          <div className="asist-header__tabs-bloque">
            <div className="ui-tabs" role="tablist">
              {niveles.map((n) => {
                const pendientes = pendientesPorNivel.get(String(n.id)) ?? 0;
                return (
                  <button
                    key={n.id}
                    type="button"
                    role="tab"
                    aria-selected={nivelActivo === String(n.id)}
                    className={`ui-tab${nivelActivo === String(n.id) ? " ui-tab--activa" : ""}`}
                    onClick={() => setNivelSel(String(n.id))}
                  >
                    {n.categoria} {!cargando && pendientes > 0 && <span className="ui-tab__conteo">{pendientes}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="panel-categoria">
        {niveles.length === 0 ? (
          <p className="asist-cargando">No tienes ningún nivel asignado todavía.</p>
        ) : cargando ? (
          <div className="ui-skeleton-grupo" aria-busy="true" aria-label="Cargando justificaciones">
            {Array.from({ length: 3 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--bloque" />)}
          </div>
        ) : error ? (
          <EstadoError mensaje={error} onReintentar={cargarDatos} />
        ) : (
          <>
            <div className="just-filtros">
              <div className="ui-tabs" role="tablist">
                {[
                  ["pendiente", "Pendientes", conteos.pendientes],
                  ["aprobada", "Aprobadas", conteos.aprobadas],
                  ["rechazada", "Rechazadas", conteos.rechazadas],
                  ["todas", "Todas", delNivel.length],
                ].map(([valor, texto, num]) => (
                  <button
                    key={valor}
                    type="button"
                    role="tab"
                    aria-selected={filtroEstado === valor}
                    className={`ui-tab${filtroEstado === valor ? " ui-tab--activa" : ""}`}
                    onClick={() => setFiltroEstado(valor)}
                  >
                    {texto} <span className="ui-tab__conteo">{num}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="just-grid-wrapper">
              {filtradas.length === 0 ? (
                <p className="asist-cargando">No hay justificaciones en este filtro.</p>
              ) : (
                <div className="just-grid">
                  {filtradas.map((j) => (
                    <JustificacionCard
                      key={j.id}
                      justificacion={j}
                      nivel={nivelPorId.get(String(j.nivelId))}
                      onAprobar={() => abrirAccion(j, "aprobar")}
                      onRechazar={() => abrirAccion(j, "rechazar")}
                      onVerArchivo={verArchivo}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ModalConfirmar
        abierto={!!accionActiva}
        tipo={esAprobar ? "ok" : "peligro"}
        titulo={esAprobar ? "Aprobar justificación" : "Rechazar justificación"}
        mensaje={
          accionActiva
            ? `${accionActiva.justificacion.atletaNombre || "El atleta"} · ${accionActiva.justificacion.fecha.split("-").reverse().join("/")}. ${
                esAprobar ? "La asistencia quedará como justificada." : "Indica el motivo del rechazo."
              }`
            : ""
        }
        textoConfirmar={esAprobar ? "Aprobar" : "Rechazar"}
        cargando={procesando}
        error={errorAccion}
        onConfirmar={confirmarAccion}
        onCancelar={() => !procesando && setAccionActiva(null)}
      >
        <TextareaContador
          id="observacion-revision"
          value={observacion}
          onChange={setObservacion}
          placeholder={esAprobar ? "Observación (opcional). Ej: Certificado médico verificado." : "Motivo del rechazo (obligatorio)"}
        />
      </ModalConfirmar>

      <ModalAviso
        abierto={!!resultado}
        tipo={resultado?.tipo}
        titulo={resultado?.titulo}
        mensaje={resultado?.mensaje}
        onCerrar={() => setResultado(null)}
      />
    </div>
  );
}
