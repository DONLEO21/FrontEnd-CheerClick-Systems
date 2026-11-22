import { forwardRef, useEffect, useState } from "react";
import { useCarrito } from "../../../context/CarritoContext";
import { formatoCOP  } from "../../../data/pedidos";
import SelectorTalla from "./SelectorTallas";

import ImagenImplemento from "../../../components/Compartidos/ImagenImplemento";
const ModalAgregarCarrito = forwardRef(function ModalAgregarCarrito({ implemento, onAgregado }, ref) {
  const { agregar, cantidadEnCarrito } = useCarrito();
  const [cantidad, setCantidad] = useState(1);
  const [talla, setTalla] = useState("");
  const [seleccion, setSeleccion] = useState(null); // { grupo, talla, stock }
  const [error, setError] = useState("");

  useEffect(() => {
    setCantidad(1);
    setTalla("");
    // Si solo hay una talla disponible (ej. talla única), queda seleccionada
    const conStock = (implemento?.tallas ?? []).filter((t) => Number(t.stock) > 0);
    setSeleccion(conStock.length === 1 ? conStock[0] : null);
    setError("");
  }, [implemento]);

  const cerrar = () => ref.current.close();

  if (!implemento) return <dialog ref={ref} className="dialog-atleta" />;

  const tallas = implemento.tallas ?? [];
  const tieneTallas = tallas.length > 0;

  // Unidades que aún se pueden sumar de esta talla (descontando lo que ya está en el carrito)
  const stock = tieneTallas ? Number(seleccion?.stock) || 0 : 99;
  const yaEnCarrito = tieneTallas
    ? seleccion ? cantidadEnCarrito(implemento.id, seleccion.grupo, seleccion.talla) : 0
    : cantidadEnCarrito(implemento.id, undefined, talla.trim() || "N/A");
  const disponibles = Math.max(0, stock - yaEnCarrito);
  const sinCupo = (!tieneTallas || !!seleccion) && disponibles <= 0;
  const maxCantidad = tieneTallas && !seleccion ? 99 : Math.max(1, disponibles);

  const subtotal = implemento.precio * cantidad;

  const elegirTalla = (t) => {
    setSeleccion(t);
    setError("");
    const restantes = Math.max(1, (Number(t.stock) || 1) - cantidadEnCarrito(implemento.id, t.grupo, t.talla));
    setCantidad((c) => Math.min(c, restantes));
  };

  const handleAgregar = (e) => {
    e.preventDefault();
    if (tieneTallas && !seleccion) {
      setError("Seleccione una talla.");
      return;
    }
    if (sinCupo) {
      setError("Ya tienes en el carrito todas las unidades disponibles de esta talla.");
      return;
    }
    const resultado = agregar({
      implementoId: implemento.id,
      implementoNombre: implemento.nombre,
      implementoImagen: implemento.imagen,
      grupoTalla: tieneTallas ? seleccion.grupo : undefined,
      talla: tieneTallas ? seleccion.talla : talla.trim() || "N/A",
      stock,
      precioUnitario: implemento.precio,
      cantidad,
    });
    onAgregado(implemento, resultado);
    cerrar();
  };

  return (
    <dialog ref={ref} className="dialog-atleta">
      <div className="modal-header">
        <div className="modal-header-icono">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
          </svg>
        </div>
        <h3>Agregar al carrito</h3>
        <button type="button" className="btn-cerrar-modal" onClick={cerrar} aria-label="Cerrar">✕</button>
      </div>

      <div className="modal-body">
        <div className="modal-tarjeta-producto">
          <ImagenImplemento className="modal-tarjeta-img" src={implemento.imagen  } alt={implemento.nombre} />
          <div className="modal-tarjeta-info">
            <span className="modal-tarjeta-badge">Implemento Deportivo</span>
            <p className="modal-tarjeta-nombre">{implemento.nombre}</p>
            <p className="modal-tarjeta-precio">{formatoCOP(implemento.precio)}</p>
          </div>
        </div>

        <form className="formulario-pedido" onSubmit={handleAgregar}>
          {error && <div className="alerta-error">{error}</div>}

          <div className="form-section">
            <p className="form-section-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Talla y cantidad
            </p>

            {tieneTallas && (
              <div className="campo-formulario">
                <label>Talla</label>
                <SelectorTalla tallas={tallas} seleccion={seleccion} onSeleccionar={elegirTalla} />
              </div>
            )}

            <div className="fila-formulario">
              <div className="campo-formulario c-corto">
                <label htmlFor="cantidad">Cantidad</label>
                <div className="control-cantidad">
                  <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>−</button>
                  <input
                    type="number"
                    id="cantidad"
                    min={1}
                    max={maxCantidad}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Math.min(maxCantidad, Number(e.target.value) || 1)))}
                  />
                  <button type="button" onClick={() => setCantidad((c) => Math.min(maxCantidad, c + 1))}>+</button>
                </div>
              </div>
              {!tieneTallas && (
                <div className="campo-formulario" style={{ flex: 1 }}>
                  <label htmlFor="talla">Talla</label>
                  <input
                    type="text"
                    id="talla"
                    placeholder="Ej: 38, M, XL…"
                    value={talla}
                    onChange={(e) => setTalla(e.target.value)}
                  />
                </div>
              )}
            </div>

            {yaEnCarrito > 0 && (
              <p className="nota-en-carrito">
                Ya tienes {yaEnCarrito} unidad(es) de esta talla en tu carrito.
              </p>
            )}
          </div>

          <div className="modal-resumen-precio">
            <div className="resumen-fila">
              <span className="resumen-label">Precio unitario</span>
              <span className="resumen-valor">{formatoCOP(implemento.precio)}</span>
            </div>
            <div className="resumen-fila">
              <span className="resumen-label">Cantidad</span>
              <span className="resumen-valor">× {cantidad}</span>
            </div>
            <div className="resumen-divider"></div>
            <div className="resumen-fila resumen-total">
              <span>Subtotal</span>
              <span>{formatoCOP(subtotal)}</span>
            </div>
          </div>

          <button type="submit" className="btn-enviar-pedido" disabled={sinCupo}>
            Agregar al carrito
          </button>
        </form>
      </div>
    </dialog>
  );
});

export default ModalAgregarCarrito;
