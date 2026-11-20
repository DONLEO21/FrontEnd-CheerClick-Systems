import { apiClient } from "./client";

/** Habilidades (/api/habilidad). No hay DELETE: deshabilitar/habilitar = update con { estado }. */
export const habilidadesApi = {
  list: (params) => apiClient.get("/habilidad", { params }),
  getById: (id) => apiClient.get(`/habilidad/${id}`),
  create: (data) => apiClient.post("/habilidad", data),
  update: (id, data) => apiClient.patch(`/habilidad/${id}`, data),
};
