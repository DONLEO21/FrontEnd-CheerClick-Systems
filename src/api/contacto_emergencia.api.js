import { apiClient } from "./client";

/** Contactos de emergencia (/api/contactoemergencia). */
export const contactoEmergenciaApi = {
  update: (id, data) => apiClient.patch(`/contactoemergencia/${id}`, data),
};
