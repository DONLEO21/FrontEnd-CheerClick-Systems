import { almacenSesion } from '../../../api/client'
;
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
export const USAR_DATOS_DEMO = false; // true = siempre datos quemados
export const DEMO_SI_FALLA = false;   // true = si no hay datos/BD, usa quemados
export const TORNEOS_POR_PAGINA = 4;

const CATEGORIAS = [
  { id: 'apropiadas', nombre: 'Apropiadas', color: 'morado' },
  { id: 'avanzada', nombre: 'Avanzada', color: 'amarillo' },
  { id: 'elite', nombre: 'Elite', color: 'azul' },
];

// valores de respaldo cuando una categoría no tiene datos reales todavía
const VALORES_RESPALDO = {}; // sin datos de ejemplo: si no hay evaluaciones, no se muestra valor

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

// Punto único de acceso: decide entre datos demo o reales
export function obtenerEntrenos({ demo, idNivel, desde, hasta }) {
  return demo
    ? Promise.resolve(demoEntrenos(desde, hasta))
    : cargarEntrenos(idNivel, desde, hasta);
}

/* ───────── cálculos ───────── */
export function calcularMetricas(evals, asist) {
  const porCat = CATEGORIAS.map((c) => {
    const v = evals.map((e) => Number(e[c.id])).filter(Number.isFinite);
    const valor = v.length ? Math.round(prom(v)) : (VALORES_RESPALDO[c.id] ?? null);
    return { ...c, valor };
  });

  const semana = (i) => {
    const desde = iso(hace(7 * (i + 1) - 1));
    const hasta = iso(hace(7 * i));
    const v = evals
      .filter((e) => dia10(e.fecha) >= desde && dia10(e.fecha) <= hasta)
      .flatMap((e) => CATEGORIAS.map((c) => Number(e[c.id])).filter(Number.isFinite));
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

/* ───────── datos quemados (respaldo cuando no hay BD) ───────── */
export const DEMO_BASE = (() => {
  const estados = ['aprobado','aprobado','aprobado','reprobado','aprobado','aprobado','aprobado','reprobado','aprobado','reprobado','reprobado','aprobado'];
  const evals = [62, 68, 74, 80].map((b, w) => ({
    fecha: iso(hace(3 + 7 * (3 - w))), apropiadas: b + 8, avanzada: b + 12, elite: b - 6,
  }));

  // Los entrenos demo caen Mar/Jue/Sáb (ver demoEntrenos). La asistencia demo
  // se genera SOLO para esos días, y de esos, 2 quedan en rojo (falté).
  const diasEntrenoDemo = Array.from({ length: 60 }, (_, i) => hace(i))
    .filter((f) => [2, 4, 6].includes(f.getDay()))
    .sort((a, b) => a - b); // de más antiguo a más reciente

  // Se eligen entre los más recientes para que caigan en el mes visible por defecto
  const INDICES_FALTA = [diasEntrenoDemo.length - 3, diasEntrenoDemo.length - 8];
  const asist = diasEntrenoDemo.map((f, i) => ({
    fecha: iso(f),
    presente: !INDICES_FALTA.includes(i),
  }));

  const y = new Date().getFullYear();
  return {
    yo: { id: 'demo', nombre: 'Gabriela Deaquiz', id_nivel: 1, foto: null },
    nivel: { id: 1, nombre: 'Nivel 3 Magic' },
    asist,
    evals,
    habilidades: estados.map((estado) => ({ estado })),
    pagos: [
      { mes: 'Agosto', valor: 120000, estado: 'pagado', fecha_pago: iso(hace(20)), fecha_vencimiento: iso(hace(15)) },
      { mes: 'Septiembre', valor: 120000, estado: 'pendiente', fecha_pago: null, fecha_vencimiento: iso(new Date(Date.now() + 8 * 864e5)) },
    ],
    torneos: [
      { id: 'universal', nombre: 'Torneo Universal', fecha: `${y}-10-25`, lugar: 'Bogotá - Colegio San Viator' },
      { id: 'nfinity', nombre: 'Torneo Nfinity League', fecha: `${y}-11-20`, lugar: 'Bogotá - City Hall' },
      { id: 'summer', nombre: 'Torneo Summer', fecha: `${y}-12-10`, lugar: 'Tocaima - Parque acuático' },
      { id: 'xiua', nombre: 'Torneo Xiua', fecha: `${y + 1}-01-29`, lugar: 'Sibaté - Coliseo' },
      { id: 'allcheer', nombre: 'ALLCHEER Nacional', fecha: `${y + 1}-03-14`, lugar: 'Medellín - Atanasio' },
      { id: 'copa', nombre: 'Copa Colombia', fecha: `${y + 1}-04-18`, lugar: 'Cali - Coliseo El Pueblo' },
    ],
    inscritos: ['universal'],
    pqrs: [{ estado: 'respondida' }, { estado: 'respondida' }, { estado: 'proceso' }, { estado: 'pendiente' }],
    errores: [],
  };
})();

const TIPOS_ENTRENO = ['Bailes', 'Gimnasia', 'Partner'];

function demoEntrenos(desde, hasta) {
  const out = [];
  const fin = new Date(`${hasta}T00:00:00`);
  for (let d = new Date(`${desde}T00:00:00`); d <= fin; d.setDate(d.getDate() + 1)) {
    if (![2, 4, 6].includes(d.getDay())) continue;
    const n = d.getDate();
    const s = [{ t: TIPOS_ENTRENO[n % 3], i: '16:00:00', f: '17:30:00' }];
    if (n % 4 === 0) s.push({ t: TIPOS_ENTRENO[(n + 1) % 3], i: '17:30:00', f: '19:00:00' });
    s.forEach((x, k) => out.push({
      id: `${iso(d)}-${k}`, id_nivel: 1, titulo: x.t, fecha: iso(d), hora_inicio: x.i, hora_fin: x.f,
    }));
  }
  return out;
}