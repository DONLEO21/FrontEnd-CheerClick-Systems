import { apiClient } from "./client";

/** Competencias / torneos (/api/competencias). */
export const competenciasApi = {
  list: (params) => apiClient.get("/competencias", { params }),
  getById: (id) => apiClient.get(`/competencias/${id}`),
  create: (data) => apiClient.post("/competencias", data),
  update: (id, data) => apiClient.patch(`/competencias/${id}`, data),
};
