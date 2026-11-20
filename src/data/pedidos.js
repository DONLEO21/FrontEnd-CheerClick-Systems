// Helpers compartidos por los módulos de pedidos (atleta y admin)

// Efectivo: se paga al recoger el pedido en el club. No lleva QR ni comprobante.
export const METODO_EFECTIVO = { id: "efectivo", nombre: "Efectivo" };

export const formatoCOP = (valor) => `$${Number(valor || 0).toLocaleString("es-CO")}`;

// Fecha local en formato AAAA-MM-DD (toISOString usaría UTC y puede adelantar el día)
export const hoyISO = () => {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
};

// "2026-04-02" -> Date local (new Date("2026-04-02") se interpreta en UTC y retrocede un día)
export const parsearFecha = (iso) => new Date(`${iso}T00:00:00`);

export const fechaCorta = (iso) => (iso ? parsearFecha(iso).toLocaleDateString("es-CO") : "—");

export const unidadesPedido = (pedido) =>
  (pedido.items ?? []).reduce((suma, i) => suma + (Number(i.cantidad) || 0), 0);

export const totalPedido = (pedido) =>
  pedido.total ??
  (pedido.items ?? []).reduce((suma, i) => suma + Number(i.precioUnitario) * Number(i.cantidad), 0);

export const esPagoDigital = (pedido) => !!pedido.metodoPagoId && pedido.metodoPagoId !== METODO_EFECTIVO.id;

// Un mismo producto en otra talla es otra línea del carrito
export const claveItem = ({ implementoId, grupoTalla, talla }) =>
  `${implementoId}|${grupoTalla ?? ""}|${talla}`;
