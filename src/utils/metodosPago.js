// Reglas de los métodos de pago (ver también el modelo metodoPago del backend)
const sinTildes = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** "Efectivo" nunca lleva QR ni comprobante. */
export const esMetodoEfectivo = (nombre) => sinTildes(nombre) === "efectivo";

/** "Pago presencial" ya no existe como método: se reemplazó por "Efectivo". */
export const esMetodoPresencial = (nombre) => /^pago\s+presencial/.test(sinTildes(nombre));

/** Método "digital" = cualquiera que no sea efectivo ni el antiguo "pago presencial". */
export const esMetodoDigital = (nombre) => !esMetodoEfectivo(nombre) && !esMetodoPresencial(nombre);

/** Tipo de método para elegir su icono: efectivo | banco | movil | tarjeta (se deduce del nombre). */
export const tipoMetodoPago = (nombre) => {
  const n = sinTildes(nombre);
  if (/^efectivo/.test(n)) return "efectivo";
  if (/(banco|bancolombia|davivienda|bbva|transferencia|pse|ahorros|corriente|cuenta)/.test(n)) return "banco";
  if (/(nequi|daviplata|movil|celular|billetera|dale|llave)/.test(n)) return "movil";
  return "tarjeta";
};
