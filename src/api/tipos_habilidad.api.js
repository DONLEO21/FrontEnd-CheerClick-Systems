import { apiClient } from "./client";

/** Tipos de habilidad (/api/tipo-habilidad). */
export const tiposHabilidadApi = {
  list: (params) => apiClient.get("/tipo-habilidad", { params }),
  getById: (id) => apiClient.get(`/tipo-habilidad/${id}`),
  create: (data) => apiClient.post("/tipo-habilidad", data),
  update: (id, data) => apiClient.patch(`/tipo-habilidad/${id}`, data),
  remove: (id) => apiClient.delete(`/tipo-habilidad/${id}`),
};
