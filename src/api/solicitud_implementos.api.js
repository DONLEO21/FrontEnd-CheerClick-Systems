import { apiClient } from "./client";

/** Líneas de pedido (/api/solicitudImplementos). */
export const solicitudImplementosApi = {
  list: (params) => apiClient.get("/solicitudImplementos", { params }),
  create: (data) => apiClient.post("/solicitudImplementos", data),
  update: (id, data) => apiClient.patch(`/solicitudImplementos/${id}`, data),
};
