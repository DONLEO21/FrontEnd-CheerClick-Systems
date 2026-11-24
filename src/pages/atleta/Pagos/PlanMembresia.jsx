import { pesos } from "../../../components/utils/PagosAtleta";

// Datos del plan VIGENTE del atleta (no de su última mensualidad): nombre, valor mensual y día de corte configurado
function PlanMembresia({ plan, valor, diaCorte, sinPlan }) {
  return (
    <section className="atl-pagos-infor-plan-atl">
      <h3 className="atl-titu-final">Mi plan de membresía</h3>
      <h5 className="atl-sub-final">Plan vigente actualmente</h5>
      <div className="atl-con-infor">
        <span className="atl-plan-sub">Tipo plan</span>
        <span className="atl-plan-valor">{plan ?? (sinPlan ? "Sin plan asignado" : "—")}</span>
      </div>
      <div className="atl-con-infor">
        <span className="atl-plan-sub">Valor mensual</span>
        <span className="atl-plan-valor">{valor != null ? pesos(valor) : "—"}</span>
      </div>
      <div className="atl-con-infor">
        <span className="atl-plan-sub">Día de corte</span>
        <span className="atl-plan-valor">{diaCorte ? `Día ${diaCorte} de cada mes` : "—"}</span>
      </div>
    </section>
  );
}
export default PlanMembresia;