import { esMetodoPresencial } from '../utils/metodosPago'
import { metodosPagoApi } from '../api/metodos_pago.api'
import { mensualidadesApi } from '../api/mensualidades.api'
import { planesApi } from '../api/planes.api'
import { competenciasApi } from '../api/competencias.api'
import { inscripcionesCompetenciasApi } from '../api/inscripciones_competencias.api'
import { pagosApi } from '../api/pagos.api'
// Pagos de mensualidades y de competencias.
// Backend: /api/mensualidades, /api/pagos, /api/plan-asociado, /api/metodo-pago, /api/competencias, /api/inscripciones_competencias

const idDe = (x) => (x && typeof x === 'object' ? x._id : x)
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const mesDe = (f) => { const m = MESES[new Date(f).getUTCMonth()] ?? ''; return m.charAt(0).toUpperCase() + m.slice(1) }
const fechaLarga = (f) => { if (!f) return ''; const d = new Date(f); return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
const fechaISO = (f) => (f ? String(f).slice(0, 10) : null)
const nombreDe = (u) => (u ? [u.nombre, u.apellido].filter(Boolean).join(' ') : '')

/* ───────── métodos de pago ───────── */
export async function listarMetodosPago() {
  const { data } = await metodosPagoApi.list()
  return (data ?? []).filter((m) => !esMetodoPresencial(m.nombre)).map((m) => ({ id: m._id, nombre: m.nombre, qr: m.qr ?? '' }))
}

// TODO(backend): los métodos del formulario ("Efectivo", "Billetera Digital") deben existir con ese nombre en /metodo-pago.
async function idMetodo(nombre) {
  const lista = await listarMetodosPago()
  const buscado = (nombre ?? '').trim().toLowerCase()
  const m = lista.find((x) => x.nombre.trim().toLowerCase() === buscado)
  if (!m) throw new Error(`El método de pago "${nombre}" no está registrado en el sistema.`)
  return m.id
}

/* ───────── mensualidades ───────── */
const estadoDe = (e) => (e ?? 'Pendiente').toLowerCase() // pagado | pendiente | vencido

export function mensualidadDesdeApi(m, metodos = []) {
  const pago = m.pago && typeof m.pago === 'object' ? m.pago : {}
  const metodo = pago.metodoPago && typeof pago.metodoPago === 'object' ? pago.metodoPago.nombre : metodos.find((x) => x.id === pago.metodoPago)?.nombre
  return {
    id: m._id,
    // código consecutivo PG000 del pago (backend); mientras no exista se muestra el id
    codigo: pago.codigo ?? m._id,
    pagoId: idDe(m.pago),
    atletaId: idDe(m.usuario),
    mes: mesDe(m.fechaGeneracion),
    plan: m.planAsociado?.nombre ?? '',
    estado: estadoDe(pago.estado),
    registrado: pago.estado === 'Pagado',
    valor: m.valor,
    generacion: fechaLarga(m.fechaGeneracion),
    comprobante: pago.comprobante ?? '',
    referencia: m.numReferencia ?? '',
    metodo: metodo ?? '',
    fechaPago: fechaISO(pago.fechaPago),
    observaciones: pago.observaciones ?? '',
  }
}

/* ───────── ADMIN ───────── */
export async function cargarPagosAdmin() {
  const [mens, planes, comps, insc, metodos] = await Promise.all([
    mensualidadesApi.list(),
    planesApi.list(),
    competenciasApi.list(),
    inscripcionesCompetenciasApi.list(),
    listarMetodosPago(),
  ])

  const atletas = new Map()
  const registrar = (u) => { if (u && typeof u === 'object') atletas.set(u._id, { id: u._id, nombre: nombreDe(u), email: u.email }) }

  const mensualidades = (mens.data ?? []).map((m) => { registrar(m.usuario); return mensualidadDesdeApi(m, metodos) })
  const pagosCompetencia = (insc.data ?? []).map((i) => {
    registrar(i.usuario)
    const p = i.pago && typeof i.pago === 'object' ? i.pago : {}
    return {
      id: i._id,
      codigo: p.codigo ?? i._id,
      pagoId: idDe(i.pago),
      competenciaId: idDe(i.competencia),
      atletaId: idDe(i.usuario),
      valor: p.valorTotal ?? 0,
      estado: p.estado === 'Pagado' ? 'validado' : 'por validar',
      generacion: fechaLarga(p.fechaGenera),
      fechaPago: fechaISO(p.fechaPago),
      comprobante: p.comprobante ?? '',
      // TODO(backend): las inscripciones no guardan número de referencia.
      referencia: '',
      metodo: metodos.find((x) => x.id === p.metodoPago)?.nombre ?? '',
      observaciones: p.observaciones ?? '',
    }
  })

  const competencias = (comps.data ?? []).map((c) => ({
    id: c._id,
    nombre: c.nombre,
    nivel: c.nivel?.nombre ?? '',
    // TODO(backend): no existe "equipo/temporada" ni el total de atletas convocados ("inscritos") por competencia.
    equipo: '',
    fecha: `${new Date(c.fechaCompetencia).getUTCDate()} ${MESES[new Date(c.fechaCompetencia).getUTCMonth()]}`,
    ubicacion: c.lugar ?? '',
    precio: c.precioinscripcion ?? 0,
    inscritos: (insc.data ?? []).filter((i) => idDe(i.competencia) === c._id).length,
  }))

  return {
    atletas: [...atletas.values()],
    mensualidades,
    planes: (planes.data ?? []).map((p) => ({ id: p._id, nombre: p.nombre, valor: p.valor })),
    metodos,
    competencias,
    pagosCompetencia,
  }
}

// Registra (o valida) un pago: datos = { fechaPago, metodo, observaciones }
export async function registrarPago(pagoId, datos) {
  await pagosApi.update(pagoId, {
    estado: 'Pagado',
    fechaPago: datos.fechaPago,
    metodoPago: datos.metodoId ?? await idMetodo(datos.metodo),
    observaciones: datos.observaciones || undefined,
  })
}

export async function obtenerMensualidad(id) {
  const [{ data }, metodos] = await Promise.all([mensualidadesApi.getById(id), listarMetodosPago()])
  return mensualidadDesdeApi(data, metodos)
}

/* ───────── ATLETA ───────── */
export async function cargarPagosAtleta(usuario) {
  const [{ data }, metodos] = await Promise.all([mensualidadesApi.list(), listarMetodosPago()])
  const mensualidades = (data ?? []).map((m) => mensualidadDesdeApi(m, metodos))
  return {
    atleta: { id: usuario.id, nombre: [usuario.nombre, usuario.apellido].filter(Boolean).join(' '), nivel: usuario.nivelNombre ?? '' },
    mensualidades,
  }
}

// El atleta envía su comprobante: datos = { metodoId, referencia, fechaPago, comprobante }
// Supuesto: no existe un endpoint para subir archivos de pagos; la imagen/PDF (ya comprimida) viaja como
//   data-URL dentro del campo `comprobante`. Requiere que el backend acepte JSON de hasta ~5 MB
//   (express.json({ limit: '5mb' })). TODO(backend): endpoint de subida (multer) y campo de referencia.
//   La referencia se anota en observaciones.
export async function enviarComprobanteMensualidad(m, datos) {
  await pagosApi.update(m.pagoId, {
    comprobante: datos.comprobante,
    fechaPago: datos.fechaPago,
    metodoPago: datos.metodoId ?? await idMetodo(datos.metodo),
    observaciones: `Ref: ${datos.referencia}`,
  })
  return obtenerMensualidad(m.id)
}

// Pago de inscripción a una competencia (desde Horarios del atleta)
// datos: { torneoId, metodo, monto, fechaPago, referencia, comprobante }
export async function enviarPagoCompetencia(usuarioId, datos) {
  const { data: pago } = await pagosApi.create({
    estado: 'Pendiente',
    valorTotal: Number(String(datos.monto ?? '').replace(/[^\d.]/g, '')) || 0,
    fechaGenera: new Date().toISOString(),
    fechaPago: datos.fechaPago,
    comprobante: datos.comprobante || 'sin-comprobante',
    observaciones: datos.referencia ? `Ref: ${datos.referencia}` : undefined,
    metodoPago: await idMetodo(datos.metodo),
    usuario: usuarioId,
  })
  await inscripcionesCompetenciasApi.create({ competencia: datos.torneoId, usuario: usuarioId, pago: pago._id })
  return pago
}
