import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, LineChart as IconoGrafico } from 'lucide-react'

export default function TarjetaProgreso({ metricas, cargando }) {
  const { variacion, serie } = metricas
  // Sin ninguna evaluación en las últimas 4 semanas: se muestra un mensaje en vez de una gráfica vacía
  const sinDatos = !cargando && serie.every((p) => p.valor === null)

  return (
    <article className="de-tarjeta de-col-7">
      <h2 className="de-titulo">Progreso últimas 4 semanas</h2>
      {sinDatos ? (
        <div className="de-vacio" role="status">
          <IconoGrafico size={34} strokeWidth={1.6} aria-hidden="true" />
          <p>Aún no hay datos de las últimas cuatro semanas</p>
          <small>Aparecerán cuando se registren evaluaciones de rendimiento.</small>
        </div>
      ) : (
      <>
      <p className="de-variacion">
        {variacion === null ? (
          <span className="de-variacion--nulo">Sin datos para comparar</span>
        ) : (
          <>
            <span className={variacion >= 0 ? 'de-variacion--sube' : 'de-variacion--baja'}>
              <TrendingUp size={16} strokeWidth={2.4} className={variacion < 0 ? 'de-invertido' : ''} />
              {' '}{Math.abs(variacion).toFixed(1)}%
            </span>{' '}
            vs. semana anterior
          </>
        )}
      </p>
      <div className="de-grafico">
        <ResponsiveContainer width="100%" height={190}>
          <LineChart data={serie} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dcdcdc" />
            <XAxis dataKey="semana" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v) => [`${v}%`, 'Rendimiento']} />
            <Line type="linear" dataKey="valor" stroke="#d71920" strokeWidth={2}
              dot={{ r: 5, fill: '#d71920', stroke: '#d71920' }} activeDot={{ r: 6 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
      </>
      )}
    </article>
  )
}