import { apiClient } from "./client";

/** Pagos (/api/pagos). El comprobante viaja en el campo `comprobante` del cuerpo. */
export const pagosApi = {
  list: (params) => apiClient.get("/pagos", { params }),
  getById: (id) => apiClient.get(`/pagos/${id}`),
  create: (data) => apiClient.post("/pagos", data),
  update: (id, data) => apiClient.patch(`/pagos/${id}`, data),
};
