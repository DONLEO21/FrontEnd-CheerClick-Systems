
import { formatearDias } from "./horariosData";
import FotoPersona from "../../../components/Compartidos/FotoPersona";
import { formatearRangoHora } from "../../entrenador/Horarios/calendarioData";

export default function NivelCard({ nivel, onModificar, onInhabilitar, delay = 0 }) {
  return (
    <div
      className={`tarjeta-categoria ${nivel.inhabilitado ? "inhabilitada" : ""}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="encabezado-categoria">{nivel.categoria}{nivel.codigo && <span className="ui-codigo ui-codigo--claro">{nivel.codigo}</span>}</div>
      <div className="cuerpo-categoria">
        <div className="info-entrenador">
          <FotoPersona src={nivel.foto} nombre={nivel.entrenador || "?"} alt={`Foto de ${nivel.entrenador || "entrenador sin asignar"}`} className="foto-entrenador" />
          <div className="datos-entrenador">
            <h3>{nivel.entrenador || "Sin entrenador asignado"}</h3>
            {(!nivel.entrenador || !nivel.entrenadorValido) && (
              <span className="aviso-entrenador" title="Edita el nivel y elige un entrenador válido">
                {nivel.entrenador ? "Sin rol de entrenador activo" : "Elige un entrenador al modificar"}
              </span>
            )}
            <div className="horarios">
              {nivel.horarios.map((bloque, idx) => (
                <span key={idx} className="insignia-horario">
                  <i className="bi bi-calendar3" />
                  {formatearDias(bloque.dias)} · {formatearRangoHora(bloque.inicio, bloque.fin)}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="acciones-categoria">
          <button className="btn-modificar" onClick={() => onModificar(nivel)}>
            Modificar
          </button>
          <button className="btn-inhabilitar" onClick={() => onInhabilitar(nivel)}>
            {nivel.inhabilitado ? "Habilitar" : "Inhabilitar"}
          </button>
        </div>
      </div>
    </div>
  );
}
