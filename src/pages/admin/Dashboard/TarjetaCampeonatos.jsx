import { CalendarClock, ChevronRight, Trophy } from "lucide-react";
import { MAX_ITEMS, RUTA_HORARIOS } from "./dashboardAdminData.js";
import useFuente from "../../../hooks/useFuente";
import EstadoTarjeta from "../../../components/Compartidos/EstadoTarjeta";
import { cargarProximosCampeonatos } from "../../../services/dashboardAdminService";
import { formatearFechaLarga } from "../../../services/data";

export default function TarjetaCampeonatos({ onNavigate }) {
  const { datos, cargando, error, recargar } = useFuente(cargarProximosCampeonatos);
  const lista = datos ?? [];
  const total = lista.length;

  return (
    <article className="tarjeta-dashboard">
      <header className="tarjeta-dashboard__header tarjeta-dashboard__header--icono">
        <span className="icono-cabecera">
          <CalendarClock size={22} strokeWidth={2} />
        </span>
        <h2>Próximos campeonatos</h2>
      </header>

      <div className="tarjeta-dashboard__contenido">
        <EstadoTarjeta cargando={cargando} error={error} onReintentar={recargar} vacio={total === 0} textoVacio="Aún no hay campeonatos programados.">
          <ul className="lista-actividades">
            {lista.slice(0, MAX_ITEMS).map(({ id, nombre, fecha, ciudad }) => (
              <li className="lista-actividades__item" key={id}>
                <a
                  href={RUTA_HORARIOS}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(RUTA_HORARIOS);
                  }}
                >
                  <div className="lista-actividades__icono">
                    <Trophy size={24} strokeWidth={2} />
                  </div>
                  <div className="lista-actividades__texto">
                    <h3>{nombre}</h3>
                    <p>{formatearFechaLarga(fecha)}{ciudad ? ` · ${ciudad}` : ""}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </EstadoTarjeta>
      </div>

      {/* siempre visible; el contador aparece solo si hay más de MAX_ITEMS */}
      <button
        type="button"
        className="enlace-ver-todas"
        onClick={() => onNavigate(RUTA_HORARIOS)}
      >
        Ver todos los campeonatos
        {total > MAX_ITEMS ? ` (${total})` : ""}
        <ChevronRight size={16} strokeWidth={2.2} />
      </button>
    </article>
  );
}
