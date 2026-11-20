import { useState } from "react";
import "../../atleta/PQRS/PQRS.css";
import ModalNuevaPqrs from "../../atleta/PQRS/ModalNuevaPqrs";
import AvisoToast from "../../../components/Compartidos/AvisoToast";
import useAviso from "../../../hooks/useAviso";
import { crearPqrs } from "../../../services/pqrsService";
import { ESTADO_INICIAL_FORM, TIPOS_ARCHIVO, TAMANO_MAX_ARCHIVO, radicadoDe } from "../../atleta/PQRS/pqrsData";

/**
 * PQRS del entrenador: SOLO puede enviar solicitudes. No ve el listado ni responde las de otros
 * (eso es exclusivo del administrador). Reutiliza el formulario del atleta.
 * TODO(backend): POST /api/pqrs hoy solo autoriza el rol 'Atleta'; hay que agregar 'Entrenador'
 *   en pqrs.routes.js para que el envío funcione (ver docs/backend-pqrs-entrenador/LEEME.md).
 */
export default function PQRSEntrenador() {
  const { aviso, mostrarAviso } = useAviso();
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(ESTADO_INICIAL_FORM);
  const [enviando, setEnviando] = useState(false);

  const abrir = () => { setForm(ESTADO_INICIAL_FORM); setAbierto(true); };

  const enviar = (e) => {
    e.preventDefault();
    const asunto = form.asunto.trim();
    const descripcion = form.descripcion.trim();
    const { archivo } = form;

    if (!form.tipo) return mostrarAviso("Selecciona el tipo de solicitud.", "error");
    if (!asunto) return mostrarAviso("El asunto es obligatorio.", "error");
    if (!descripcion) return mostrarAviso("La descripción es obligatoria.", "error");
    if (archivo && !TIPOS_ARCHIVO.includes(archivo.type)) return mostrarAviso("La evidencia debe ser un archivo PDF, JPG o PNG.", "error");
    if (archivo && archivo.size > TAMANO_MAX_ARCHIVO) return mostrarAviso("La evidencia no puede superar los 5 MB.", "error");

    setEnviando(true);
    crearPqrs({ tipo: form.tipo, asunto, descripcion, evidencia: archivo ? archivo.name : form.evidencia })
      .then((creada) => {
        mostrarAviso(`Solicitud ${radicadoDe(creada)} enviada. El administrador la revisará.`, "ok");
        setAbierto(false);
      })
      .catch((err) => mostrarAviso(err?.message || "No se pudo enviar la solicitud.", "error"))
      .finally(() => setEnviando(false));
  };

  return (
    <main className="ui-contenido container-fluid py-4 px-3 px-md-4 pqa-page">
      <header className="pqa-cabecera">
        <div>
          <h1 className="pqa-titulo-seccion">PQRS</h1>
          <p className="pqa-subtitulo">
            Envía una petición, queja, reclamo o sugerencia al equipo administrativo del club.
          </p>
        </div>
        <button type="button" className="btn pqa-btn-nueva" onClick={abrir}>
          <i className="bi bi-plus-lg" aria-hidden="true" />
          Registrar Nueva PQRS
        </button>
      </header>

      <hr className="pqa-separador" />

      <aside className="pqa-aviso-plazo" aria-label="Información sobre las solicitudes">
        <i className="bi bi-info-circle" aria-hidden="true" />
        <p>
          Las solicitudes se envían al administrador, que es quien las revisa y responde. Desde esta
          sección solo puedes registrarlas; no se muestran las solicitudes de otros usuarios.
        </p>
      </aside>

      <ModalNuevaPqrs
        abierto={abierto}
        editando={null}
        form={form}
        setForm={setForm}
        enviando={enviando}
        onCerrar={() => setAbierto(false)}
        onGuardar={enviar}
        subtituloNueva="Cuéntanos qué necesitas. El equipo administrativo revisará tu solicitud."
      />

      <AvisoToast aviso={aviso} />
    </main>
  );
}
