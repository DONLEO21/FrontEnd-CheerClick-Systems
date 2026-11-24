import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const sinTildes = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Selector buscable de entrenador: se escribe para filtrar y se elige de la lista. Guarda el ID, nunca el texto escrito,
 * así no existen errores de "no existe un entrenador llamado…". Cada opción dice «Nombre Apellido · Rol».
 *
 * Props: opciones [{ id, etiqueta, codigo? }], valorId, cargando, errorCarga, onElegir(id, opcion), onReintentar.
 * Busca por nombre, apellido o código.
 */
export default function SelectorEntrenador({ id, opciones, valorId, cargando, errorCarga, onElegir, onReintentar }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activa, setActiva] = useState(0);
  const contenedorRef = useRef(null);
  const listaId = useId();

  const elegida = opciones.find((o) => o.id === valorId) ?? null;
  const filtradas = useMemo(() => {
    const q = sinTildes(texto).trim();
    return q ? opciones.filter((o) => sinTildes(`${o.etiqueta} ${o.codigo ?? ""}`).includes(q)) : opciones;
  }, [opciones, texto]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alClicFuera = (e) => {
      if (!contenedorRef.current?.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  const elegir = (o) => {
    onElegir(o.id, o);
    setTexto("");
    setAbierto(false);
  };

  const alTeclear = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setAbierto(true); setActiva((a) => Math.min(a + 1, filtradas.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiva((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter" && abierto) { e.preventDefault(); if (filtradas[activa]) elegir(filtradas[activa]); }
    else if (e.key === "Escape") { setAbierto(false); }
  };

  // Sin editar el texto se muestra lo elegido; al escribir, lo que se busca
  const visible = abierto ? texto : elegida?.etiqueta ?? "";

  return (
    <div className="selector-entrenador" ref={contenedorRef}>
      <div className="selector-entrenador__campo">
        <Search size={15} strokeWidth={2} aria-hidden="true" className="selector-entrenador__lupa" />
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listaId}
          aria-autocomplete="list"
          autoComplete="off"
          className="campo-formulario selector-entrenador__input"
          placeholder={cargando ? "Cargando entrenadores…" : "Buscar por nombre, apellido o código"}
          value={visible}
          disabled={cargando}
          onFocus={() => { setAbierto(true); setActiva(0); }}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); setActiva(0); }}
          onKeyDown={alTeclear}
        />
        <ChevronDown size={16} strokeWidth={2} aria-hidden="true" className="selector-entrenador__flecha" />
      </div>

      {abierto && (
        <ul className="selector-entrenador__lista" id={listaId} role="listbox">
          {errorCarga && (
            <li className="selector-entrenador__vacio" role="presentation">
              {errorCarga}{" "}
              <button type="button" className="selector-entrenador__reintentar" onClick={onReintentar}>Reintentar</button>
            </li>
          )}
          {!errorCarga && filtradas.length === 0 && (
            <li className="selector-entrenador__vacio" role="presentation">
              {opciones.length === 0 ? "No hay entrenadores disponibles. Crea uno en Gestión de cuentas." : "Sin resultados para esa búsqueda."}
            </li>
          )}
          {filtradas.map((o, i) => (
            <li
              key={o.id}
              role="option"
              aria-selected={o.id === valorId}
              className={`selector-entrenador__opcion${i === activa ? " activa" : ""}${o.id === valorId ? " elegida" : ""}`}
              onMouseEnter={() => setActiva(i)}
              onMouseDown={(e) => { e.preventDefault(); elegir(o); }}
            >
              {o.etiqueta}{o.codigo ? <span className="selector-entrenador__codigo"> · {o.codigo}</span> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
