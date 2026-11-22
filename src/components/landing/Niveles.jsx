import useFuente from '../../hooks/useFuente'
import EstadoTarjeta from '../Compartidos/EstadoTarjeta'
import { cargarNivelesLanding } from '../../services/landing'

function Niveles() {
  const { datos, cargando, error, recargar } = useFuente(cargarNivelesLanding)
  const niveles = datos ?? []

  return (
    <section id="niveles" className="landing-niveles">
      <div className="contenedor">
        <div className="contenido-niveles">
          <div className="seccion-titulo">
            <h1>Nuestras Divisiones</h1>
          </div>
          <h2>{niveles.length > 0 ? `${niveles.length} NIVELES DE COMPETENCIA` : 'NIVELES DE COMPETENCIA'}</h2>
          <p>Desde quienes dan sus primeros pasos hasta los atletas de alto rendimiento.<br />Hay un equipo Blood Tigers para cada etapa de tu camino</p>

          <EstadoTarjeta cargando={cargando} error={error} onReintentar={recargar} vacio={niveles.length === 0}
            textoVacio="Pronto publicaremos nuestras divisiones." lineas={3}>
            <div className="niveles-valores">
              {niveles.map((n, i) => (
                <article
                  className={`nivel-tarjetas${i === niveles.length - 1 && niveles.length > 1 ? ' nivel-destacado' : ''}`}
                  key={n.id}
                >
                  <header className="tarjeta-encabezado">
                    <h3>{n.etiqueta}</h3>
                    <h4>{n.division}</h4>
                    <p>{n.descripcion}</p>
                  </header>
                  <div className="nivel-entrenador">
                    <img src="../src/assets/img/entrenador.png" alt="Entrenador" />
                    <p>{n.entrenador || 'Por asignar'}</p>
                  </div>
                </article>
              ))}
            </div>
          </EstadoTarjeta>
        </div>
      </div>
    </section>
  )
}

export default Niveles
