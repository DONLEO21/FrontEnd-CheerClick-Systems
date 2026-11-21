import { apiClient } from "./client";

/** Notificaciones del usuario (/api/notificaciones). */
export const notificacionesApi = {
  list: (params) => apiClient.get("/notificaciones", { params }),
  contar: () => apiClient.get("/notificaciones/no-leidas"),
  marcarLeida: (id) => apiClient.patch(`/notificaciones/${id}/leida`),
  marcarTodasLeidas: () => apiClient.patch("/notificaciones/leer-todas"),
};
