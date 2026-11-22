// Estados de asistencia: UNA sola definición (etiqueta, letra y clase) para la leyenda, las celdas del modal
// "Consultar asistencia", el CSV y el documento exportable, de modo que nunca diverjan.
// Claves internas de la interfaz: presente | inpuntual | falta | justificado.

export const ESTADOS_ASISTENCIA = {
  presente: { etiqueta: "Presente", letra: "P", clase: "p" },
  inpuntual: { etiqueta: "Impuntual", letra: "I", clase: "i" },
  falta: { etiqueta: "Falta", letra: "F", clase: "f" },
  justificado: { etiqueta: "Justificado", letra: "J", clase: "j" },
};

export const ORDEN_ESTADOS = ["presente", "inpuntual", "falta", "justificado"];

const sinTildes = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

// Acepta lo que envía el backend (Presente, Tarde, Inasistencia, Justificado) y las claves de la interfaz,
// en cualquier combinación de mayúsculas y tildes. Devuelve la clave interna o null si no se reconoce.
const EQUIVALENCIAS = {
  presente: "presente",
  tarde: "inpuntual",
  impuntual: "inpuntual",
  inpuntual: "inpuntual",
  inasistencia: "falta",
  falta: "falta",
  ausente: "falta",
  justificado: "justificado",
  justificada: "justificado",
};

export const normalizarEstado = (valor) => EQUIVALENCIAS[sinTildes(valor)] ?? null;

export const etiquetaEstado = (estado) => ESTADOS_ASISTENCIA[estado]?.etiqueta ?? "";
