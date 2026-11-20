import { apiClient } from "./client";

/** Planes asociados (/api/plan-asociado). No hay DELETE: deshabilitar = update con { estado: 'Inactivo' }. */
export const planesApi = {
  list: (params) => apiClient.get("/plan-asociado", { params }),
  listPublico: () => apiClient.get("/plan-asociado/publico", { publico: true }),
  getById: (id) => apiClient.get(`/plan-asociado/${id}`),
  create: (data) => apiClient.post("/plan-asociado", data),
  update: (id, data) => apiClient.patch(`/plan-asociado/${id}`, data),
};
