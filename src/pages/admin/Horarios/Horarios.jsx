
import "./Horarios.css";
import { useMemo, useState, useEffect } from "react";

import NivelCard from "./NivelCard";
import CompetenciaCard from "./CompetenciaCard";
import ModalNivel from "./ModalNivel";
import ModalCompetencia from "./ModalCompetencia";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";

import { contarPorNivel } from "./horariosData";
import {
  listarNiveles,
  listarCompetencias,
  guardarNivel as guardarNivelApi,
  alternarNivel,
  guardarCompetencia as guardarCompetenciaApi,
  alternarCompetencia,
} from "../../../services/horariosService";

const ESTADO_INICIAL_NIVEL = {
  id: null,
  categoria: "",
  entrenador: "",
  foto: "",
  horarios: [{ dias: [], inicio: "18:00", fin: "20:00" }],
};

const ESTADO_INICIAL_TORNEO = {
  id: null,
  nombre: "",
  fecha: "",
  ciudad: "",
  costo: "",
  limite: "",
  etiquetaLimite: "Límite de pago",
  nivel: "",
  imagen: "",
  link: "",
};

function HorariosContenido() {
  const [niveles, setNiveles] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [subTabActiva, setSubTabActiva] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);

    Promise.all([
      listarNiveles(),
      listarCompetencias(),
    ])
      .then(([n, t]) => {
        if (!activo) return;
        setNiveles(n);
        setTorneos(t);
        setSubTabActiva((actual) => actual || n[0]?.id || "");
      })
      .catch((err) => activo && setError(err))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, []);

  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });
  const avisoErrorApi = (err) =>
    mostrarAviso(err?.message || "No se pudo completar la acción. Inténtalo de nuevo.", "error");

  const [tabActiva, setTabActiva] = useState("niveles");
  // Un nivel de competencia por cada nivel del club (vienen del backend)
  const nivelesCompetencia = useMemo(
    () => niveles.map((n) => ({ valor: n.id, etiqueta: n.categoria })),
    [niveles]
  );


  const [modalNivelAbierto, setModalNivelAbierto] = useState(false);
  const [formNivel, setFormNivel] = useState(ESTADO_INICIAL_NIVEL);

  const [modalCompetencia, setModalCompetencia] = useState({ abierto: false, modo: "registrar" });
  const [formCompetencia, setFormCompetencia] = useState(ESTADO_INICIAL_TORNEO);

  const torneosDelSubTab = useMemo(
    () => torneos.filter((t) => t.nivel === subTabActiva),
    [torneos, subTabActiva]
  );

  /* ═══════════════════ CRUD NIVELES ═══════════════════ */

  const abrirNuevoNivel = () => {
    setFormNivel(ESTADO_INICIAL_NIVEL);
    setModalNivelAbierto(true);
  };

  const abrirEditarNivel = (nivel) => {
    setFormNivel({
      ...nivel,
      horarios: nivel.horarios.map((b) => ({ ...b, dias: [...b.dias] })),
    });
    setModalNivelAbierto(true);
  };

  const guardarNivel = () => {
    const categoria = formNivel.categoria.trim();
    const entrenador = formNivel.entrenador.trim();
    if (!categoria) return mostrarAviso("El nombre del nivel es obligatorio.", "error");
    if (!entrenador) return mostrarAviso("El nombre del entrenador es obligatorio.", "error");

    for (const bloque of formNivel.horarios) {
      if (!bloque.dias.length) {
        return mostrarAviso("Cada horario debe tener al menos un día seleccionado.", "error");
      }
      if (!bloque.inicio || !bloque.fin || bloque.inicio >= bloque.fin) {
        return mostrarAviso("Revisa las horas: la de fin debe ser mayor a la de inicio.", "error");
      }
    }

    const esNuevo = formNivel.id === null;
    guardarNivelApi({ id: formNivel.id, categoria, entrenador, foto: formNivel.foto, horarios: formNivel.horarios })
      .then((guardado) => {
        setNiveles((prev) => (esNuevo ? [...prev, guardado] : prev.map((n) => (n.id === guardado.id ? guardado : n))));
        mostrarAviso(esNuevo ? "Nivel creado." : "Cambios guardados.", "ok");
        setModalNivelAbierto(false);
      })
      .catch(avisoErrorApi);
  };

  // UPDATE parcial inhabilitar / habilitar
  const alternarNivelHandler = (nivel) => {
    alternarNivel(nivel)
      .then((actualizado) => {
        setNiveles((prev) => prev.map((n) => (n.id === nivel.id ? actualizado : n)));
      })
      .catch(avisoErrorApi);
  };

  // TODO(backend): no existe DELETE de niveles ni de competencias; solo se inhabilitan.

  /* ═══════════════════ CRUD COMPETENCIAS ═══════════════════ */

  const abrirRegistrarCompetencia = () => {
    setFormCompetencia({ ...ESTADO_INICIAL_TORNEO, nivel: subTabActiva });
    setModalCompetencia({ abierto: true, modo: "registrar" });
  };

  const abrirModificarCompetencia = (torneo) => {
    setFormCompetencia({ ...torneo });
    setModalCompetencia({ abierto: true, modo: "modificar" });
  };

  const cerrarModalCompetencia = () => setModalCompetencia((m) => ({ ...m, abierto: false }));

  // CREATE (POST) / UPDATE (PATCH)
  const guardarCompetencia = (e) => {
    e.preventDefault();
    const { nombre, fecha, ciudad, costo, limite, nivel } = formCompetencia;
    if (!nombre.trim() || !fecha || !ciudad.trim() || !costo || !limite || !nivel) {
      return mostrarAviso("Completa todos los campos obligatorios.", "error");
    }

    const datos = {
      nombre: nombre.trim(),
      fecha,
      ciudad: ciudad.trim(),
      costo: Number(costo),
      limite,
      nivel,
      imagen: formCompetencia.imagen || "",
      link: formCompetencia.link || "",
    };
    const esRegistro = modalCompetencia.modo === "registrar";

    guardarCompetenciaApi(datos, esRegistro ? undefined : formCompetencia.id)
      .then((guardado) => {
        setTorneos((prev) => (esRegistro ? [...prev, guardado] : prev.map((x) => (x.id === guardado.id ? guardado : x))));
        setSubTabActiva(nivel);
        mostrarAviso(esRegistro ? "Competencia registrada." : "Cambios del torneo guardados.", "ok");
        cerrarModalCompetencia();
      })
      .catch(avisoErrorApi);
  };

  // UPDATE parcial inhabilitar / habilitar
  const alternarTorneoHandler = (torneo) => {
    alternarCompetencia(torneo)
      .then((actualizado) => {
        setTorneos((prev) => prev.map((x) => (x.id === torneo.id ? actualizado : x)));
      })
      .catch(avisoErrorApi);
  };

  if (cargando) {
    return (
      <main className="ui-contenido container-fluid py-5 text-center text-secondary">
        <div className="spinner-border text-danger mb-3" role="status" />
        <p>Cargando información…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="ui-contenido container-fluid py-5 text-center text-danger">
        <p className="fw-semibold mb-2">No se pudo conectar con la API.</p>
        <p className="text-secondary small mb-0">
          Inténtalo de nuevo en unos minutos.
        </p>
      </main>
    );
  }

  return (
    <main className="ui-contenido">
      <div className="encabezado-pagina">
        <h1 className="h3 fw-bold">Panel de Gestión</h1>
        <p className="text-secondary">Niveles, horarios y competencias del club</p>
      </div>

      <nav className="barra-pestanias d-flex mb-4">
        <button
          type="button"
          className={`etiqueta-pestania ${tabActiva === "niveles" ? "activa" : ""}`}
          onClick={() => setTabActiva("niveles")}
        >
          <i className="bi bi-people-fill" />
          Niveles &amp; Horarios
        </button>
        <button
          type="button"
          className={`etiqueta-pestania ${tabActiva === "competencias" ? "activa" : ""}`}
          onClick={() => setTabActiva("competencias")}
        >
          <i className="bi bi-trophy-fill" />
          Competencias
        </button>
      </nav>

      {tabActiva === "niveles" && (
        <section>
          <div className="encabezado-panel d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 gap-2">
            <div>
              <h2 className="titulo-panel">Niveles de Entrenamiento</h2>
              <p className="descripcion-panel">Gestiona los niveles y sus entrenadores</p>
            </div>
            <button type="button" className="btn-nueva-categoria" onClick={abrirNuevoNivel}>
              <i className="bi bi-plus-lg" />
              Nuevo Nivel
            </button>
          </div>

          <div className="row g-4">
            {niveles.map((nivel, i) => (
              <div className="col-12 col-md-6 col-xl-4" key={nivel.id}>
                <NivelCard
                  nivel={nivel}
                  onModificar={abrirEditarNivel}
                  onInhabilitar={alternarNivelHandler}
                  delay={i * 0.08}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {tabActiva === "competencias" && (
        <section>
          <div className="encabezado-panel d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 gap-2">
            <div>
              <h2 className="titulo-panel">Competencias Activas</h2>
              <p className="descripcion-panel">Torneos programados por equipo</p>
            </div>
            <button type="button" className="btn-nueva-competencia" onClick={abrirRegistrarCompetencia}>
              <i className="bi bi-trophy" />
              Registrar Competencia
            </button>
          </div>

          <nav className="barra-sub-pestanias d-flex flex-wrap gap-2 mb-4">
            {nivelesCompetencia.map((n) => (
              <button
                key={n.valor}
                type="button"
                className={`sub-etiqueta ${subTabActiva === n.valor ? "activa" : ""}`}
                onClick={() => setSubTabActiva(n.valor)}
              >
                <i className="bi bi-trophy sub-tab-icon" />
                {n.etiqueta.replace(/\s*\(.*\)/, "")}
                <span className="sub-count">{contarPorNivel(torneos, n.valor)}</span>
              </button>
            ))}
          </nav>

          <div className="row g-4">
            {torneosDelSubTab.map((t, i) => (
              <div className="col-12 col-sm-6 col-lg-4 col-xxl-3" key={t.id}>
                <CompetenciaCard
                  torneo={t}
                  onModificar={abrirModificarCompetencia}
                  onInhabilitar={alternarTorneoHandler}
                  delay={i * 0.06}
                />
              </div>
            ))}
            {!torneosDelSubTab.length && (
              <p className="text-secondary">No hay competencias registradas para este nivel.</p>
            )}
          </div>
        </section>
      )}

      <ModalNivel
        abierto={modalNivelAbierto}
        formNivel={formNivel}
        setFormNivel={setFormNivel}
        onCerrar={() => setModalNivelAbierto(false)}
        onGuardar={guardarNivel}
        onAviso={mostrarAviso}
      />

      <ModalCompetencia
        onAviso={mostrarAviso}
        niveles={nivelesCompetencia}
        abierto={modalCompetencia.abierto}
        modo={modalCompetencia.modo}
        form={formCompetencia}
        setForm={setFormCompetencia}
        onCerrar={cerrarModalCompetencia}
        onGuardar={guardarCompetencia}
      />

      <AvisoToast aviso={aviso} />
    </main>
  );
}

// Clase raíz del módulo: todos sus estilos viven bajo .adm-horarios
export default function Horarios(props) {
  return (
    <div className="adm-horarios">
      <HorariosContenido {...props} />
    </div>
  );
}
