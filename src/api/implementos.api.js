import { apiClient } from "./client";

/** Implementos deportivos (/api/implementos). */
export const implementosApi = {
  list: (params) => apiClient.get("/implementos", { params }),
  create: (data) => apiClient.post("/implementos", data),
  update: (id, data) => apiClient.patch(`/implementos/${id}`, data),
};
