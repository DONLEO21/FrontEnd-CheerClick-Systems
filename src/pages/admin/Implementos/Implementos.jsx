import { useState } from "react";
import ListaImplementos from "./ListaImplementos";
import PedidosImplementos from "./PedidosImplementos";
import ResenasImplementos from "./ResenasImplementos";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";
import "./Implementos.css";

const PESTANAS = [
  { id: "deportivos", titulo: "Implementos Deportivos" },
  { id: "pedidos", titulo: "Pedidos" },
  { id: "resenas", titulo: "Reseñas" },
];

function ImplementosContenido() {
  // Aviso / toast 
  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });

  const [pestana, setPestana] = useState("deportivos");

  return (
    <div className="container-fluid">
      <h1 className="h3">Implementos Deportivos</h1>
      <p className="text-muted">
        Controle los implementos, los pedidos de los atletas y sus reseñas aquí.
      </p>

      <div className="tabs-implementos" role="tablist">
        {PESTANAS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={pestana === t.id}
            className={`tab-btn ${pestana === t.id ? "activo" : ""}`}
            onClick={() => setPestana(t.id)}
          >
            {t.titulo}
          </button>
        ))}
      </div>

      {pestana === "deportivos" && <ListaImplementos onAviso={mostrarAviso} />}
      {pestana === "pedidos" && <PedidosImplementos onAviso={mostrarAviso} />}
      {pestana === "resenas" && <ResenasImplementos />}

      <AvisoToast aviso={aviso} />
    </div>
  );
}

// Clase raíz del módulo: todos sus estilos viven bajo .adm-implementos
export default function Implementos(props) {
  return (
    <div className="adm-implementos">
      <ImplementosContenido {...props} />
    </div>
  );
}
