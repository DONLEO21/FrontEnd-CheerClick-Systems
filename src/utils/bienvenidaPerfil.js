// Marca «ya vio la bienvenida» (por usuario, en este navegador). Como el backend no guarda una marca de "aviso visto":
// TODO(backend): campo `perfilBienvenidaVista` (o similar) para recordarlo entre dispositivos.
import { almacenSesion } from '../api/client'

const clave = (id) => `cheerclick:bienvenida-perfil:${id}`

export const bienvenidaYaVista = (id) => { try { return localStorage.getItem(clave(id)) === '1' } catch { return false } }
export const marcarBienvenidaVista = (id) => { try { localStorage.setItem(clave(id), '1') } catch { /* sin almacenamiento: se mostrará de nuevo */ } }

/** ¿Está (o debe estar) abierta la bienvenida? Lo consulta PanelLayout para no apilar otro modal encima. */
export const bienvenidaPendiente = () => {
  const u = almacenSesion.usuario()
  return !!u?.id && u.perfilCompleto === false && !bienvenidaYaVista(u.id)
}
