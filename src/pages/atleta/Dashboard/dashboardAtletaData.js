import { almacenSesion } from '../../../api/client'
import { obtenerNivel, listarCompetencias, listarSesiones } from '../../../services/horariosService';
import { asistenciaApi } from '../../../api/asistencia.api'
import { rendimientoApi } from '../../../api/rendimiento.api'
import { mensualidadesApi } from '../../../api/mensualidades.api'
import { inscripcionesCompetenciasApi } from '../../../api/inscripciones_competencias.api'
import { pqrsApi } from '../../../api/pqrs.api'

/* ───────── configuración ───────── */
export const RUTAS = {
  perfil: '/atleta/perfil',
  rendimiento: '/atleta/rendimiento',
  entrenamientos: '/atleta/horarios',
  pqrs: '/atleta/pqrs',
  mensualidades: '/atleta/pagos',
  // los campeonatos se ven en Horarios (no hay pantalla por torneo)
  torneo: () => '/atleta/horarios',
};

export const RUTA_INICIO_ATLETA = '/atleta';
export const TORNEOS_POR_PAGINA = 4;

const CATEGORIAS = [
  { id: 'apropiadas', nombre: 'Apropiadas', color: 'morado' },
  { id: 'avanzada', nombre: 'Avanzada', color: 'amarillo' },
  { id: 'elite', nombre: 'Elite', color: 'azul' },
];

export const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
export const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
export const DIAS = ['DOM','LUN','MAR','MIÉ','JUE','VIE','SÁB'];

/* ───────── utilidades ───────── */
export const pad = (n) => String(n).padStart(2, '0');
export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hace = (dias) => { const d = new Date(); d.setDate(d.getDate() - dias); return d; };
export const dia10 = (f) => String(f).slice(0, 10);
export const fechaLocal = (f) => new Date(`${dia10(f)}T00:00:00`);
const prom = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : null);
// Number(null) daría 0: un porcentaje sin dato debe seguir siendo "sin dato" y no contar como 0 %
const num = (v) => (v === null || v === undefined ? NaN : Number(v))
export const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const hora12 = (h) => {
  if (!h) return '';
  const [H, M] = String(h).split(':').map(Number);
  return `${H % 12 || 12}:${pad(M)} ${H >= 12 ? 'PM' : 'AM'}`;
};

export const moneda = (v) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

export const fechaCorta = (f) => {
  const d = fechaLocal(f);
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]} ${d.getFullYear()}`;
};


const sinTildes = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
// Porcentaje completado de una categoría de habilidades (apropiada / avanzada / elite) según el resumen del backend
const pctCategoria = (porCategoria = {}, prefijo) => {
  const k = Object.keys(porCategoria).find((n) => sinTildes(n).startsWith(prefijo))
  const c = k ? porCategoria[k] : null
  return c && c.total ? Math.round((c.completadas / c.total) * 100) : null
}
export const BASE_VACIA = {
  yo: null, nivel: null, asist: [], evals: [], habilidades: [], pagos: [],
  torneos: [], inscritos: [], pqrs: [], errores: [],
};

const ESTADO_PQRS = { Pendiente: 'pendiente', 'En tramite': 'proceso', Resuelta: 'respondida' };

/* ───────── acceso a datos (backend) ───────── */
export async function cargarBase(uid) {
  const errores = [];
  const seguro = async (fn, vacio = []) => {
    try { return await fn(); } catch (e) { errores.push(e.message); return vacio; }
  };

  const u = almacenSesion.usuario();
  if (!u) return { ...BASE_VACIA, errores };
  const yo = { id: uid, nombre: u.nombre, id_nivel: u.nivel ?? null, foto: null };

  const [nivel, asist, rend, pagos, torneos, inscr, pqrs] = await Promise.all([
    yo.id_nivel ? seguro(() => obtenerNivel(yo.id_nivel), null) : Promise.resolve(null),
    seguro(async () => (await asistenciaApi.list({ usuario: uid })).data ?? []),
    seguro(async () => (await rendimientoApi.getAtleta(uid)).data ?? null, null),
    seguro(async () => (await mensualidadesApi.list()).data ?? []),
    yo.id_nivel ? seguro(() => listarCompetencias(yo.id_nivel)) : Promise.resolve([]),
    seguro(async () => (await inscripcionesCompetenciasApi.list()).data ?? []),
    seguro(async () => (await pqrsApi.list()).data ?? []),
  ]);

  const hoyIso = iso(new Date());
  const pc = rend?.resumen?.porCategoria;
  const evals = pc ? [{ fecha: hoyIso, apropiadas: pctCategoria(pc, 'apropiad'), avanzada: pctCategoria(pc, 'avanz'), elite: pctCategoria(pc, 'elit') }] : [];

  return {
    yo,
    nivel: nivel ? { id: nivel.id, nombre: nivel.categoria } : null,
    asist: asist.map((a) => ({ fecha: a.fecha, presente: a.tipoNovedad === 'Presente' || a.tipoNovedad === 'Tarde' })),
    evals,
    habilidades: (rend?.habilidades ?? []).map((h) => ({ estado: h.completado ? 'aprobado' : 'reprobado' })),
    pagos: pagos.map((m) => ({
      mes: new Date(m.fechaGeneracion).toLocaleDateString('es-CO', { month: 'long', timeZone: 'UTC' }),
      valor: m.valor,
      estado: (m.pago?.estado ?? 'Pendiente').toLowerCase(),
      fecha_pago: m.pago?.fechaPago ?? null,
      fecha_vencimiento: m.fechaVencimiento,
    })),
    torneos: torneos.filter((x) => !x.inhabilitada && x.fecha >= hoyIso).map((x) => ({ id: x.id, nombre: x.nombre, fecha: x.fecha, lugar: x.ciudad })),
    inscritos: inscr.map((i) => String(i.competencia?._id ?? i.competencia)),
    pqrs: pqrs.map((p) => ({ estado: ESTADO_PQRS[p.etapa] ?? 'pendiente' })),
    errores,
  };
}

async function cargarEntrenos(idNivel, desde, hasta) {
  if (!idNivel) return [];
  const sesiones = await listarSesiones(idNivel);
  return sesiones
    .filter((s) => s.estado === 'activa' && s.fecha >= desde && s.fecha <= hasta)
    .map((s) => ({ id: s.id, id_nivel: s.nivelId, titulo: s.enfoque, fecha: s.fecha, hora_inicio: s.horaInicio, hora_fin: s.horaFin }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora_inicio.localeCompare(b.hora_inicio));
}

// Punto único de acceso a los entrenamientos del nivel (desde el backend)
export function obtenerEntrenos({ idNivel, desde, hasta }) {
  return cargarEntrenos(idNivel, desde, hasta);
}

/* ───────── cálculos ───────── */
export function calcularMetricas(evals, asist) {
  const porCat = CATEGORIAS.map((c) => {
    const v = evals.map((e) => num(e[c.id])).filter(Number.isFinite);
    const valor = v.length ? Math.round(prom(v)) : null; // sin evaluaciones no se inventa ningún valor
    return { ...c, valor };
  });

  const semana = (i) => {
    const desde = iso(hace(7 * (i + 1) - 1));
    const hasta = iso(hace(7 * i));
    const v = evals
      .filter((e) => dia10(e.fecha) >= desde && dia10(e.fecha) <= hasta)
      .flatMap((e) => CATEGORIAS.map((c) => num(e[c.id])).filter(Number.isFinite));
    return prom(v);
  };

  const [actual, previa] = [semana(0), semana(1)];
  const variacion = actual !== null && previa ? Math.round(((actual - previa) / previa) * 100) : null;
  const entrenamientos = asist.filter((a) => a.presente).length;

  return { porCat, variacion, entrenamientos };
}

export function resumirPqrs(pqrs) {
  const c = (e) => pqrs.filter((p) => p.estado === e).length;
  return [
    { id: 'respondida', texto: `${c('respondida')} resuelta${c('respondida') === 1 ? '' : 's'}` },
    { id: 'proceso', texto: `${c('proceso')} en trámite` },
    { id: 'pendiente', texto: `${c('pendiente')} pendiente${c('pendiente') === 1 ? '' : 's'}` },
  ];
}

export function resumirPagos(listaPagos, hoy) {
  const pagados = listaPagos
    .filter((p) => p.estado === 'pagado' && p.fecha_pago)
    .sort((a, b) => dia10(b.fecha_pago).localeCompare(dia10(a.fecha_pago)));
  const pendientes = listaPagos
    .filter((p) => p.estado !== 'pagado')
    .sort((a, b) => dia10(a.fecha_vencimiento).localeCompare(dia10(b.fecha_vencimiento)));

  const ultimo = pagados[0] ?? null;
  const siguiente = pendientes[0] ?? null;

  let estado = 'aldia';
  if (siguiente) estado = dia10(siguiente.fecha_vencimiento) < hoy ? 'mora' : 'pendiente';

  const dias = siguiente
    ? Math.round((fechaLocal(siguiente.fecha_vencimiento) - fechaLocal(hoy)) / 864e5)
    : null;

  return { ultimo, siguiente, estado, dias };
}
