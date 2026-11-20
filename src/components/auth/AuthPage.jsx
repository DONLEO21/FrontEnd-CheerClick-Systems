import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { haySesion, usuarioActual, RUTA_INICIO } from "../../services/sesion";
import Login from "./Login";
import Registro from "./Registro";
import CuentaPendiente from "./CuentaPendiente";
import RecuperarCorreo from "./RecuperarCorreo";
import RecuperarCodigo from "./RecuperarCodigo";
import RecuperarClave from "./RecuperarClave";
import RecuperarExito from "./RecuperarExito";
import "./auth.css";

function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const vista = searchParams.get("view");
  // view=recuperar: llega desde "Cambiar contraseña" del perfil (usa el flujo de recuperación existente)
  const vistaInicial =
    vista === "registro" ? "registro" : vista === "recuperar" ? "recuperar-correo" : "login";

  const [pantalla, setPantalla] = useState(vistaInicial);
  const [correoRecuperacion, setCorreoRecuperacion] = useState(
    () => (vista === "recuperar" && haySesion() ? usuarioActual()?.email ?? "" : "")
  );
  const [codigoRecuperacion, setCodigoRecuperacion] = useState("");
  const [nombreRegistrado, setNombreRegistrado] = useState("");

  // Si ya hay una sesión iniciada, se va directo a su panel
  useEffect(() => {
    if (pantalla.startsWith("recuperar")) return;
    if (haySesion()) {
      const destino = RUTA_INICIO[usuarioActual().rol];
      if (destino) navigate(destino, { replace: true });
    }
  }, [navigate, pantalla]);

  return (
    <div className="pagina-auth">
      <div className="contenedor">
        {pantalla === "login" && <Login irA={setPantalla} />}
        {pantalla === "registro" && (
          <Registro
            irA={setPantalla}
            setNombreRegistrado={setNombreRegistrado}
          />
        )}
        {pantalla === "pendiente" && (
          <CuentaPendiente irA={setPantalla} nombre={nombreRegistrado} />
        )}
        {pantalla === "recuperar-correo" && (
          <RecuperarCorreo
            irA={setPantalla}
            correoInicial={correoRecuperacion}
            setCorreo={setCorreoRecuperacion}
          />
        )}
        {pantalla === "recuperar-codigo" && (
          <RecuperarCodigo
            irA={setPantalla}
            correo={correoRecuperacion}
            setCodigo={setCodigoRecuperacion}
          />
        )}
        {pantalla === "recuperar-clave" && (
          <RecuperarClave
            irA={setPantalla}
            correo={correoRecuperacion}
            codigo={codigoRecuperacion}
          />
        )}
        {pantalla === "recuperar-exito" && <RecuperarExito irA={setPantalla} />}
      </div>
    </div>
  );
}

export default AuthPage;