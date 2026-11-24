import { useNavigate } from 'react-router-dom';
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useUsuario from "../../../hooks/useUsuario";
import useAviso from "../../../hooks/useAviso";

import { SquarePen } from 'lucide-react';

import { RUTAS } from './dashboardAtletaData.js';
import useDashboardAtleta from './useDashboardAtleta.js';

import TarjetaRendimiento, { TarjetaProgreso } from './TarjetaRendimiento.jsx';
import TarjetaCalendario from './TarjetaCalendario.jsx';
import TarjetaPerfilAtleta from './TarjetaPerfilAtleta.jsx';
import TarjetaMensualidades from './TarjetaMensualidades.jsx';
import TarjetaPqrsAtleta from './TarjetaPqrsAtleta.jsx';
import SeccionTorneos from './SeccionTorneos.jsx';

import './DashboardAtleta.css';
import SaludoDashboard from '../../../components/Compartidos/SaludoDashboard';
import EstadoError from '../../../components/Compartidos/EstadoError';

export default function DashboardAtleta({
  nombreAtleta = 'Atleta',
  onNavigate: onNavigateProp,
}) {
  const navegar = useNavigate();
  const onNavigate = onNavigateProp ?? ((href) => navegar(href));
  const usuario = useUsuario();
  const nombreCompleto = usuario.nombre || (usuario.cargando ? '' : nombreAtleta);
  const primerNombre = nombreCompleto.split(' ')[0];
  const { aviso, mostrarAviso } = useAviso();

  const { base, hoy, metricas, pqrsResumen, pagos, proximo, cargando, error, recargar, calendario } = useDashboardAtleta(mostrarAviso);

  return (
    <div className="atl-dashboard">
          <div className="contenedor">

            <SaludoDashboard nombre={primerNombre}>
              <button type="button" className="btn btn-primario" onClick={() => onNavigate(RUTAS.perfil)}>
                <SquarePen size={24} strokeWidth={2} /> Perfil
              </button>
            </SaludoDashboard>

            {cargando && (
              <section className="panel-resumen-atleta" aria-busy="true" aria-label="Cargando tu resumen">
                {Array.from({ length: 6 }, (_, i) => <span key={i} className="ui-skeleton ui-skeleton--bloque" />)}
              </section>
            )}

            {!cargando && error && <EstadoError mensaje={error} onReintentar={recargar} />}

            {!cargando && !error && (
            <>
            <section className="panel-resumen-atleta" aria-label="resumen del atleta">
              <TarjetaRendimiento
                habilidades={base.habilidades}
                variacion={metricas.variacion}
                onVer={() => onNavigate(RUTAS.rendimiento)} />

              <TarjetaProgreso categorias={metricas.porCat} />

              <TarjetaCalendario
                mes={calendario.mes}
                onCambiarMes={calendario.cambiarMes}
                porDia={calendario.porDia}
                asistencias={base.asist}
                cargando={calendario.cargando}
                diaSel={calendario.diaSel}
                onSeleccionarDia={calendario.setDiaSel}
                hoy={hoy}
                onVerEntrenamientos={() => onNavigate(RUTAS.entrenamientos)} />

              <TarjetaPerfilAtleta
                nombre={nombreCompleto}
                apellido={usuario.apellido}
                foto={usuario.foto || null}
                nivel={base.nivel?.nombre ?? 'Sin nivel'}
                entrenamientos={metricas.entrenamientos}
                torneosInscritos={base.inscritos.length}
                proximo={proximo} />

              <TarjetaMensualidades pagos={pagos} onVer={() => onNavigate(RUTAS.mensualidades)} />

              <TarjetaPqrsAtleta resumen={pqrsResumen} onVer={() => onNavigate(RUTAS.pqrs)} />
            </section>

            <SeccionTorneos
              torneos={base.torneos}
              inscritos={base.inscritos}
              onSeleccionar={(id) => onNavigate(RUTAS.torneo(id))} />
            </>
            )}
          </div>
      <AvisoToast aviso={aviso} />
    </div>
  );
}