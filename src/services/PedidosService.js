const API_URL = "http://localhost:3001/pedidos";

async function parchar(id, cambios, mensajeError) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  });
  if (!res.ok) throw new Error(mensajeError);
  return res.json();
}

export async function getPedidos() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("No se pudieron cargar los pedidos.");
  return res.json();
}

export async function getPedido(id) {
  const res = await fetch(`${API_URL}/${id}`);
  if (!res.ok) throw new Error("No se pudo cargar el pedido.");
  return res.json();
}

// Un pedido agrupa todos los productos del carrito: { items: [...], total, metodoPago, ... }
// (json-server asigna el id)
export async function crearPedido(datos) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      estado: "Pendiente",
      motivoRechazo: "",
      recibido: false,
      ...datos,
    }),
  });
  if (!res.ok) throw new Error("No se pudo enviar el pedido.");
  return res.json();
}

export const cancelarPedido = (pedido) =>
  parchar(pedido.id, { estado: "Cancelado" }, "No se pudo cancelar el pedido.");

export const marcarRecibido = (pedido) =>
  parchar(pedido.id, { recibido: true }, "No se pudo actualizar el pedido.");

export const aprobarPedido = (pedido) =>
  parchar(pedido.id, { estado: "Aprobado", motivoRechazo: "" }, "No se pudo aprobar el pedido.");

export const rechazarPedido = (pedido, motivo) =>
  parchar(pedido.id, { estado: "Rechazado", motivoRechazo: motivo }, "No se pudo rechazar el pedido.");

// Marca un producto del pedido como ya reseñado (se lee el pedido fresco para no pisar cambios)
export async function marcarResenaEnviada(pedidoId, item) {
  const actual = await getPedido(pedidoId);
  const items = (actual.items ?? []).map((i) =>
    i.implementoId === item.implementoId && i.talla === item.talla && i.grupoTalla === item.grupoTalla
      ? { ...i, resenaEnviada: true }
      : i
  );
  return parchar(pedidoId, { items }, "No se pudo registrar la reseña.");
}
