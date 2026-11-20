
import "./PQRS.css";
import { useMemo, useState, useEffect } from "react";

import FiltrosSolicitudes from "./FiltrosSolicitudes";
import SolicitudCard from "./SolicitudCard";
import ModalNuevaPqrs from "./ModalNuevaPqrs";
import ModalDetalle from "./ModalDetalle";
import { useSesion } from "../../../context/SesionContext";
import { listarPqrs, crearPqrs, sinSoporteBackend } from "../../../services/pqrsService";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";

import {
  ESTADO_INICIAL_FORM,
  TIPOS_ARCHIVO,
  TAMANO_MAX_ARCHIVO,
  etiquetaTipo,
  radicadoDe,
} from "./pqrsData";


const normalizar = (texto) =>
  texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function PQRS() {
  const { sesion } = useSesion();
  const remitente = sesion.usuario?.id ?? "";

  const [pqrs, setPqrs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);


  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);

    // el backend ya devuelve solo las PQRS del atleta autenticado
    listarPqrs()
      .then((datos) => {
        if (!activo) return;
        setPqrs(datos);
      })
      .catch((err) => activo && setError(err))
      .finally(() => activo && setCargando(false));

    return () => {
      activo = false;
    };
  }, [remitente]);

  const { aviso, mostrarAviso } = useAviso({ tipoPorDefecto: "ok" });
  const avisoErrorApi = (err) =>
    mostrarAviso(err?.message || "No se pudo completar la acción. Inténtalo de nuevo.", "error");

 
  const [modalNueva, setModalNueva] = useState({ abierto: false, editando: null });
  const [formNueva, setFormNueva] = useState(ESTADO_INICIAL_FORM);

  const [modalDetalle, setModalDetalle] = useState({ abierto: false, id: null });
  const [seguimiento, setSeguimiento] = useState("");

  const visibles = useMemo(() => pqrs.filter((p) => !p.inhabilitada), [pqrs]);

  const contadores = useMemo(
    () => ({
      todas: visibles.length,
      pendiente: visibles.filter((p) => p.estado === "pendiente").length,
      tramite: visibles.filter((p) => p.estado === "tramite").length,
      resuelto: visibles.filter((p) => p.estado === "resuelto").length,
    }),
    [visibles]
  );

  const solicitudes = useMemo(() => {
    const consulta = normalizar(busqueda.trim());

    return visibles
      .filter(
        (p) =>
          (filtroEstado === "todas" || p.estado === filtroEstado) &&
          (!consulta ||
            normalizar(`${radicadoDe(p)} ${p.asunto} ${etiquetaTipo(p.tipo)} ${p.descripcion}`).includes(consulta))
      )
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || radicadoDe(b).localeCompare(radicadoDe(a)));
  }, [visibles, busqueda, filtroEstado]);

  const seleccionada = useMemo(
    () => pqrs.find((p) => p.id === modalDetalle.id) ?? null,
    [pqrs, modalDetalle.id]
  );

  /* ═══════════════════ REGISTRAR / EDITAR ═══════════════════ */

  const abrirNueva = () => {
    setFormNueva(ESTADO_INICIAL_FORM);
    setModalNueva({ abierto: true, editando: null });
  };

  const abrirEditar = (solicitud) => {
    setFormNueva({
      tipo: solicitud.tipo,
      asunto: solicitud.asunto,
      descripcion: solicitud.descripcion,
      evidencia: solicitud.evidencia ?? "",
      archivo: null,
    });
    setModalNueva({ abierto: true, editando: solicitud });
  };

  const cerrarModalNueva = () => setModalNueva((m) => ({ ...m, abierto: false }));

  // CREATE (POST) / UPDATE (PATCH)
  const guardarSolicitud = (e) => {
    e.preventDefault();
    const asunto = formNueva.asunto.trim();
    const descripcion = formNueva.descripcion.trim();
    const { archivo } = formNueva;

    if (!formNueva.tipo) return mostrarAviso("Selecciona el tipo de solicitud.", "error");
    if (!asunto) return mostrarAviso("El asunto es obligatorio.", "error");
    if (!descripcion) return mostrarAviso("La descripción es obligatoria.", "error");
    if (archivo && !TIPOS_ARCHIVO.includes(archivo.type)) {
      return mostrarAviso("La evidencia debe ser un archivo PDF, JPG o PNG.", "error");
    }
    if (archivo && archivo.size > TAMANO_MAX_ARCHIVO) {
      return mostrarAviso("La evidencia no puede superar los 5 MB.", "error");
    }

    const datos = {
      tipo: formNueva.tipo,
      asunto,
      descripcion,
      evidencia: archivo ? archivo.name : formNueva.evidencia,
    };

    setEnviando(true);

    if (modalNueva.editando) {
      // UPDATE
      const { id } = modalNueva.editando;
      // TODO(backend): el atleta no puede editar una PQRS ya radicada.
      sinSoporteBackend("Editar una solicitud")
        .then((actualizada) => {
          setPqrs((prev) => prev.map((p) => (p.id === id ? actualizada : p)));
          mostrarAviso("Cambios guardados.", "ok");
          cerrarModalNueva();
        })
        .catch(avisoErrorApi)
        .finally(() => setEnviando(false));
    } else {
      // CREATE
      crearPqrs(datos)
        .then((creada) => {
          setPqrs((prev) => [creada, ...prev]);
          setBusqueda("");
          setFiltroEstado("todas");
          mostrarAviso(`Solicitud ${radicadoDe(creada)} enviada.`, "ok");
          cerrarModalNueva();
        })
        .catch(avisoErrorApi)
        .finally(() => setEnviando(false));
    }
  };

  /* ═══════════════════ DETALLE Y SEGUIMIENTO ═══════════════════ */

  const abrirDetalle = (solicitud) => {
    setSeguimiento("");
    setModalDetalle({ abierto: true, id: solicitud.id });
  };

  const cerrarModalDetalle = () => setModalDetalle((m) => ({ ...m, abierto: false }));

  // UPDATE parcial agrega información adicional a la solicitud
  const enviarSeguimiento = (e) => {
    e.preventDefault();
    const texto = seguimiento.trim();
    if (!texto) return mostrarAviso("Escribe la información adicional antes de enviarla.", "error");

    const { id } = seleccionada;

    setEnviando(true);
    // TODO(backend): no existe endpoint para agregar información adicional a una PQRS.
    sinSoporteBackend("Enviar información adicional")
      .then((actualizada) => {
        setPqrs((prev) => prev.map((p) => (p.id === id ? actualizada : p)));
        setSeguimiento("");
        mostrarAviso("Seguimiento enviado.", "ok");
        cerrarModalDetalle();
      })
      .catch(avisoErrorApi)
      .finally(() => setEnviando(false));
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
    <main className="ui-contenido container-fluid py-4 px-3 px-md-4 pqa-page">
      <header className="pqa-cabecera">
        <div>
          <h1 className="pqa-titulo-seccion">Mis Solicitudes PQRS</h1>
          <p className="pqa-subtitulo">
            Consulta el estado de tus peticiones, quejas, reclamos y sugerencias, o registra una nueva.
          </p>
        </div>
        <button type="button" className="btn pqa-btn-nueva" onClick={abrirNueva}>
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Registrar Nueva PQRS
        </button>
      </header>

      <hr className="pqa-separador" />

      <FiltrosSolicitudes
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtroEstado={filtroEstado}
        onFiltroEstado={setFiltroEstado}
        contadores={contadores}
      />

      {solicitudes.length === 0 ? (
        <p className="pqa-vacio">
          {visibles.length === 0
            ? "Aún no has registrado ninguna solicitud."
            : "No se encontraron solicitudes con ese filtro."}
        </p>
      ) : (
        <div className="row g-4">
          {solicitudes.map((solicitud, i) => (
            <div className="col-12 col-xl-6" key={solicitud.id}>
              <SolicitudCard
                solicitud={solicitud}
                delay={0.05 + Math.min(i, 5) * 0.07}
                onEditar={abrirEditar}
                onVerDetalle={abrirDetalle}
              />
            </div>
          ))}
        </div>
      )}

      <aside className="pqa-aviso-plazo" aria-label="Información sobre tiempos de respuesta">
        <i className="bi bi-check-circle" aria-hidden="true" />
        <p>
          Tus solicitudes se revisan y responden en un plazo máximo de 5 días hábiles. Te avisaremos
          aquí y por notificación cuando haya una respuesta.
        </p>
      </aside>

      <ModalNuevaPqrs
        abierto={modalNueva.abierto}
        editando={modalNueva.editando}
        form={formNueva}
        setForm={setFormNueva}
        enviando={enviando}
        onCerrar={cerrarModalNueva}
        onGuardar={guardarSolicitud}
      />

      <ModalDetalle
        abierto={modalDetalle.abierto}
        solicitud={seleccionada}
        seguimiento={seguimiento}
        setSeguimiento={setSeguimiento}
        enviando={enviando}
        onCerrar={cerrarModalDetalle}
        onEnviarSeguimiento={enviarSeguimiento}
      />

      <AvisoToast aviso={aviso} />
    </main>
  );
}
