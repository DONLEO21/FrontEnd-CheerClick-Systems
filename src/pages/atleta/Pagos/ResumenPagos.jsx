import { pesos } from "../../../components/utils/PagosAtleta";

function ResumenPagos({ resumen }) {
  return (
    <section className="atl-pagos-infor-general-atl">
      <div className="atl-tar-general">
        <h3 className="atl-gene-titu">Total pendiente</h3>
        <h2 className="atl-pagos-titu-pendi-atl">{pesos(resumen.totalPendiente)}</h2>
      </div>
      <div className="atl-tar-general">
        <h3 className="atl-gene-titu">Pagado este año</h3>
        <h2 className="atl-pagos-titu-paga-atl">{pesos(resumen.totalPagado)}</h2>
      </div>
      <div className="atl-tar-general">
        <h3 className="atl-gene-titu">Meses al día</h3>
        <h2 className="atl-pagos-titu-meses-atl">{resumen.mesesAlDia}</h2>
      </div>
      <div className="atl-tar-general">
        <h3 className="atl-gene-titu">Próximo vencimiento</h3>
        <h2 className="atl-pagos-titu-fecha-atl">{resumen.proximoVencimiento}</h2>
      </div>
    </section>
  );
}
export default ResumenPagos;