// Constantes de INTERFAZ del dashboard del administrador (rutas, colores y límites). Los datos salen de la API
// (services/dashboardAdminService.js).

// Ruta real de la pantalla de cuentas (App.jsx)
export const RUTA_CUENTAS = "/admin/usuarios";

// Rutas de las pantallas (App.jsx)
export const RUTA_HORARIOS = "/admin/horarios";
// Supuesto: "Novedades" (PQRS, pedidos, pagos en efectivo) lleva a PQRS, que es su primera fuente.
export const RUTA_NOVEDADES = "/admin/pqrs";
export const RUTA_PAGOS = "/admin/pagos";

// Máximo de elementos visibles por tarjeta en el dashboard
export const MAX_ITEMS = 3;

// Estados de pago y su color en la torta (la cantidad viene de la API)
export const ESTADOS_PAGO = [
  { id: "pagado", nombre: "Pagado", color: "#d71920" },
  { id: "pendiente", nombre: "Pendiente", color: "#c9c9c9" },
  { id: "vencido", nombre: "Vencido", color: "#4d4d4d" },
];
