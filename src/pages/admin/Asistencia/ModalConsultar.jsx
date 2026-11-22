import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  obtenerRegistrosMes,
  construirMapaAsistencia,
  diasContables,
  porcentajeDeAtleta,
  resumirMes,
} from "../../../services/asistenciaService";
import { abrirReporteAsistencia } from "./exportarAsistencia";
import { diasDeSesion, horarioDiasUnicos, nombreMes, fechaHoyISO, letraDeFecha } from "../../../services/data";
import { ESTADOS_ASISTENCIA, ORDEN_ESTADOS, etiquetaEstado } from "../../../utils/estadoAsistencia";
import IconoEstadoAsistencia from "../../../components/Compartidos/IconoEstadoAsistencia";

function iniciales(nombre, apellido) {
  const palabras = `${nombre ?? ""} ${apellido ?? ""}`.trim().split(/\s+/);
  return palabras.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

// Hoy lleva el chip destacado; los días futuros quedan neutros (rayados y sin icono)
const claseDia = (d, hoyStr) =>
  [d.fechaISO === hoyStr ? "dia-hoy" : d.fechaISO > hoyStr ? "dia-futuro" : "", d.extra ? "dia-extra" : ""].filter(Boolean).join(" ");

// Texto de cada celda para el CSV (mismo contenido que la matriz): estado, "—" sin registro en un día pasado, vacío si es futuro
const textoCelda = (registro, fechaISO, hoyStr) =>
  registro ? etiquetaEstado(registro.estado) : fechaISO > hoyStr ? "" : "—";

function exportarCSV(nivel, mesLabel, dias, atletas, mapa, porcentajes, hoyStr) {
  const encabezado = ["Nombre", ...dias.map((d) => (d.extra ? `${d.dia}*` : `${d.dia}`)), "%"];
  const filas = atletas.map((atleta) => {
    const delAtleta = mapa[String(atleta.id)] ?? {};
    const celdas = dias.map((d) => textoCelda(delAtleta[d.fechaISO], d.fechaISO, hoyStr));
    const pct = porcentajes[String(atleta.id)];
    return [`${atleta.nombre} ${atleta.apellido}`, ...celdas, pct === null || pct === undefined ? "—" : `${pct}%`];
  });

  const csv = [encabezado, ...filas]
    .map((fila) => fila.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([`\uFEFF${csv}\n"* día extra (sin sesión programada, con registros)"`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asistencia_${nivel?.categoria ?? "nivel"}_${mesLabel}.csv`.replace(/\s+/g, "_");
  a.click();
  URL.revokeObjectURL(url);
}

// Modal en portal (document.body): ningún ancestro (transform, overflow, márgenes del layout) puede desplazarlo o cortarlo.
// Se monta al abrir, así que siempre arranca en el MES ACTUAL (hoy en America/Bogota).
function ModalConsultar({ abierto, onCerrar, nivel, atletas }) {
  const hoyStr = fechaHoyISO();
  const [anioHoy, mesHoy, diaHoyNum] = hoyStr.split("-").map(Number);
  const [anio, setAnio] = useState(anioHoy);
  const [mesIndex, setMesIndex] = useState(mesHoy - 1);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorHistorial, setErrorHistorial] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cerrar = onCerrar;

  // Escape cierra el modal
  useEffect(() => {
    if (!abierto) return;
    const alTecla = (e) => { if (e.key === "Escape") onCerrar(); };
    document.addEventListener("keydown", alTecla);
    return () => document.removeEventListener("keydown", alTecla);
  }, [abierto, onCerrar]);

  // Cada cambio de mes vuelve a pedir TODO el mes a la API (primer a último día)
  useEffect(() => {
    if (!abierto || !nivel?.id) return;
    let cancelado = false;
    setCargando(true);
    setErrorHistorial("");
    obtenerRegistrosMes(nivel.id, anio, mesIndex)
      .then((r) => { if (!cancelado) setRegistros(r); })
      .catch((e) => {
        if (cancelado) return;
        setRegistros([]);
        setErrorHistorial(e?.message || "No se pudo cargar el historial de asistencia.");
      })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [abierto, nivel?.id, anio, mesIndex]);

  const atletaIds = useMemo(() => atletas.map((a) => String(a.id)), [atletas]);

  // ÚNICA fuente de datos: atletaId -> { 'AAAA-MM-DD': { estado, motivo } } (solo atletas de la lista del nivel)
  const mapa = useMemo(
    () => construirMapaAsistencia(registros.filter((r) => atletaIds.includes(r.atletaId))),
    [registros, atletaIds]
  );

  // Columnas = UNIÓN de los días de sesión del nivel y los días del mes con al menos un registro (los "extra")
  const diasHorario = useMemo(() => horarioDiasUnicos(nivel?.horarios), [nivel]);
  const dias = useMemo(() => {
    const porFecha = new Map();
    if (diasHorario.length > 0) {
      for (const d of diasDeSesion(anio, mesIndex, diasHorario)) porFecha.set(d.fechaISO, { ...d, extra: false });
    }
    for (const delAtleta of Object.values(mapa)) {
      for (const fechaISO of Object.keys(delAtleta)) {
        if (porFecha.has(fechaISO)) continue;
        porFecha.set(fechaISO, { dia: Number(fechaISO.slice(8, 10)), letra: letraDeFecha(fechaISO), fechaISO, extra: true });
      }
    }
    return [...porFecha.values()].sort((a, b) => a.fechaISO.localeCompare(b.fechaISO));
  }, [anio, mesIndex, diasHorario, mapa]);

  // % por atleta y % general: misma fórmula, mismo mapa
  const contables = useMemo(() => diasContables(mapa, atletaIds, hoyStr), [mapa, atletaIds, hoyStr]);
  const porcentajes = useMemo(
    () => Object.fromEntries(atletaIds.map((id) => [id, porcentajeDeAtleta(mapa[id], contables)])),
    [atletaIds, mapa, contables]
  );
  const resumen = useMemo(() => resumirMes(mapa, atletaIds, hoyStr), [mapa, atletaIds, hoyStr]);

  const atletasFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return atletas;
    return atletas.filter((a) => `${a.nombre} ${a.apellido}`.toLowerCase().includes(texto));
  }, [atletas, busqueda]);

  const justificaciones = useMemo(
    () =>
      registros
        .filter((r) => r.estado === "justificado" && r.motivo)
        .map((r) => {
          const atleta = atletas.find((a) => String(a.id) === String(r.atletaId));
          return { ...r, atletaNombre: atleta ? `${atleta.nombre} ${atleta.apellido}` : "Atleta" };
        })
        .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    [registros, atletas]
  );

  const mesLabel = `${nombreMes(mesIndex)} ${anio}`;
  const [avisoExport, setAvisoExport] = useState("");
  const exportarDocumento = () => {
    const abierto = abrirReporteAsistencia({
      nivel, mesLabel, dias, atletas: atletasFiltrados, mapa, porcentajes, resumen, hoyStr,
    });
    setAvisoExport(abierto ? "" : "El navegador bloqueó la ventana del documento. Permite las ventanas emergentes e inténtalo de nuevo.");
  };

  const esMesActual = anio === anioHoy && mesIndex === mesHoy - 1;
  const sinRegistros = !cargando && !errorHistorial && registros.length === 0;

  const mesAnterior = () => {
    if (mesIndex === 0) { setMesIndex(11); setAnio((a) => a - 1); } else { setMesIndex((m) => m - 1); }
  };
  const mesSiguiente = () => {
    if (mesIndex === 11) { setMesIndex(0); setAnio((a) => a + 1); } else { setMesIndex((m) => m + 1); }
  };

  if (!abierto) return null;

  return createPortal(
    <div
      className="adm-asistencia adm-asist-consultar-overlay ui-anim-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}
    >
      <div className="adm-asist-consultar ui-anim-modal" role="dialog" aria-modal="true" aria-labelledby="asist-consultar-titulo">
        <div className="adm-asist-consultar__encabezado">
          <div className="modal-consultar-header d-flex align-items-center">
            <h2 id="asist-consultar-titulo">Asistencia</h2>
            <span className="badge-categoria">{nivel?.categoria}</span>
            <button type="button" className="btn-cerrar-circular ms-auto" aria-label="Cerrar" onClick={cerrar}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" /><path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="adm-asist-consultar__cuerpo">
          <div className="resumen-mes-box">
            <div className="resumen-mes-pct">
              <span className="resumen-mes-num">{resumen.porcentaje === null ? "—" : `${resumen.porcentaje}%`}</span>
              <span className="resumen-mes-label">Asistencia de {nombreMes(mesIndex).toLowerCase()}</span>
            </div>
            <div className="resumen-mes-barra">
              <div className="resumen-mes-barra-fill" style={{ width: `${resumen.porcentaje ?? 0}%` }} />
            </div>

            <div className="resumen-mes-leyenda">
              <span><span className="leyenda-circulo leyenda-presente"></span> {resumen.presentes} presentes</span>
              <span><span className="leyenda-circulo leyenda-inpuntual"></span> {resumen.inpuntuales} impuntuales</span>
              <span><span className="leyenda-circulo leyenda-falta"></span> {resumen.faltas} faltas</span>
              {resumen.justificadas > 0 && (
                <span><span className="leyenda-circulo leyenda-justificado"></span> {resumen.justificadas} justificadas</span>
              )}
            </div>
          </div>

          <div className="consultar-mes-selector d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="selector-mes">
              <button type="button" className="btn-mes-nav" aria-label="Mes anterior" onClick={mesAnterior}>‹</button>
              {mesLabel}
              <button type="button" className="btn-mes-nav" aria-label="Mes siguiente" onClick={mesSiguiente}>›</button>
            </div>

            <div className="buscar-atleta">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Buscar atleta…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {sinRegistros && <p className="consultar-sin-registros" role="status">Sin registros este mes.</p>}

          <div className="consultar-tabla-wrapper">
            {cargando ? (
              <p className="asist-cargando">Cargando historial…</p>
            ) : errorHistorial ? (
              <p className="asist-error" role="alert">{errorHistorial}</p>
            ) : dias.length === 0 ? (
              <p className="asist-cargando">Este nivel no tiene sesiones programadas ni registros en este mes.</p>
            ) : (
              <table className="consultar-tabla-mes">
                <thead>
                  <tr>
                    <th className="col-nombre-mes">Nombre</th>
                    {dias.map((d) => (
                      <th
                        key={d.fechaISO}
                        className={claseDia(d, hoyStr)}
                        title={d.extra ? "Día extra: sin sesión programada, pero con registros de asistencia" : undefined}
                      >
                        <span className="dia-num">{d.dia}</span>
                        <span className="dia-letra">{d.letra}</span>
                      </th>
                    ))}
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {atletasFiltrados.map((atleta) => {
                    const delAtleta = mapa[String(atleta.id)] ?? {};
                    const pct = porcentajes[String(atleta.id)];
                    return (
                      <tr key={atleta.id}>
                        <td className="col-nombre-mes">
                          <span className="avatar-iniciales">{iniciales(atleta.nombre, atleta.apellido)}</span>
                          {atleta.nombre} {atleta.apellido}
                        </td>
                        {dias.map((d) => {
                          const registro = delAtleta[d.fechaISO];
                          return (
                            <td key={d.fechaISO} className={claseDia(d, hoyStr)}>
                              {registro ? (
                                <IconoEstadoAsistencia estado={registro.estado} fecha={d.fechaISO} motivo={registro.motivo} />
                              ) : d.fechaISO <= hoyStr ? (
                                <span className="celda-sin-registro" title={`Sin registro · ${d.fechaISO.split("-").reverse().join("/")}`} aria-label="Sin registro">—</span>
                              ) : null}
                            </td>
                          );
                        })}
                        <td className="col-porcentaje">{pct === null || pct === undefined ? "—" : `${pct}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {justificaciones.length > 0 && (
            <div className="justificaciones-lista">
              <h3>
                Justificaciones del mes
                <span className="justificaciones-count">{justificaciones.length}</span>
              </h3>
              <ul>
                {justificaciones.map((j) => (
                  <li key={j.id}>
                    <span className="justificacion-fecha">{j.fecha.split("-").reverse().join("/")}</span>
                    <span className="justificacion-atleta">{j.atletaNombre}</span>
                    <span className="justificacion-motivo">{j.motivo}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="adm-asist-consultar__pie">
          <div className="calendario-leyenda">
            {ORDEN_ESTADOS.map((estado) => (
              <span className="leyenda-item" key={estado}>
                <IconoEstadoAsistencia estado={estado} tamano={estado === "justificado" ? 14 : 16} /> {ESTADOS_ASISTENCIA[estado].etiqueta}
              </span>
            ))}
            <span className="leyenda-item"><span className="leyenda-dia-hoy-num">{esMesActual ? diaHoyNum : "·"}</span> Día de hoy</span>
            <span className="leyenda-item"><span className="leyenda-extra" aria-hidden="true"></span> Día extra</span>

            <button
              type="button"
              className="btn-exportar btn-exportar--sec ms-auto"
              title="Descargar en CSV (Excel)"
              onClick={() => exportarCSV(nivel, `${nombreMes(mesIndex)}_${anio}`, dias, atletasFiltrados, mapa, porcentajes, hoyStr)}
            >
              CSV
            </button>
            <button type="button" className="btn-exportar" title="Documento listo para imprimir o guardar como PDF" onClick={exportarDocumento}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Exportar
            </button>
          </div>
          {avisoExport && <p className="asist-error" role="alert">{avisoExport}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default ModalConsultar;
