// Roles de un usuario en la interfaz (en minúsculas: 'administrador' | 'entrenador' | 'atleta').
// `rol` es el principal y `rolesAdicionales` (p. ej. ['entrenador'] en un administrador que también entrena) son extras.
// Esto solo decide QUÉ SE MUESTRA: la autorización real la valida siempre el backend con los roles guardados en la base de datos.

export const ETIQUETA_ROL = { administrador: 'Administrador', entrenador: 'Entrenador', atleta: 'Atleta' }

/** Todos los roles del usuario, sin repetir (el principal primero). */
export const rolesDe = (usuario) => [...new Set([usuario?.rol, ...(usuario?.rolesAdicionales ?? [])].filter(Boolean))]

/** ¿El usuario tiene este rol (principal o adicional)? */
export const tieneRol = (usuario, rol) => rolesDe(usuario).includes(rol)

/** ¿Tiene más de un rol (y por eso debe ver el selector de rol)? */
export const tieneVariosRoles = (usuario) => rolesDe(usuario).length > 1
