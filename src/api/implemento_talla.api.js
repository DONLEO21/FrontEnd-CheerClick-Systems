import { apiClient } from "./client";

/** Tallas de implementos (/api/implementoTalla). */
export const implementoTallaApi = {
  opciones: (params) => apiClient.get("/implementoTalla/opciones", { params }),
  list: (params) => apiClient.get("/implementoTalla", { params }),
  create: (data) => apiClient.post("/implementoTalla", data),
  update: (id, data) => apiClient.patch(`/implementoTalla/${id}`, data),
};
