// Título de la pestaña del navegador por ruta: "<Módulo> | CheerClick". Los nombres de los módulos salen de los menús
// de cada rol (src/data/menu*.js), así que no se repiten a mano en las páginas. Una ruta que no esté aquí usa "CheerClick".
import menuAdmin from "../data/menuAdmin";
import menuAtleta from "../data/menuAtleta";
import menuEntrenador from "../data/menuEntrenador";

export const NOMBRE_APP = "CheerClick";

/** "Pagos" -> "Pagos | CheerClick"; sin nombre -> "CheerClick". */
export const tituloCompleto = (nombre) => (nombre ? `${nombre} | ${NOMBRE_APP}` : NOMBRE_APP);

// Rutas que no están en un menú
const EXTRA = {
  "/": "Inicio",
  "/acceso": "Iniciar sesión",
  "/admin": "Dashboard",
  "/entrenador": "Dashboard",
  "/atleta": "Dashboard",
};

// Pantallas internas de /acceso (AuthPage las controla con estado, no con rutas)
export const TITULOS_ACCESO = {
  login: "Iniciar sesión",
  registro: "Registro",
  pendiente: "Cuenta pendiente",
  "recuperar-correo": "Recuperar contraseña",
  "recuperar-codigo": "Recuperar contraseña",
  "recuperar-clave": "Recuperar contraseña",
  "recuperar-exito": "Recuperar contraseña",
};

// ruta (en minúsculas) -> nombre del módulo
export const TITULOS_RUTAS = Object.fromEntries([
  ...[...menuAdmin, ...menuAtleta, ...menuEntrenador].map((m) => [m.href.toLowerCase(), m.titulo]),
  ...Object.entries(EXTRA),
]);

const PREFIJOS = Object.keys(TITULOS_RUTAS).filter((r) => r.split("/").length > 2).sort((a, b) => b.length - a.length);

/**
 * Nombre del módulo de una ruta. Insensible a mayúsculas, ignora la barra final y soporta rutas con parámetros
 * (/admin/usuarios/123 -> el de /admin/usuarios). Devuelve null si la ruta no está en el mapa.
 */
export function nombreDeRuta(pathname) {
  const ruta = String(pathname ?? "").toLowerCase().replace(/\/+$/, "") || "/";
  if (TITULOS_RUTAS[ruta]) return TITULOS_RUTAS[ruta];
  const prefijo = PREFIJOS.find((p) => ruta.startsWith(`${p}/`));
  return prefijo ? TITULOS_RUTAS[prefijo] : null;
}
