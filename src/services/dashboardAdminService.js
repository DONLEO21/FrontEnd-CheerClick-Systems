import { mensualidadesApi } from "../api/mensualidades.api";
import { listarCompetencias } from "./horariosService";
import { listarPqrs } from "./pqrsService";
import { getPedidos } from "./PedidosService";

// Datos del dashboard del administrador, calculados con los endpoints que ya existen
// (/mensualidades, /competencias, /pqrs, /solicitud). No hay /dashboard/* en el backend: no hacen falta.

const hoyISO = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

/** Mensualidades del mes en curso por estado: { pagado, pendiente, vencido } (vencido = pendiente con fecha límite pasada). */
export async function cargarResumenPagos() {
  const { data } = await mensualidadesApi.list();
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);
  const delMes = (data ?? []).filter((m) => String(m.fechaGeneracion ?? "").slice(0, 7) === mesActual);
  const conteo = { pagado: 0, pendiente: 0, vencido: 0 };
  for (const m of delMes) {
    const estado = m.pago?.estado ?? "Pendiente";
    if (estado === "Pagado") conteo.pagado += 1;
    else if (estado === "Vencido" || (m.fechaVencimiento && String(m.fechaVencimiento).slice(0, 10) < hoy)) conteo.vencido += 1;
    else conteo.pendiente += 1;   // incluye "Pendiente de confirmación" (efectivo por confirmar)
  }
  return { ...conteo, total: delMes.length };
}

/** Próximos campeonatos activos (fecha de hoy en adelante), el más cercano primero. */
export async function cargarProximosCampeonatos() {
  const hoy = hoyISO();
  return (await listarCompetencias())
    .filter((c) => c.activa && c.fecha && c.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Novedades reales: PQRS sin resolver, pedidos de implementos pendientes y pagos en efectivo por confirmar. */
export async function cargarNovedades() {
  const [pqrs, pedidos, mens] = await Promise.all([
    listarPqrs().catch(() => []),
    getPedidos().catch(() => []),
    mensualidadesApi.list().then((r) => r.data ?? []).catch(() => []),
  ]);
  const novedades = [
    ...pqrs.filter((p) => p.estado === "pendiente" && !p.inhabilitada).map((p) => ({
      id: `pqrs-${p.id}`, tipo: "pqrs", titulo: "Nueva PQRS registrada", detalle: `${p.radicado} · ${p.remitente || "Sin remitente"}`, fecha: p.fecha,
    })),
    ...pedidos.filter((p) => p.estado === "Pendiente").map((p) => ({
      id: `pedido-${p.id}`, tipo: "pedido", titulo: "Pedido de implementos por revisar", detalle: `${p.codigo || "—"} · ${p.atleta}`, fecha: p.fecha,
    })),
    ...mens.filter((m) => m.pago?.estado === "Pendiente de confirmación").map((m) => ({
      id: `efectivo-${m._id}`, tipo: "pago", titulo: "Pago en efectivo por confirmar", detalle: `${m.pago?.codigo || "—"} · ${[m.usuario?.nombre, m.usuario?.apellido].filter(Boolean).join(" ")}`,
      fecha: String(m.pago?.fechaPago ?? m.fechaGeneracion ?? "").slice(0, 10),
    })),
  ];
  return novedades.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
}
