// Cliente HTTP ÚNICO del frontend (axios). Toda comunicación con el backend pasa por aquí y los
// módulos `*.api.js` de esta carpeta son los únicos que arman rutas. Los componentes NO llaman a
// axios ni a fetch directamente.
//
// ── Forma de las respuestas del backend (verificada en BackEnd-CheerClick_Systems) ──
//   Éxito:  { msg: string, data?: any, token?: string }            → el interceptor devuelve ese cuerpo tal cual
//   Error:  { msg: string }  o  { errors: { campo: 'mensaje' } }  → se lanza un ApiError con mensaje legible
//   Nota: el backend NO envía `success`; el éxito se decide por el código HTTP (2xx) y los errores llegan
//   como excepción (ApiError), así que basta con try/catch.
// ── Autenticación ──
//   El backend lee el JWT de la cabecera `X-Token` (middleware authenticate.middlewares.js), no de Authorization.
// ── CORS ──
//   El backend no habilita CORS. En desarrollo VITE_API_URL queda vacío y Vite reenvía /api (ver vite.config.js).
//   En producción, VITE_API_URL debe ser el origen del backend Y el backend debe permitir ese origen (CORS).

import axios from 'axios';

/** Origen del backend (sin /api). Vacío = mismo origen (proxy de Vite en desarrollo). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '').replace(/\/api$/, '');

/** Llaves de localStorage de la sesión (la clave del token conserva el prefijo del proyecto). */
export const TOKEN_STORAGE_KEY = 'cheerclick:token';
const USUARIO_STORAGE_KEY = 'cheerclick:usuario';
const ROL_ACTIVO_STORAGE_KEY = 'cheerclick:rol-activo';

export const RUTA_LOGIN = '/acceso?view=login';

/** Rutas que NO llevan token ni cierran la sesión si responden 401. */
const RUTAS_PUBLICAS = [
  '/auth/login',
  '/auth/registro',
  '/auth/olvide-contrasena',
  '/auth/reenviar-codigo',
  '/auth/verificar-codigo',
  '/auth/restablecer-contrasena',
  '/niveles/publico',
  '/plan-asociado/publico',
];

const esRutaPublica = (config) =>
  config?.publico === true || RUTAS_PUBLICAS.some((r) => (config?.url ?? '').startsWith(r));

/* ───────── almacenamiento de la sesión (solo este archivo toca localStorage) ───────── */
// Cada cambio de la sesión guardada avisa a la interfaz (guardias de contraseña y de perfil, menú, banner)
export const EVENTO_SESION = 'cheerclick:sesion';
const avisarCambioDeSesion = () => {
  try { window.dispatchEvent(new Event(EVENTO_SESION)); } catch { /* sin ventana (pruebas) */ }
};

export const almacenSesion = {
  token() {
    try { return localStorage.getItem(TOKEN_STORAGE_KEY); } catch { return null; }
  },
  usuario() {
    try { return JSON.parse(localStorage.getItem(USUARIO_STORAGE_KEY) || 'null'); } catch { return null; }
  },
  // Rol con el que el usuario está usando la app (solo importa si tiene más de uno). Es una preferencia de pantalla:
  // el backend nunca confía en ella para autorizar.
  rolActivo() {
    try { return localStorage.getItem(ROL_ACTIVO_STORAGE_KEY); } catch { return null; }
  },
  fijarRolActivo(rol) {
    try { localStorage.setItem(ROL_ACTIVO_STORAGE_KEY, rol); } catch { /* almacenamiento no disponible */ }
  },
  guardar(token, usuario) {
    try {
      if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
      if (usuario) localStorage.setItem(USUARIO_STORAGE_KEY, JSON.stringify(usuario));
    } catch { /* almacenamiento no disponible */ }
    avisarCambioDeSesion();
  },
  // Mezcla datos en el usuario guardado (p. ej. las marcas de los guardias) sin tocar el token
  actualizar(parcial) {
    const usuario = this.usuario();
    if (!usuario) return;
    this.guardar(null, { ...usuario, ...parcial });
  },
  limpiar() {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USUARIO_STORAGE_KEY);
      localStorage.removeItem(ROL_ACTIVO_STORAGE_KEY);
    } catch { /* almacenamiento no disponible */ }
  },
};

/* ───────── errores ───────── */
export class ApiError extends Error {
  /**
   * @param {string} mensaje Texto legible en español
   * @param {number} [status] Código HTTP (0 = sin conexión)
   * @param {object|null} [detalle] Cuerpo de la respuesta (p. ej. { errors: {...} })
   */
  constructor(mensaje, status = 0, detalle = null) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
    this.detalle = detalle;
  }
}

// El backend responde { msg } o { errors: { campo: 'mensaje' } } (o una lista de ellos)
function mensajeDe(cuerpo, status) {
  if (cuerpo?.msg) return cuerpo.msg;
  if (cuerpo?.message) return cuerpo.message;
  const errs = cuerpo?.errors;
  if (errs) {
    const lista = Array.isArray(errs) ? errs.flatMap((e) => Object.values(e ?? {})) : Object.values(errs);
    if (lista.length) return lista.join('. ');
  }
  if (status === 0) return 'Sin conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  if (status === 413) return 'El archivo o los datos enviados son demasiado grandes (máximo 5 MB por archivo).';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404) return 'No se encontró lo que buscabas.';
  if (status >= 500) return 'Error del servidor. Inténtalo de nuevo en unos minutos.';
  return 'No se pudo completar la solicitud.';
}

let redirigiendo = false;
function sesionExpirada() {
  almacenSesion.limpiar();
  if (redirigiendo || window.location.pathname.startsWith('/acceso')) return;
  redirigiendo = true;
  window.location.replace(RUTA_LOGIN);
}

/* ───────── instancia única ───────── */
export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (!esRutaPublica(config)) {
    const token = almacenSesion.token();
    if (token) config.headers['X-Token'] = token;
    // Vista de entrenador: el backend limita los datos a los niveles del usuario (solo restringe, no concede permisos)
    if (almacenSesion.rolActivo() === 'entrenador') config.headers['X-Vista'] = 'entrenador';
  }
  // FormData: el Content-Type (con su boundary) lo calcula el navegador; fijarlo a mano rompe la subida
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete?.('Content-Type');
    delete config.headers['Content-Type'];
  }
  // No se envían parámetros vacíos (?estado=&nivel=)
  if (config.params) {
    config.params = Object.fromEntries(
      Object.entries(config.params).filter(([, v]) => v !== undefined && v !== null && v !== ''),
    );
  }
  return config;
});

apiClient.interceptors.response.use(
  // Se entrega el cuerpo ya desempaquetado: { msg, data, token } (o un Blob en descargas)
  (respuesta) => respuesta.data,
  async (error) => {
    const { response, config } = error;
    if (!response) {
      if (import.meta.env.DEV) console.error('[api] sin respuesta', config?.method?.toUpperCase(), config?.url, error.message);
      throw new ApiError(mensajeDe(null, 0), 0);
    }

    let cuerpo = response.data;
    // En descargas (responseType blob) un error llega como Blob con el JSON dentro
    if (cuerpo instanceof Blob) {
      try { cuerpo = JSON.parse(await cuerpo.text()); } catch { cuerpo = null; }
    }
    // Solo en desarrollo: método, URL, status y cuerpo de la respuesta de cada error (sin el cuerpo enviado: puede llevar archivos)
    if (import.meta.env.DEV) console.error('[api]', config?.method?.toUpperCase(), config?.url, response.status, cuerpo);
    if (response.status === 401 && !esRutaPublica(config)) sesionExpirada();
    // Guardias del backend: NO cierran la sesión; marcan el estado y la interfaz lleva al usuario a la pantalla que corresponde
    if (response.status === 403 && cuerpo?.code === 'CAMBIO_CLAVE_REQUERIDO') almacenSesion.actualizar({ debeCambiarClave: true });
    if (response.status === 403 && cuerpo?.code === 'PERFIL_INCOMPLETO') almacenSesion.actualizar({ perfilCompleto: false, camposFaltantes: cuerpo.camposFaltantes ?? [] });
    throw new ApiError(mensajeDe(cuerpo, response.status), response.status, cuerpo);
  },
);

/**
 * Configuración para subir archivos (FormData). NO fija Content-Type: el navegador lo calcula con su boundary
 * (el interceptor de petición también lo elimina si alguien lo pone a mano).
 */
export const MULTIPART = {};

/** Arma un FormData a partir de { campo: valor }. Omite valores vacíos y archivos de 0 bytes (nunca se envían campos vacíos). */
export function aFormData(campos) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(campos)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof File !== 'undefined' && v instanceof File && v.size === 0) continue;
    fd.append(k, v);
  }
  return fd;
}

/**
 * URL pública de un archivo servido por el backend (p. ej. fotos: "/uploads/fotos/x.jpg").
 * Devuelve "" si no hay ruta, respeta URLs http(s) y antepone API_BASE_URL a las rutas relativas.
 * @param {string} [path]
 * @returns {string}
 */
export function getImageUrl(path) {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export default apiClient;
