import { apiClient } from "./client";

/** Inscripciones a competencias (/api/inscripciones_competencias). */
export const inscripcionesCompetenciasApi = {
  list: (params) => apiClient.get("/inscripciones_competencias", { params }),
  getById: (id) => apiClient.get(`/inscripciones_competencias/${id}`),
  create: (data) => apiClient.post("/inscripciones_competencias", data),
  update: (id, data) => apiClient.patch(`/inscripciones_competencias/${id}`, data),
  remove: (id) => apiClient.delete(`/inscripciones_competencias/${id}`),
};
