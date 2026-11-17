const API_URL = "http://localhost:3001/metodosPago";

// Cada método: { id, nombre, activo, titular, llave, qr }
// El atleta solo LEE (getMetodosPago) y muestra los activos con su QR y llave al pagar.
// La pantalla de admin para editarlos usará actualizarMetodoPago.
export async function getMetodosPago() {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error("No se pudieron cargar los métodos de pago.");
  return res.json();
}

export async function actualizarMetodoPago(id, datos) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
  if (!res.ok) throw new Error("No se pudo guardar el método de pago.");
  return res.json();
}
