import { apiClient } from "./client";

/** Reseñas de implementos (/api/resena). */
export const resenasApi = {
  list: (params) => apiClient.get("/resena", { params }),
  create: (data) => apiClient.post("/resena", data),
  update: (id, data) => apiClient.patch(`/resena/${id}`, data),
};
