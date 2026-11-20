import { apiClient } from "./client";

/** Métodos de pago (/api/metodo-pago). */
export const metodosPagoApi = {
  list: (params) => apiClient.get("/metodo-pago", { params }),
  getById: (id) => apiClient.get(`/metodo-pago/${id}`),
  create: (data) => apiClient.post("/metodo-pago", data),
  update: (id, data) => apiClient.patch(`/metodo-pago/${id}`, data),
  remove: (id) => apiClient.delete(`/metodo-pago/${id}`),
};
