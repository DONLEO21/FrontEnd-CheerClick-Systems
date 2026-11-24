import { apiClient } from "./client";

/** Mensualidades (/api/mensualidades). */
export const mensualidadesApi = {
  list: (params) => apiClient.get("/mensualidades", { params }),
  miPlan: () => apiClient.get("/mensualidades/mi-plan"),
  getById: (id) => apiClient.get(`/mensualidades/${id}`),
  create: (data) => apiClient.post("/mensualidades", data),
  update: (id, data) => apiClient.patch(`/mensualidades/${id}`, data),
};
