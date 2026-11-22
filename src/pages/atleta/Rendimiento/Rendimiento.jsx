import { useMemo, useState } from "react";
import { almacenSesion } from "../../../api/client";
import useRendimientoAtleta from "../../../hooks/useRendimientoAtleta";
import ModalAviso from "../../../components/Compartidos/ModalAviso";
import EstadoError from "../../../components/Compartidos/EstadoError";
import { enviarJustificacion } from "../../../services/rendimientoAtletaService";
import { abrirSoporte } from "../../../services/justificacionesService";
import { fechaHoyISO } from "../../../services/data";
import {
  combinarHabilidades,
  construirHistorial,
  filasDelMes,
  resumenAsistencia,
  resumenHabilidades,
  faltasPorJustificar,
} from "../../../services/rendimientoCalculos";
import "./Rendimiento.css";
import "./Asistencia.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import PerfilAtleta from "./PerfilAtleta";
import TarjetasResumen from "./TarjetasResumen";
import PanelHabilidades from "./PanelHabilidades";
import NotasEntrenador from "./NotasEntrenador";
import TabAsistencia from "./TabAsistencia";
import ModalJustificar from "./ModalJustificar";

const TABS = [
  { id: "rendimiento", etiqueta: "Rendimiento", icono: "bi-activity" },
  { id: "asistencia", etiqueta: "Asistencia", icono: "bi-calendar-event" },
];

function Rendimiento() {
  // El atleta es SIEMPRE el de la sesión (id del token guardado al iniciar sesión), sin ningún valor de respaldo
  const atletaId = almacenSesion.usuario()?.id ?? null;

  const { datos, cargando, error, recargar } = useRendimientoAtleta(atletaId);
  const [tab, setTab] = useState("rendimiento");
  const [fechaJustificando, setFechaJustificando] = useState(null); 
  const [resultado, setResultado] = useState(null); // aviso compacto tras enviar
  const [hoyISO] = useState(fechaHoyISO); 

  const habilidadesDelAtleta = useMemo(
    () => (datos ? combinarHabilidades(datos.habilidades, datos.progreso) : []),
    [datos]
  );
  const resumenHab = useMemo(() => resumenHabilidades(habilidadesDelAtleta), [habilidadesDelAtleta]);

  const historial = useMemo(
    () => (datos ? construirHistorial(datos.asistencias, datos.justificaciones) : []),
    [datos]
  );
  const asistenciaMes = useMemo(() => {
    const [anio, mes] = hoyISO.split("-").map(Number);
    return resumenAsistencia(filasDelMes(historial, anio, mes - 1));
  }, [historial, hoyISO]);

  const faltas = useMemo(() => faltasPorJustificar(historial), [historial]);

  const enviar = async ({ fecha, motivo, archivo }) => {
    const fila = historial.find((f) => f.fecha === fecha);
    await enviarJustificacion({
      atleta: datos.atleta,
      nivel: datos.nivel,
      nivelId: fila?.nivelId,
      fechaISO: fecha,
      motivo,
      archivo,
    });
    setFechaJustificando(null);   // cierra el modal
    recargar();                   // la lista muestra la nueva justificación como "Pendiente"
    setResultado({ tipo: "ok", titulo: "Justificación enviada", mensaje: "Tu entrenador la revisará y verás el resultado aquí." });
  };

  if (!datos) {
    return (
      <main className="rend-atleta">
        {cargando ? (
          <div className="ui-skeleton-grupo" aria-busy="true" aria-label="Cargando tu rendimiento">
            {Array.from({ length: 3 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--bloque" />)}
          </div>
        ) : (
          <EstadoError
            mensaje={`No se ha podido cargar tu rendimiento.${error ? ` ${error}` : ""}`}
            onReintentar={recargar}
          />
        )}
      </main>
    );
  }

  return (
    <main className="rend-atleta">
      <div className="page-header">
        <h1>Mi Rendimiento Deportivo</h1>
        <p>
          Consulta tu historial de asistencia, nivel de desempeño, habilidades adquiridas y las
          notas de tu entrenador.
        </p>
      </div>

      {error && (
        <p className="rend-aviso-error" role="alert">
          {error}
        </p>
      )}

      <PerfilAtleta atleta={datos.atleta} />

      <div className="tabs-nav" role="tablist" aria-label="Secciones de rendimiento">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`rend-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`rend-panel-${t.id}`}
            className={`tab-btn${tab === t.id ? " activo" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`bi ${t.icono}`}></i>
            {t.etiqueta}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`rend-panel-${tab}`} aria-labelledby={`rend-tab-${tab}`}>
        {tab === "rendimiento" ? (
          <>
            <TarjetasResumen
              puntaje={resumenHab.porcentaje}
              completadas={resumenHab.completadas}
              total={resumenHab.total}
              asistencia={asistenciaMes}
            />

            {habilidadesDelAtleta.length === 0 ? (
              <p className="rend-vacio">Aún no tienes evaluaciones registradas.</p>
            ) : (
              <PanelHabilidades habilidades={habilidadesDelAtleta} cargando={cargando} />
            )}

            <NotasEntrenador notas={datos.notas} />
          </>
        ) : (
          <TabAsistencia
            historial={historial}
            justificaciones={datos.justificaciones}
            errores={datos.errores}
            onReintentar={recargar}
            onVerArchivo={(j) =>
              abrirSoporte(j.id, j.archivoNombre || "soporte").catch((e) =>
                setResultado({ tipo: "error", titulo: "No se pudo abrir el archivo", mensaje: e?.message || "Intenta de nuevo." })
              )
            }
            nivel={datos.nivel}
            hoyISO={hoyISO}
            onJustificar={setFechaJustificando}
          />
        )}
      </div>

      {fechaJustificando && (
        <ModalJustificar
          key={fechaJustificando}
          fechaISO={fechaJustificando}
          fechas={faltas.map((f) => f.fecha)}
          nivel={datos.nivel}
          onCerrar={() => setFechaJustificando(null)}
          onEnviar={enviar}
        />
      )}

      <ModalAviso
        abierto={!!resultado}
        tipo={resultado?.tipo}
        titulo={resultado?.titulo}
        mensaje={resultado?.mensaje}
        onCerrar={() => setResultado(null)}
      />
    </main>
  );
}

export default Rendimiento;
