/**
 * Rendimiento promedio por nivel. Se calcula en Rendimiento.jsx con los mismos datos reales de la
 * tabla (habilidades completadas / habilidades activas); no hay cifras propias de este componente.
 * datos: [{ nivel, atletas, evaluados, promedio }]  (promedio = null si ningún atleta del nivel tiene evaluaciones)
 */
function RendimientoPorNivel({ datos = [] }) {
  if (datos.length === 0) return null;

  return (
    <section className="adm-rendimiento-niveles" aria-label="Rendimiento promedio por nivel">
      <header className="adm-rendimiento-niveles__cabeza">
        <h4>Rendimiento por nivel</h4>
        <p>Promedio de habilidades logradas por los atletas de cada nivel.</p>
      </header>
      <ul className="adm-rendimiento-niveles__lista">
        {datos.map((d) => (
          <li key={d.nivel} className="adm-rendimiento-niveles__item">
            <div className="adm-rendimiento-niveles__fila">
              <span className="adm-rendimiento-niveles__nombre">{d.nivel}</span>
              <span className="adm-rendimiento-niveles__meta">
                {d.atletas} {d.atletas === 1 ? "atleta" : "atletas"} ·{" "}
                {d.promedio === null ? <strong>Sin evaluaciones</strong> : <strong>{d.promedio}%</strong>}
              </span>
            </div>
            <div
              className="adm-rendimiento-niveles__barra"
              role="progressbar"
              aria-valuenow={d.promedio ?? 0}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div className="adm-rendimiento-niveles__relleno" style={{ width: `${d.promedio ?? 0}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default RendimientoPorNivel;
