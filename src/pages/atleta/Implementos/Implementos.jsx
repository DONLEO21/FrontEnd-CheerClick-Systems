import { useRef, useState } from "react";
import CatalogoImplementos from "./CatalogoImplementos";
import MisPedidos from "./MisPedidos";
import CarritoDrawer from "./CarritoDrawer";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";
import { CarritoProvider, useCarrito } from "../../../context/CarritoContext";
import { ATLETA_ACTUAL } from "../../../services/AtletaActual";
import "./Implementos.css";

function PaginaImplementos() {
  const { unidades } = useCarrito();
  const carritoRef = useRef(null);

  // ── Aviso / toast ────────────────────────────────────────
  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });

  const [pestana, setPestana] = useState("catalogo"); // "catalogo" | "pedidos"
  const [version, setVersion] = useState(0); // fuerza a "Mis Pedidos" a recargar tras un pedido nuevo

  const abrirCarrito = () => carritoRef.current.showModal();

  const pedidoCreado = (pedido) => {
    setPestana("pedidos");
    setVersion((v) => v + 1);
    mostrarAviso(`Pedido ${pedido.codigo || ""} enviado correctamente.`.replace("Pedido  ", "Pedido "));
  };

  return (
    <div className="pagina-implementos">
      <div className="cabecera-implementos">
        <div>
          <h1>Implementos Deportivos</h1>
          <p>Arma tu carrito con los implementos que necesitas y reclámalos en el club.</p>
        </div>

        <button type="button" className="btn-carrito" onClick={abrirCarrito} aria-label={`Abrir carrito (${unidades} unidades)`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
          </svg>
          Mi carrito
          {unidades > 0 && <span className="btn-carrito-contador">{unidades}</span>}
        </button>
      </div>

      <div className="contenedor-informacion" role="note">
        <span className="icono-informacion">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
          </svg>
        </span>
        <p className="texto-informacion">Todos los pedidos se reclaman presencialmente en el club.</p>
      </div>

      <div className="tabla-contenido" role="tablist">
        <button
          type="button"
          className={`tab-btn ${pestana === "catalogo" ? "activo" : ""}`}
          onClick={() => setPestana("catalogo")}
        >
          Catálogo de Implementos
        </button>
        <button
          type="button"
          className={`tab-btn ${pestana === "pedidos" ? "activo" : ""}`}
          onClick={() => setPestana("pedidos")}
        >
          Mis Pedidos
        </button>
      </div>

      {pestana === "catalogo" ? (
        <CatalogoImplementos onAviso={mostrarAviso} />
      ) : (
        <MisPedidos key={version} onAviso={mostrarAviso} />
      )}

      <CarritoDrawer ref={carritoRef} onPedidoCreado={pedidoCreado} />
      <AvisoToast aviso={aviso} />
    </div>
  );
}

function ImplementosContenido() {
  return (
    <CarritoProvider storageKey={`cheerclick:carrito:${ATLETA_ACTUAL.nombre}`}>
      <PaginaImplementos />
    </CarritoProvider>
  );
}

// Clase raíz del módulo: todos sus estilos viven bajo .atl-implementos
export default function Implementos(props) {
  return (
    <div className="atl-implementos">
      <ImplementosContenido {...props} />
    </div>
  );
}
