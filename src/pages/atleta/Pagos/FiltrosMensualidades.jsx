import { MESES } from "../../../components/utils/PagosAtleta";

const FILTROS = [
  { valor: "recientes", texto: "Últimos 3 meses" },
  { valor: "pagado", texto: "Pagados" },
  { valor: "pendiente", texto: "Pendientes" },
  { valor: "vencido", texto: "Vencidos" },
];

function FiltrosMensualidades({ filtro, onFiltro, mes, onMes }) {
  return (
    <nav className="atl-pagos-filtros-atl">
      <div className="ui-tabs" role="tablist">
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            role="tab"
            aria-selected={filtro === f.valor}
            className={`ui-tab${filtro === f.valor ? " ui-tab--activa" : ""}`}
            onClick={() => onFiltro(f.valor)}
          >
            {f.texto}
          </button>
        ))}
      </div>
      <div>
        <select className="atl-pagos-mes-atl" value={mes} onChange={(e) => onMes(e.target.value)}>
          <option value="">📆 Mes</option>
          {MESES.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
    </nav>
  );
}
export default FiltrosMensualidades;