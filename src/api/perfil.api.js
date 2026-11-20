import { apiClient, MULTIPART, aFormData } from "./client";

/** Perfil del usuario autenticado (/api/perfilusuario). */
export const perfilApi = {
  crear: (data) => apiClient.post("/perfilusuario", data),
  me: () => apiClient.get("/perfilusuario/me"),
  actualizarMe: (data) => apiClient.patch("/perfilusuario/me", data),
  subirFoto: (campos) => apiClient.put("/perfilusuario/me/foto", aFormData(campos), MULTIPART),
  subirCertificadoEps: (campos) => apiClient.put("/perfilusuario/me/certificado-eps", aFormData(campos), MULTIPART),
  descargarCertificadoEps: () => apiClient.get("/perfilusuario/me/certificado-eps", { responseType: "blob" }),
  guardarContactos: (data) => apiClient.put("/perfilusuario/me/contactos", data),
  actualizarPreferencias: (data) => apiClient.patch("/perfilusuario/me/preferencias", data),
  update: (id, data) => apiClient.patch(`/perfilusuario/${id}`, data),
};
