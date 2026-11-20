import { apiClient } from "./client";

/** Horarios de entrenamiento (/api/horarios). */
export const horariosApi = {
  list: (params) => apiClient.get("/horarios", { params }),
  getById: (id) => apiClient.get(`/horarios/${id}`),
  create: (data) => apiClient.post("/horarios", data),
  update: (id, data) => apiClient.patch(`/horarios/${id}`, data),
  remove: (id) => apiClient.delete(`/horarios/${id}`),
};
