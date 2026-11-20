import { apiClient } from "./client";

/** PQRS (/api/pqrs). */
export const pqrsApi = {
  list: (params) => apiClient.get("/pqrs", { params }),
  getById: (id) => apiClient.get(`/pqrs/${id}`),
  create: (data) => apiClient.post("/pqrs", data),
  update: (id, data) => apiClient.patch(`/pqrs/${id}`, data),
};
