export default function TarjetaRendimientoEquipo({ equipo, cargando }) {
  return (
    <article className="de-tarjeta de-col-5">
      <h2 className="de-titulo">Rendimiento del Equipo</h2>
      <ul className="de-barras">
        {equipo.map((c) => (
          <li key={c.id}>
            <div className="de-barras__fila">
              <span>{c.nombre}</span>
              <span>{cargando || c.valor === null ? '—' : `${c.valor}%`}</span>
            </div>
            <div className="de-barras__pista" role="progressbar" aria-valuemin={0} aria-valuemax={100}
              aria-valuenow={c.valor ?? 0} aria-label={c.nombre}>
              <div className="de-barras__relleno" style={{ width: `${c.valor ?? 0}%`, background: c.color }} />
            </div>
          </li>
        ))}
      </ul>
    </article>
  )
}