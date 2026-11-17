import { useEffect, useState } from "react";
import ListaImplementos from "./ListaImplementos";
import PedidosImplementos from "./PedidosImplementos";
import ResenasImplementos from "./ResenasImplementos";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import "./Implementos.css";

const PESTANAS = [
  { id: "deportivos", titulo: "Implementos Deportivos" },
  { id: "pedidos", titulo: "Pedidos" },
  { id: "resenas", titulo: "Reseñas" },
];

export default function Implementos() {
  // Aviso / toast 
  const [aviso, setAviso] = useState({ visible: false, mensaje: "", tipo: "ok" });

  useEffect(() => {
    if (!aviso.visible) return;
    const id = setTimeout(() => setAviso((a) => ({ ...a, visible: false })), 3000);
    return () => clearTimeout(id);
  }, [aviso.visible, aviso.mensaje]);

  const mostrarAviso = (mensaje, tipo = "ok") => setAviso({ visible: true, mensaje, tipo });

  const [pestana, setPestana] = useState("deportivos");

  return (
    <div className="container-fluid py-4">
      <h1 className="h3 mb-1">Implementos Deportivos</h1>
      <p className="text-muted mb-3">
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
