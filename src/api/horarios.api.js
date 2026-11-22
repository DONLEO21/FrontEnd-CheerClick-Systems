import { apiClient } from "./client";

/** Horarios de entrenamiento (/api/horarios). */
export const horariosApi = {
  list: (params) => apiClient.get("/horarios", { params }),
  /** Días de sesión del nivel, no futuros: GET /horarios/sesiones?nivelId=&hasta=hoy&limite= (admin y entrenador). */
  sesiones: (params) => apiClient.get("/horarios/sesiones", { params }),
  getById: (id) => apiClient.get(`/horarios/${id}`),
  create: (data) => apiClient.post("/horarios", data),
  update: (id, data) => apiClient.patch(`/horarios/${id}`, data),
  remove: (id) => apiClient.delete(`/horarios/${id}`),
};
