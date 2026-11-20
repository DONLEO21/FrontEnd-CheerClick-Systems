import { apiClient } from "./client";

/** Justificaciones de inasistencia (/api/justificacion). */
export const justificacionesApi = {
  list: (params) => apiClient.get("/justificacion", { params }),
  create: (data) => apiClient.post("/justificacion", data),
  update: (id, data) => apiClient.patch(`/justificacion/${id}`, data),
  remove: (id) => apiClient.delete(`/justificacion/${id}`),
};
