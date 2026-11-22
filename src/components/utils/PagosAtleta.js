export const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export const pesos = (n) =>
  (n ?? 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

// Ordena mensualidades de más reciente a más antigua usando el nombre del mes.
export const ordenarPorMes = (lista) =>
  [...lista].sort((a, b) => MESES.indexOf(b.mes) - MESES.indexOf(a.mes));

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

export function calcularResumen(mensualidades) {
  const pendientes = mensualidades.filter((m) => m.estado !== "pagado");
  const pagadas = mensualidades.filter((m) => m.estado === "pagado");
  const proxima = ordenarPorMes(pendientes).at(-1);

  return {
    totalPendiente: pendientes.reduce((s, m) => s + m.valor, 0),
    totalPagado: pagadas.reduce((s, m) => s + m.valor, 0),
    mesesAlDia: `${pagadas.length} / ${mensualidades.length}`,
    proximoVencimiento: proxima ? proxima.mes : "Al día",
  };
}

// Notificaciones derivadas de las mensualidades (no hay colección propia).
export function construirNotificaciones(mensualidades) {
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