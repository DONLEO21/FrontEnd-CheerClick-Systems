
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { diasSemana, etiquetaDias, comprimirImagen } from "./horariosData";
import SelectorEntrenador from "./SelectorEntrenador";
import FotoPersona from "../../../components/Compartidos/FotoPersona";
import { listarEntrenadoresAsignables } from "../../../services/horariosService";

const BLOQUE_VACIO = () => ({ dias: [], inicio: "18:00", fin: "20:00" });

export default function ModalNivel({ abierto, formNivel, setFormNivel, onCerrar, onGuardar, onAviso }) {
  const inputFotoRef = useRef(null);
  const primerCampoRef = useRef(null);


  // Entrenadores asignables (entrenadores y administradores que también entrenan), siempre del servidor
  const [entrenadores, setEntrenadores] = useState([]);
  const [cargandoEntrenadores, setCargandoEntrenadores] = useState(false);
  const [errorEntrenadores, setErrorEntrenadores] = useState("");

  const cargarEntrenadores = useCallback(() => {
    setCargandoEntrenadores(true);
    setErrorEntrenadores("");
    listarEntrenadoresAsignables()
      .then(setEntrenadores)
      .catch((e) => setErrorEntrenadores(e?.message || "No se pudo cargar la lista de entrenadores."))
      .finally(() => setCargandoEntrenadores(false));
  }, []);

  // El entrenador actual del nivel SIEMPRE está en las opciones y preseleccionado; si ya no puede dirigir niveles
  // (perdió el rol, está inactivo o ya no existe) se marca «Sin rol de entrenador activo» en vez de dejar el campo vacío.
  const opciones = useMemo(() => {
    const actual = formNivel.entrenadorIdOriginal;
    if (!actual || entrenadores.some((o) => o.id === actual)) return entrenadores;
    const nombre = formNivel.entrenador || "Entrenador no encontrado";
    return [{ id: actual, nombre: formNivel.entrenador, codigo: "", etiqueta: `${nombre} · Sin rol de entrenador activo`, marcada: true }, ...entrenadores];
  }, [entrenadores, formNivel.entrenadorIdOriginal, formNivel.entrenador]);

  useEffect(() => {
    if (!abierto) return;
    primerCampoRef.current?.focus();
    cargarEntrenadores();
  }, [abierto, cargarEntrenadores]);

  if (!abierto) return null;

  const alternarDiaDelBloque = (idxBloque, dia) => {
    setFormNivel((f) => {
      const horarios = f.horarios.map((b, i) => {
        if (i !== idxBloque) return b;
        const dias = b.dias.includes(dia) ? b.dias.filter((d) => d !== dia) : [...b.dias, dia];
        return { ...b, dias };
      });
      return { ...f, horarios };
    });
  };

  const cambiarHoraBloque = (idxBloque, campo, valor) => {
    setFormNivel((f) => {
      const horarios = f.horarios.map((b, i) => (i === idxBloque ? { ...b, [campo]: valor } : b));
      return { ...f, horarios };
    });
  };

  const agregarBloque = () =>
    setFormNivel((f) => ({ ...f, horarios: [...f.horarios, BLOQUE_VACIO()] }));

  const quitarBloque = (idxBloque) => {
    setFormNivel((f) => {
      if (f.horarios.length <= 1) return f;
      return { ...f, horarios: f.horarios.filter((_, i) => i !== idxBloque) };
    });
  };

  const previsualizarFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    comprimirImagen(file, 400, 0.7)
      .then((dataUrl) => setFormNivel((f) => ({ ...f, foto: dataUrl })))
      .catch(() => onAviso?.("No se pudo procesar la imagen. Intenta con otra.", "error"));
  };

  return (
    <div
      className="superposicion-modal d-flex align-items-center justify-content-center"
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
    >
      <div className="contenedor-modal">
        <div className="encabezado-modal">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-pencil-square text-white" />
            <h2>{formNivel.id !== null ? "Editar Horario" : "Nuevo Nivel"}</h2>
          </div>
        </div>

        <div className="cuerpo-modal">
          <div className="grupo-formulario">
            <label className="etiqueta-formulario" htmlFor="modal-categoria">
              Nombre del Nivel
            </label>
            <input
              ref={primerCampoRef}
              id="modal-categoria"
              type="text"
              className="campo-formulario"
              placeholder="Ej: Nivel 1.1 Formativo"
              value={formNivel.categoria}
              onChange={(e) => setFormNivel((f) => ({ ...f, categoria: e.target.value }))}
            />
          </div>

          <div className="grupo-formulario">
            <label className="etiqueta-formulario">Foto del Entrenador</label>
            <p className="pista-subida mb-2" style={{ marginTop: -4 }}>
              Si no subes una foto, la tarjeta usa la foto de perfil del entrenador.
            </p>
            <div className="zona-subida-foto" onClick={() => inputFotoRef.current?.click()}>
              <div className="contenedor-vista-previa">
                {formNivel.foto && <FotoPersona src={formNivel.foto} nombre={formNivel.entrenador} alt="Vista previa" />}
              </div>
              <div>
                <p className="texto-principal-subida mb-0">Haz clic para subir foto</p>
                <p className="pista-subida mb-0">JPG, PNG · MÁX 5 MB</p>
              </div>
              <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={previsualizarFoto}
              />
            </div>
          </div>

          <div className="grupo-formulario">
            <label className="etiqueta-formulario" htmlFor="modal-entrenador">
              Entrenador
            </label>
            <SelectorEntrenador
              id="modal-entrenador"
              opciones={opciones}
              valorId={formNivel.entrenadorId}
              cargando={cargandoEntrenadores}
              errorCarga={errorEntrenadores}
              onReintentar={cargarEntrenadores}
              onElegir={(idElegido, o) => setFormNivel((f) => ({ ...f, entrenadorId: idElegido, entrenador: o.nombre ?? f.entrenador }))}
            />
          </div>

          <div className="grupo-formulario">
            <label className="etiqueta-formulario">Horarios</label>
            <p className="pista-subida mb-2" style={{ marginTop: -6 }}>
            </p>

            <div className="d-flex flex-column gap-3">
              {formNivel.horarios.map((bloque, idx) => (
                <div className="bloque-horario" key={idx}>
                  <div className="selector-dias selector-dias--bloque">
                    {diasSemana.map((dia) => (
                      <button
                        key={dia}
                        type="button"
                        className={`btn-dia ${bloque.dias.includes(dia) ? "activo" : ""}`}
                        onClick={() => alternarDiaDelBloque(idx, dia)}
                      >
                        {etiquetaDias[dia].slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  <div className="fila-horario fila-horario--bloque">
                    <input
                      type="time"
                      className="campo-formulario"
                      value={bloque.inicio}
                      onChange={(e) => cambiarHoraBloque(idx, "inicio", e.target.value)}
                    />
                    <span className="separador-hora">–</span>
                    <input
                      type="time"
                      className="campo-formulario"
                      value={bloque.fin}
                      onChange={(e) => cambiarHoraBloque(idx, "fin", e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-quitar-horario"
                      title="Eliminar este horario"
                      onClick={() => quitarBloque(idx)}
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn-agregar-horario mt-2" onClick={agregarBloque}>
              + Agregar Horario
            </button>
          </div>
        </div>

        <div className="pie-modal">
          <button type="button" className="btn-cancelar-modal" onClick={onCerrar}>
            Cancelar
          </button>
          <button type="button" className="btn-guardar-modal" onClick={onGuardar}>
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
