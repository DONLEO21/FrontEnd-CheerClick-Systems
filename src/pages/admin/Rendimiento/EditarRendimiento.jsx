import { useEffect, useMemo, useState } from "react";
import { listarHabilidades, listarProgresoAtleta, guardarProgresoAtleta } from "../../../services/rendimientoAdminService";
import imgusuario from "../../../assets/icons/usuarios.png";
import { obtenerEstiloNivel } from "../../../components/utils/nivelEstilos";
import "./EditarRendimiento.css";


const PESTANAS = [
  { key: "apropiada", label: "Apropiadas", icon: <i className="bi bi-stars"></i> },
  { key: "avanzada", label: "Avanzadas", icon: <i className="bi bi-arrow-up-right"></i> },
  { key: "elite", label: "Élite", icon: <i className="bi bi-trophy"></i> },
];

function EditarRendimiento({ atleta, onVolver, onAviso }) {
  const [habilidades, setHabilidades] = useState([]);
  const [progresoOriginal, setProgresoOriginal] = useState([]);
  const [progresoEditado, setProgresoEditado] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [nivelActivo, setNivelActivo] = useState("apropiada");
  const [busquedaHabilidad, setBusquedaHabilidad] = useState("");
  const [notaSesion, setNotaSesion] = useState("");
  const [descripcionHabilidades, setDescripcionHabilidades] = useState("");

  useEffect(() => {
    if (!atleta) return;

    setCargando(true);

    Promise.all([
      listarHabilidades(),
      listarProgresoAtleta(atleta.id),
    ])
      .then(([datosHabilidades, progresoDelAtleta]) => {
        setHabilidades(datosHabilidades);
        setProgresoOriginal(progresoDelAtleta);
        setProgresoEditado(progresoDelAtleta);
      })
      .catch((error) => {
        console.error("Error al cargar datos:", error);
        setHabilidades([]);
        setProgresoOriginal([]);
        setProgresoEditado([]);
      })
      .finally(() => setCargando(false));
  }, [atleta]);

  // Cada habilidad con su estado actual (completado o no)
  const habilidadesDelAtleta = useMemo(() => {
    return habilidades.map((h) => {
      const registro = progresoEditado.find((p) => p.habilidadId === h.id);
      return {
        ...h,
        completado: registro ? registro.completado : false,
      };
    });
  }, [habilidades, progresoEditado]);

  const habilidadesFiltradas = useMemo(() => {
    return habilidadesDelAtleta
      .filter((h) => h.categoria === nivelActivo)
      .filter((h) => h.texto.toLowerCase().includes(busquedaHabilidad.toLowerCase().trim()));
  }, [habilidadesDelAtleta, nivelActivo, busquedaHabilidad]);

  // Registros que cambiaron respecto a lo que hay en el servidor.
  // - Si ya existía: cambió si el valor es distinto.
  // - Si es nuevo: solo cuenta si quedó en "Completado" (false es el valor por defecto).
  const cambios = useMemo(() => {
    return progresoEditado.filter((editado) => {
      const original = progresoOriginal.find((o) => o.id === editado.id);
      return original ? original.completado !== editado.completado : editado.completado;
    });
  }, [progresoEditado, progresoOriginal]);

  const hayCambios = cambios.length > 0;

  // Marca una habilidad por su id. Si todavía no tiene registro de progreso, lo crea.
  const marcarHabilidad = (habilidadId, nuevoValor) => {
    setProgresoEditado((prev) => {
      const existe = prev.some((p) => p.habilidadId === habilidadId);

      if (existe) {
        return prev.map((p) =>
          p.habilidadId === habilidadId ? { ...p, completado: nuevoValor } : p
        );
      }

      return [
        ...prev,
        {
          id: `${atleta.id}-${habilidadId}`,
          atletaId: String(atleta.id),
          habilidadId,
          completado: nuevoValor,
        },
      ];
    });
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      await guardarProgresoAtleta(atleta.id, { cambios });

      // El aviso se muestra en el padre, porque este componente se desmonta al volver
      onVolver("Cambios guardados correctamente");
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      onAviso?.(error.message || "Hubo un error al guardar los cambios. Intenta de nuevo.", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleCancelar = () => {
    onVolver();
  };

  if (!atleta) return null;

  return (
    <main className="mt-3 adm-rendimiento-contenido-editar">

      <aside className="adm-rendimiento-conte-infor">
        <div>
          <img className="adm-rendimiento-foto" src={imgusuario} alt="Foto Atleta" />
        </div>
        <div>
          <h3>Detalle del Atleta</h3>
          <h4>{atleta.nombre}</h4>
          <h5>
            Edad: {atleta.edad} -{" "}
            <button className="btn-nivel btn btn-sm border-0" style={obtenerEstiloNivel(atleta.nivel)}>
              {atleta.nivel}
            </button>
          </h5>
        </div>
      </aside>

      <section className="adm-rendimiento-panel-input">
        <h4 className="titu-conte">Observaciones y habilidades</h4>
        <div className="adm-rendimiento-conte-input">
          <div className="conte-ob">
            <label className="adm-rendimiento-titu-input" htmlFor="nota-sesion">
              Notas de la sesión
            </label>
            <textarea
              id="nota-sesion"
              className="input-con adm-rendimiento-nota-sesion"
              value={notaSesion}
              onChange={(e) => setNotaSesion(e.target.value)}
              placeholder="Escribe aquí observaciones sobre la sesión..."
            />
          </div>
          <div className="conte-ob">
            <label className="adm-rendimiento-titu-input" htmlFor="nota-sesion">
              Descripción de habilidades
            </label>
            <textarea
              id="nota-sesion"
              className="input-con adm-rendimiento-nota-sesion"
              value={descripcionHabilidades}
              onChange={(e) => setDescripcionHabilidades(e.target.value)}
              placeholder="Describe el trabajo realizado en habilidades..."
            />
          </div>

        </div>
      </section>

      <section className="adm-rendimiento-conte-targe">
        <h4 className="titu-conte">Métricas de desempeño</h4>

        <section className="adm-rendimiento-fil-busque">
          <input
            type="search"
            placeholder="Buscar Habilidad..."
            className="search-input"
            value={busquedaHabilidad}
            onChange={(e) => setBusquedaHabilidad(e.target.value)}
          />
          <div className="adm-rendimiento-bnt">
            {PESTANAS.map((pestana) => (
              <button
                key={pestana.key}
                type="button"
                className={`btn-pestana ${nivelActivo === pestana.key ? "activo" : ""}`}
                onClick={() => setNivelActivo(pestana.key)}
              >
                {pestana.icon}
                {pestana.label}
              </button>
            ))}
          </div>
        </section>

        <section className="adm-rendimiento-habilidades">
          {cargando ? (
            <p className="text-muted text-center py-4">Cargando habilidades...</p>
          ) : (
            <div className="grid-habi">
              {habilidadesFiltradas.length > 0 ? (
                habilidadesFiltradas.map((h) => (
                  <div className="targe-habi" key={h.id}>
                    <div>
                      <span className="tex-habi">{h.texto}</span>
                    </div>
                    <div className="conte-btn-habi">
                      <button
                        type="button"
                        className={h.completado ? "btn-completado activo" : "btn-completado"}
                        onClick={() => marcarHabilidad(h.id, true)}
                      >
                        Completado
                      </button>
                      <button
                        type="button"
                        className={!h.completado ? "btn-completad activo" : "btn-completad"}
                        onClick={() => marcarHabilidad(h.id, false)}
                      >
                        No logrado
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center py-4">
                  No hay habilidades registradas para este nivel.
                </p>
              )}
            </div>
          )}
        </section>
      </section>

      <footer className="adm-rendimiento-guardar-cam">
        <div className="adm-rendimiento-conte-final">
          <span>{hayCambios ? "Cambios sin guardar" : "Sin cambios"}</span>
        </div>
        <div className="adm-rendimiento-conte-final">
          <button type="button" className="adm-rendimiento-cancelar" onClick={handleCancelar} disabled={guardando}>
            Cancelar
          </button>
          <button type="button" className="adm-rendimiento-guardar" onClick={handleGuardar} disabled={guardando || !hayCambios}>
            {guardando ? "Guardando..." : "Guardar registro"}
          </button>
        </div>
      </footer>
    </main>
  );
}

export default EditarRendimiento;