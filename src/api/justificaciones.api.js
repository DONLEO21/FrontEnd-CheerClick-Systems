import { apiClient } from "./client";

/** Justificaciones de inasistencia (/api/justificacion). */
export const justificacionesApi = {
  list: (params) => apiClient.get("/justificacion", { params }),
  create: (data) => apiClient.post("/justificacion", data),
  /** Soporte adjunto (archivo privado, con sesión): devuelve un Blob. GET /justificacion/:id/archivo */
  archivo: (id) => apiClient.get(`/justificacion/${id}/archivo`, { responseType: "blob" }),
  update: (id, data) => apiClient.patch(`/justificacion/${id}`, data),
  remove: (id) => apiClient.delete(`/justificacion/${id}`),
};
