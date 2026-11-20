import { cargarPagosAtleta, enviarComprobanteMensualidad } from "../../../services/pagosService";
import { useSesion } from "../../../context/SesionContext";
import { useState, useEffect, useMemo } from "react";
import { ordenarPorMes, calcularResumen, construirNotificaciones } from "../../../components/utils/PagosAtleta";

import InfoUsuario from "./InfoUsuario";
import ResumenPagos from "./ResumenPagos";
import FiltrosMensualidades from "./FiltrosMensualidades";
import TarjetaMensualidad from "./TarjetaMensualidad";
import ModalSubirComprobante from "./ModalSubirComprobante";
import ModalVerComprobante from "./ModalVerComprobante";
import PlanMembresia from "./PlanMembresia";
import NotificacionesPagos from "./NotificacionesPagos";
import useAviso from "../../../hooks/useAviso";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import "./PagosAtleta.css";

function PagosAtleta() {
  const { sesion } = useSesion();
  const [atleta, setAtleta] = useState(null);
  const [mensualidades, setMensualidades] = useState([]);
  const [filtro, setFiltro] = useState("recientes");
  const [mes, setMes] = useState("");
  const [aSubir, setASubir] = useState(null);
  const [aVer, setAVer] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { aviso, mostrarAviso } = useAviso();

  useEffect(() => {
    let vigente = true;
    cargarPagosAtleta(sesion.usuario)
      .then(({ atleta: a, mensualidades: m }) => {
        if (vigente) {
          setAtleta(a);
          setMensualidades(m);
        }
      })
      .catch(console.error);
    return () => {
      vigente = false;
    };
  }, [sesion.atletaId]);

  const ordenadas = useMemo(() => ordenarPorMes(mensualidades), [mensualidades]);
  const resumen = useMemo(() => calcularResumen(mensualidades), [mensualidades]);
  const notificaciones = useMemo(() => construirNotificaciones(mensualidades), [mensualidades]);
  const ultima = ordenadas[0];

  const visibles = useMemo(() => {
    let lista = ordenadas;
    if (mes) lista = lista.filter((m) => m.mes === mes);
    if (filtro === "recientes") return lista.slice(0, 3);
    return lista.filter((m) => m.estado === filtro);
  }, [ordenadas, filtro, mes]);

  const guardarComprobante = async (datos) => {
    setGuardando(true);
    try {
      const actualizada = await enviarComprobanteMensualidad(aSubir, datos);
      setMensualidades((prev) =>
        prev.map((m) => (m.id === actualizada.id ? actualizada : m))
      );
      setASubir(null);
      mostrarAviso("Pago enviado. El club lo revisará y lo validará.", "ok");
    } catch (e) {
      console.error(e);
      throw e; // el modal muestra el mensaje y se queda abierto
    } finally {
      setGuardando(false);
    }
  };

  return (
    <main className="atl-pagos">
      <InfoUsuario atleta={atleta} />
      <ResumenPagos resumen={resumen} />

      <section className="atl-pagos-panel-atl">
        <h3 id="titulo-mensu">Mensualidades · Registro completo</h3>
        {resumen.totalPendiente > 0 && (
          <div className="atl-pagos-mensaje-atl">
            <h4>
              Total pendiente: <strong>{resumen.totalPendiente.toLocaleString("es-CO")}</strong> — Regulariza para evitar suspensión.
            </h4>
          </div>
        )}

        <FiltrosMensualidades filtro={filtro} onFiltro={setFiltro} mes={mes} onMes={setMes} />

        <section className="atl-pagos-targetas-atl">
          {visibles.length ? (
            visibles.map((m) => (
              <TarjetaMensualidad key={m.id} mensualidad={m} onSubir={setASubir} onVer={setAVer} />
            ))
          ) : (
            <p style={{ padding: 20 }}>No hay mensualidades para este filtro.</p>
          )}
        </section>
      </section>

      <footer className="atl-pagos-infor-final-atl">
        <PlanMembresia plan={ultima?.plan} valor={ultima?.valor} />
        <NotificacionesPagos notificaciones={notificaciones} />
      </footer>

      <ModalSubirComprobante
        mensualidad={aSubir}
        guardando={guardando}
        onCerrar={() => setASubir(null)}
        onGuardar={guardarComprobante}
      />
      <ModalVerComprobante mensualidad={aVer} atleta={atleta} onCerrar={() => setAVer(null)} />
      <AvisoToast aviso={aviso} />
    </main>
  );
}

export default PagosAtleta;

