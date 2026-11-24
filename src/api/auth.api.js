import { apiClient } from "./client";

/** Autenticación y recuperación de contraseña (/api/auth). Rutas públicas salvo renovarToken. */
export const authApi = {
  login: (data) => apiClient.post("/auth/login", data, { publico: true }),
  registro: (data) => apiClient.post("/auth/registro", data, { publico: true }),
  renovarToken: () => apiClient.get("/auth/renovar-token"),
  cambiarContrasena: (datos) => apiClient.patch("/auth/cambiar-contrasena", datos),
  olvideContrasena: (data) => apiClient.post("/auth/olvide-contrasena", data, { publico: true }),
  reenviarCodigo: (data) => apiClient.post("/auth/reenviar-codigo", data, { publico: true }),
  verificarCodigo: (data) => apiClient.post("/auth/verificar-codigo", data, { publico: true }),
  restablecerContrasena: (data) => apiClient.post("/auth/restablecer-contrasena", data, { publico: true }),
};
