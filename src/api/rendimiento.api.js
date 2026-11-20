import { apiClient } from "./client";

/** Rendimiento deportivo (/api/rendimiento). */
export const rendimientoApi = {
  resumen: (params) => apiClient.get("/rendimiento/resumen", { params }),
  list: (params) => apiClient.get("/rendimiento", { params }),
  getAtleta: (id) => apiClient.get(`/rendimiento/atleta/${id}`),
  guardarAtleta: (id, data) => apiClient.put(`/rendimiento/atleta/${id}`, data),
  create: (data) => apiClient.post("/rendimiento", data),
  update: (id, data) => apiClient.patch(`/rendimiento/${id}`, data),
  remove: (id) => apiClient.delete(`/rendimiento/${id}`),
};
