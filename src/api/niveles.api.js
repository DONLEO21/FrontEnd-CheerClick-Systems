import { apiClient } from "./client";

/** Niveles (/api/niveles). Inhabilitar = update con { estado: 'Inactivo' }. */
export const nivelesApi = {
  list: (params) => apiClient.get("/niveles", { params }),
  listPublico: () => apiClient.get("/niveles/publico", { publico: true }),
  getById: (id) => apiClient.get(`/niveles/${id}`),
  create: (data) => apiClient.post("/niveles", data),
  update: (id, data) => apiClient.patch(`/niveles/${id}`, data),
};
