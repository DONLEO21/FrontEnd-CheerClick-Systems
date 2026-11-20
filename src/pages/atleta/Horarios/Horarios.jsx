
import "./Horarios.css";
import { useState, useEffect, useMemo } from "react";

import FiltrosCategoria from "./FiltrosCategoria";
import TiraDias from "./TiraDias";
import TarjetaEntrenamiento from "./TarjetaEntrenamiento";
import TarjetaCampeonatoAtleta from "./TarjetaCampeonatoAtleta";
import ModalEntrenamientoAtleta from "./ModalEntrenamientoAtleta";
import ModalCampeonatoAtleta from "./ModalCampeonatoAtleta";
import ModalPago from "./ModalPago";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";

import { fechaAISO, obtenerLunesDeSemana, formatearRangoSemana, obtenerIniciales } from "./horariosAtletaData";
import { useSesion } from "../../../context/SesionContext";
import { obtenerNivel, listarCompetencias, listarSesionesAtleta } from "../../../services/horariosService";
import { enviarPagoCompetencia } from "../../../services/pagosService";

function HorariosAtletaContenido() {
  const { sesion } = useSesion();
  // nivel del atleta autenticado (el backend lo devuelve en su usuario)
  const nivelId = sesion.usuario?.nivel ?? null;
  const [sesiones, setSesiones] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // READ: carga inicial
  useEffect(() => {
    let activo = true;
    setCargando(true);
    if (!nivelId) {
      // TODO(backend): un atleta sin nivel asignado no tiene horarios; lo asigna el administrador.
      setCargando(false);
      return undefined;
    }
    Promise.all([
      obtenerNivel(nivelId),
      listarCompetencias(nivelId),
    ])
      .then(async ([nivel, t]) => {
        const s = await listarSesionesAtleta(nivelId, nivel.entrenador);
        if (!activo) return;
        setSesiones(
          s.map((ses) => ({
            ...ses,
            iniciales: obtenerIniciales(nivel.entrenador),
          }))
        );
        setTorneos(t.filter((x) => !x.inhabilitada));
      })
      .catch((err) => activo && setError(err))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [nivelId]);

  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });

  const [lunes, setLunes] = useState(() => obtenerLunesDeSemana(new Date()));
  const [filtroActivo, setFiltroActivo] = useState("todos");

  const sesionesPorFecha = useMemo(() => {
    const mapa = {};
    sesiones.forEach((s) => {
      (mapa[s.fecha] ||= []).push(s);
    });
    return mapa;
  }, [sesiones]);

  const sesionesDeLaSemana = useMemo(() => {
    const resultado = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes.getFullYear(), lunes.getMonth(), lunes.getDate() + i);
      const iso = fechaAISO(d);
      if (sesionesPorFecha[iso]) resultado.push(...sesionesPorFecha[iso]);
    }
    return resultado;
  }, [lunes, sesionesPorFecha]);

  const sesionesFiltradas = useMemo(
    () => (filtroActivo === "todos" ? sesionesDeLaSemana : sesionesDeLaSemana.filter((s) => s.cat === filtroActivo)),
    [sesionesDeLaSemana, filtroActivo]
  );

  const totales = useMemo(() => {
    const horas = sesionesFiltradas.reduce((acc, s) => acc + parseFloat(s.duracion), 0);
    const disciplinas = new Set(sesionesFiltradas.map((s) => s.cat)).size;
    return { sesiones: sesionesFiltradas.length, horas, disciplinas };
  }, [sesionesFiltradas]);

  const cambiarSemana = (delta) => {
    setLunes((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta * 7));
  };

  const [sesionModal, setSesionModal] = useState(null);
  const [campeonatoModal, setCampeonatoModal] = useState(null);
  const [pagoModal, setPagoModal] = useState(null); // torneo para el que se está pagando

  const abrirPagoDesdeTorneo = (torneo) => {
    setCampeonatoModal(null);
    setPagoModal(torneo);
  };

  // CREATE (POST) enviar comprobante de pago
  const enviarPago = (datosPago) => {
    return enviarPagoCompetencia(sesion.atletaId, {
      torneoId: datosPago.torneoId,
      metodo: datosPago.metodo,
      monto: datosPago.monto,
      fechaPago: datosPago.fecha,
      referencia: datosPago.referencia,
      comprobante: datosPago.archivo,
    }).then((creado) => {
      mostrarAviso("Comprobante enviado correctamente.", "ok");
      return creado;
    });
  };


  if (cargando) {
    return (
      <main className="ui-contenido container-fluid py-5 text-center text-secondary">
        <div className="spinner-border text-danger mb-3" role="status" />
        <p>Cargando tus horarios…</p>
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

  return (
    <main className="ui-contenido">
      <section className="envoltura-horario" aria-labelledby="titulo-entrenamientos">
        <header className="encabezado-horario">
          <div className="bloque-titulo-horario">
            <h1 id="titulo-entrenamientos">Próximos Entrenamientos</h1>
            <p className="subtitulo-horario-atleta">Lunes 6–8 PM · Miércoles 6–8 PM · Sábados 4–6 PM</p>
          </div>
          <div className="chips-horario" aria-label="Estadísticas de la semana">
            <span className="chip-estadistica">
              <i className="bi bi-calendar3" />
              {totales.sesiones} sesión{totales.sesiones !== 1 ? "es" : ""}
            </span>
            <span className="chip-estadistica">
              <i className="bi bi-clock" />
              {totales.horas}h totales
            </span>
            <span className="chip-estadistica">
              <i className="bi bi-lightning-charge" />
              {totales.disciplinas} disciplina{totales.disciplinas !== 1 ? "s" : ""}
            </span>
          </div>
        </header>

        <FiltrosCategoria filtroActivo={filtroActivo} onCambiarFiltro={setFiltroActivo} />

        <nav className="navegador-semana" aria-label="Navegación por semanas">
          <button className="btn-semana" type="button" onClick={() => cambiarSemana(-1)}>
            <i className="bi bi-chevron-left" /> Semana anterior
          </button>
          <div className="centro-semana">
            <span className="etiqueta-rango-semana" aria-live="polite">{formatearRangoSemana(lunes)}</span>
            <TiraDias lunes={lunes} sesionesPorFecha={sesionesPorFecha} />
          </div>
          <button className="btn-semana" type="button" onClick={() => cambiarSemana(1)}>
            Semana siguiente <i className="bi bi-chevron-right" />
          </button>
        </nav>

        <div className="cuadricula-entrenamientos" role="list" aria-label="Sesiones de entrenamiento">
          {sesionesFiltradas.length ? (
            sesionesFiltradas.map((s) => (
              <TarjetaEntrenamiento key={s.id} sesion={s} onVerDetalles={setSesionModal} />
            ))
          ) : (
            <div className="estado-vacio">
              <i className="bi bi-calendar-x" />
              <p>
                {filtroActivo !== "todos"
                  ? `No hay sesiones de "${filtroActivo}" esta semana.`
                  : "No hay entrenamientos programados para esta semana."}
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="seccion-campeonatos" aria-labelledby="titulo-campeonatos">
        <header className="encabezado-seccion-campeonatos">
          <div className="bloque-titulo-seccion">
            <h2 id="titulo-campeonatos">Campeonatos Nivel 3</h2>
            <p className="subtitulo-seccion">Blood Tiger Magic — Temporada 2026</p>
          </div>
        </header>

        <div className="cuadricula-campeonatos" role="list">
          {torneos.map((t) => (
            <TarjetaCampeonatoAtleta
              key={t.id}
              torneo={t}
              onVerDetalles={setCampeonatoModal}
              onPagar={(torneo) => setPagoModal(torneo)}
            />
          ))}
        </div>
      </section>

      <ModalEntrenamientoAtleta sesion={sesionModal} onCerrar={() => setSesionModal(null)} />

      <ModalCampeonatoAtleta
        torneo={campeonatoModal}
        nivelEtiqueta="Nivel 3 Magic"
        onCerrar={() => setCampeonatoModal(null)}
        onPagar={abrirPagoDesdeTorneo}
      />

      {pagoModal && (
        <ModalPago torneo={pagoModal} onCerrar={() => setPagoModal(null)} onEnviar={enviarPago} onAviso={mostrarAviso} />
      )}

      <AvisoToast aviso={aviso} />
    </main>
  );
}

// Clase raíz del módulo: todos sus estilos viven bajo .atl-horarios
export default function HorariosAtleta(props) {
  return (
    <div className="atl-horarios">
      <HorariosAtletaContenido {...props} />
    </div>
  );
}
