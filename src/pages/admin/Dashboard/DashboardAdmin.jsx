import { useNavigate } from "react-router-dom";
import useUsuario from "../../../hooks/useUsuario";

import { SquarePen } from "lucide-react";

import { RUTA_CUENTAS } from "./dashboardAdminData.js";
import useDashboardAdmin from "./useDashboardAdmin.js";

import TarjetaUsuarios from "./TarjetaUsuarios.jsx";
import TarjetaPagos from "./TarjetaPagos.jsx";
import TarjetaCampeonatos from "./TarjetaCampeonatos.jsx";
import TablaSolicitudes from "./TablaSolicitudes.jsx";
import TarjetaNovedades from "./TarjetaNovedades.jsx";

import "./DashboardAdmin.css";
import SaludoDashboard from "../../../components/Compartidos/SaludoDashboard";

// nombreAdmin queda solo como respaldo si la cuenta no tiene nombre guardado
function DashboardAdmin({
  nombreAdmin = "Ronald Linares",
  onNavigate: onNavigateProp,
}) {
  const navegar = useNavigate();
  const onNavigate = onNavigateProp ?? ((href) => navegar(href));
  // nombre ingresado en el registro (user_metadata.nombre)
  const usuario = useUsuario();
  const nombreCompleto = usuario.nombre || (usuario.cargando ? "" : nombreAdmin);
  const primerNombre = nombreCompleto.split(" ")[0];

  const { stats, pendientes, cargando, error } = useDashboardAdmin();

  // Navega a la pantalla de cuentas. Con un id, esa pantalla abre el modal de esa solicitud.
  const irACuentas = (id) => {
    window.location.href = id ? `${RUTA_CUENTAS}?ver=${id}` : RUTA_CUENTAS;
  };

  return (
    <div className="adm-dashboard">
      <div className="contenedor">
        <SaludoDashboard nombre={primerNombre}>
          <a
            href="/admin/perfil"
            className="btn btn-primario bienvenida-admin__perfil"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/admin/perfil";
            }}
          >
            <SquarePen size={24} strokeWidth={2} />
            Perfil
          </a>
        </SaludoDashboard>

        <section className="panel-resumen-admin" aria-label="resumen del administrador">
          <TarjetaUsuarios
            stats={stats}
            cargando={cargando}
            error={error}
            onGestionar={() => irACuentas()}
          />

          <TarjetaPagos onNavigate={onNavigate} />

          <TarjetaCampeonatos onNavigate={onNavigate} />

          <TablaSolicitudes
            pendientes={pendientes}
            cargando={cargando}
            error={error}
            onVer={irACuentas}
            onVerTodas={() => irACuentas()}
          />

          <TarjetaNovedades onNavigate={onNavigate} />
        </section>
      </div>
    </div>
  );
}

export default DashboardAdmin;