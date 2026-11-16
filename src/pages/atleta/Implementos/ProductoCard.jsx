import TallasChips from "../../../components/Tallas/TallasChips";

export default function ProductoCard({ implemento, onAgregar }) {
  const estrellas = Math.round(implemento.calificacion || 0);

  return (
    <article className="tarjeta-producto">
      <div className="producto-imagen">
        <img src={implemento.imagen} alt={implemento.nombre} />
      </div>
      <div className="producto-info">
        <h4>{implemento.nombre}</h4>
        <div className="calificacion" aria-label={`Calificación: ${estrellas} de 5 estrellas`}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < estrellas ? "estrella-llena" : "estrella-vacia"}>★</span>
          ))}
          <span className="conteo-resenas">({implemento.resenas || 0})</span>
        </div>
        {implemento.tallas?.length > 0 && (
          <div className="producto-tallas">
            <span className="producto-tallas-label">Tallas</span>
            <TallasChips tallas={implemento.tallas} maximo={8} />
          </div>
        )}
        <p className="precio">${Number(implemento.precio).toLocaleString("es-CO")}</p>
        <button type="button" className="btn-agregar-carrito" onClick={() => onAgregar(implemento)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
          </svg>
          Agregar al carrito
        </button>
      </div>
    </article>
  );
}
