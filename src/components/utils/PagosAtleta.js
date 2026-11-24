export const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const pesos = (n) =>
  (n ?? 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

// Ordena mensualidades de más reciente a más antigua por periodo 'AAAA-MM' (así diciembre de 2026 va antes que enero de 2027).
export const ordenarPorMes = (lista) =>
  [...lista].sort((a, b) => (b.periodo || "").localeCompare(a.periodo || "") || MESES.indexOf(b.mes) - MESES.indexOf(a.mes));

/** '2026-11-29' -> '29 nov 2026' (sin correrse de día por zona horaria). */
export const fechaCorta = (iso) =>
  iso ? new Date(`${iso}T12:00:00Z`).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).replace(/\./g, "") : "—";

export const ESTADOS = {
  pagado:    { clase: "esta-paga", texto: "Pagado" },
  pendiente: { clase: "esta-pen",  texto: "Pendiente" },
  vencido:   { clase: "esta-ven",  texto: "Vencido" },
  rechazado: { clase: "esta-ven",  texto: "Rechazado" },
};

/**
 * REGLA ÚNICA de qué puede hacer el atleta con una mensualidad (la usan la tarjeta, la página y el modal de pago).
 * El backend la repite con un 409 (la defensa real); aquí solo se evita ofrecer lo que no se puede hacer.
 *
 *   estado                                   acción
 *   pagado                                   "registrado"  -> Ver comprobante / "Pago registrado" (sin pagar)
 *   pendiente o vencido, ya enviado          "verificando" -> "Pago en verificación" (deshabilitado)
 *   rechazado                                "reintentar"  -> Pagar de nuevo (muestra el motivo)
 *   pendiente o vencido, sin enviar          "pagar"       -> Pagar mensualidad
 */
export function accionDePago(m) {
  if (m.estado === "pagado") return "registrado";
  if (m.estado === "rechazado") return "reintentar";
  if (m.enVerificacion || m.efectivoSolicitado) return "verificando";
  return "pagar";
}

/** ¿Se puede abrir el pago de esta mensualidad? Solo "pagar" y "reintentar". */
export const puedePagar = (m) => ["pagar", "reintentar"].includes(accionDePago(m));

/** Mensaje compacto cuando NO se puede pagar. */
export const motivoNoPuedePagar = (m) =>
  accionDePago(m) === "registrado" ? "Esta mensualidad ya está pagada." : "Esta mensualidad ya tiene un pago en verificación.";

/**
 * Tarjetas de resumen, todas con datos reales:
 *  - Total pendiente: suma de lo que aún no está pagado (pendiente, en verificación, vencido o rechazado).
 *  - Pagado este año / Meses al día: solo las mensualidades del año en curso.
 *  - Próximo vencimiento: la FECHA de vencimiento de la mensualidad pendiente más próxima; «Al día» solo si no queda nada
 *    pendiente (y «—» si todavía no existe ninguna mensualidad).
 */
export function calcularResumen(mensualidades, anio = new Date().getFullYear()) {
  const pendientes = mensualidades.filter((m) => m.estado !== "pagado");
  const delAnio = mensualidades.filter((m) => (m.periodo || "").startsWith(String(anio)));
  const pagadasDelAnio = delAnio.filter((m) => m.estado === "pagado");
  const proxima = [...pendientes].filter((m) => m.vencimiento).sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))[0];

  return {
    totalPendiente: pendientes.reduce((s, m) => s + m.valor, 0),
    totalPagado: pagadasDelAnio.reduce((s, m) => s + m.valor, 0),
    mesesAlDia: `${pagadasDelAnio.length} / ${delAnio.length}`,
    proximoVencimiento: pendientes.length === 0 ? (mensualidades.length === 0 ? "—" : "Al día") : fechaCorta(proxima?.vencimiento),
  };
}

// «Notificaciones recientes»: los avisos REALES de pago que genera el sistema (p. ej. «Tienes pendiente tu mensualidad de
// Noviembre 2026: $120.000»); si todavía no hay ninguno, se derivan del estado de las mensualidades.
export function construirNotificaciones(mensualidades, avisos = []) {
  if (avisos.length > 0) {
    return avisos.slice(0, 4).map((n) => ({
      id: n.id, tipo: n.leida ? "ok" : "aviso", texto: n.mensaje,
      fecha: n.fecha ? new Date(n.fecha).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" }).replace(/\./g, "") : "",
    }));
  }
  return ordenarPorMes(mensualidades).slice(0, 4).map((m) => {
    if (m.estado === "pagado")
      return { id: m.id, tipo: "ok", texto: `${m.mes} pago registrado exitosamente`, fecha: m.fechaPago ?? "" };
    if (m.efectivoSolicitado)
      return { id: m.id, tipo: "aviso", texto: `${m.mes}: pago en efectivo pendiente de confirmación.`, fecha: m.fechaPago ?? m.generacion };
    if (m.estado === "vencido")
      return { id: m.id, tipo: "alerta", texto: `${m.mes} se encuentra vencido.`, fecha: m.generacion };
    return { id: m.id, tipo: "aviso", texto: `${m.mes} está pendiente. Recuerda pagar.`, fecha: m.generacion };
  });
}