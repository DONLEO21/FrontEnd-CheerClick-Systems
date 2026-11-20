import { apiClient } from "./client";

/** Pedidos de implementos (/api/solicitud). El carrito vive en el frontend (CarritoContext); al confirmar se crea una solicitud. */
export const solicitudesApi = {
  list: (params) => apiClient.get("/solicitud", { params }),
  create: (data) => apiClient.post("/solicitud", data),
  update: (id, data) => apiClient.patch(`/solicitud/${id}`, data),
};
