import { apiClient } from "./client";

/** Plantilla semanal de horarios por nivel (/api/plantilla_horario). */
export const plantillaHorarioApi = {
  list: (params) => apiClient.get("/plantilla_horario", { params }),
  getById: (id) => apiClient.get(`/plantilla_horario/${id}`),
  create: (data) => apiClient.post("/plantilla_horario", data),
  update: (id, data) => apiClient.patch(`/plantilla_horario/${id}`, data),
  remove: (id) => apiClient.delete(`/plantilla_horario/${id}`),
};
