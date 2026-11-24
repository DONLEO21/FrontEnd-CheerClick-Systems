import { apiClient } from "./client";

/** Cuentas y solicitudes de registro (/api/usuarios, solo administrador). */
export const usuariosApi = {
  listarSolicitudes: (params) => apiClient.get("/usuarios/solicitudes", { params }),
  aprobarSolicitud: (id, data) => apiClient.patch(`/usuarios/solicitudes/${id}/aprobar`, data),
  rechazarSolicitud: (id) => apiClient.patch(`/usuarios/solicitudes/${id}/rechazar`),
  listarCuentas: (params) => apiClient.get("/usuarios", { params }),
  crear: (data) => apiClient.post("/usuarios", data),
  detalle: (id) => apiClient.get(`/usuarios/${id}/detalle`),
  descargarCertificadoEps: (id) => apiClient.get(`/usuarios/${id}/certificado-eps`, { responseType: "blob" }),
  cambiarStatus: (id, data) => apiClient.patch(`/usuarios/${id}/status`, data),
  cambiarRol: (id, data) => apiClient.patch(`/usuarios/${id}/rol`, data),
  update: (id, data) => apiClient.patch(`/usuarios/${id}`, data),
  // Gestión de cuentas (solo administrador; el backend valida cada permiso)
  editarFicha: (id, data) => apiClient.patch(`/usuarios/${id}/ficha`, data),
  reasignarNivel: (id, data) => apiClient.patch(`/usuarios/${id}/nivel`, data),
  reasignarPlan: (id, data) => apiClient.patch(`/usuarios/${id}/plan`, data),
  cambiarRolEntrenador: (id, data) => apiClient.patch(`/usuarios/${id}/entrenador`, data),
  listarEntrenadores: () => apiClient.get("/usuarios/entrenadores"),
};
