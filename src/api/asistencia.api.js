import { apiClient } from "./client";

/** Asistencia (/api/asistencia). guardarDia es el endpoint para guardar la planilla completa del día. */
export const asistenciaApi = {
  planilla: (params) => apiClient.get("/asistencia/planilla", { params }),
  list: (params) => apiClient.get("/asistencia", { params }),
  guardarDia: (data) => apiClient.put("/asistencia/dia", data),
  create: (data) => apiClient.post("/asistencia", data),
  update: (id, data) => apiClient.patch(`/asistencia/${id}`, data),
  remove: (id) => apiClient.delete(`/asistencia/${id}`),
};
