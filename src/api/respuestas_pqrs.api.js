import { apiClient } from "./client";

/** Respuestas a PQRS (/api/respuesta_pqrs). */
export const respuestasPqrsApi = {
  list: (params) => apiClient.get("/respuesta_pqrs", { params }),
  getById: (id) => apiClient.get(`/respuesta_pqrs/${id}`),
  create: (data) => apiClient.post("/respuesta_pqrs", data),
  update: (id, data) => apiClient.patch(`/respuesta_pqrs/${id}`, data),
  remove: (id) => apiClient.delete(`/respuesta_pqrs/${id}`),
};
