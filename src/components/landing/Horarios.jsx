import useFuente from '../../hooks/useFuente'
import EstadoTarjeta from '../Compartidos/EstadoTarjeta'
import { cargarNivelesLanding } from '../../services/landing'

function Horarios() {
  const { datos, cargando, error, recargar } = useFuente(cargarNivelesLanding)
  const niveles = datos ?? []

  return (
    <section id="horarios" className="landing-horarios">
      <div className="contenedor">
        <div className="horarios-contenido">
          <div className="seccion-titulo">
            <h1>PLANIFICACIÓN</h1>
          </div>
          <h2>HORARIOS DE ENTRENAMIENTO</h2>
          <p>Cada entrenador y nivel tiene sus horarios definidos. ¡Encuentra el tuyo y únete al equipo!</p>

          <EstadoTarjeta cargando={cargando} error={error} onReintentar={recargar} vacio={niveles.length === 0}
            textoVacio="Pronto publicaremos los horarios de entrenamiento." lineas={3}>
            <div className="horario-valores">
              {niveles.map((n) => (
                <article className="horario-tarjeta" key={n.id}>
                  <header className="tarjeta-encabezado">
                    <h3>{n.titulo}</h3>
                    <h4>Entrenador: {n.entrenador || 'Por asignar'}</h4>
                  </header>
                  {n.horarios.length === 0 ? (
                    <p className="ui-vacio">Horario por definir.</p>
                  ) : (
                    <ul className="lista-horarios">
                      {n.horarios.map((h) => (
                        <li key={`${h.dia}-${h.hora}`}>
                          <p className="dia">{h.dia}</p>
                          <p className="hora">{h.hora}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          </EstadoTarjeta>
        </div>
      </div>
    </section>
  )
}

export default Horarios
