// Textos INSTITUCIONALES de la página de inicio (no son datos de negocio): una frase por división conocida y una
// genérica para cualquier nivel nuevo que cree el administrador. La lista de niveles, entrenadores y horarios sale
// de la API (GET /niveles/publico); aquí solo viven las frases.

export const DESCRIPCION_GENERICA = "Entrena con nosotros: técnica, disciplina y trabajo en equipo en cada sesión.";

// Clave = nombre de la división en minúsculas y sin tildes (la parte posterior a "Nivel N")
export const DESCRIPCION_POR_DIVISION = {
  "king": "El punto de partida ideal. Aprende las bases del cheerleading en un ambiente seguro",
  "queen": "Desarrollo de habilidades fundamentales con enfoque en coordinación, técnico y trabajo en equipo",
  "queens": "Desarrollo de habilidades fundamentales con enfoque en coordinación, técnico y trabajo en equipo",
  "princess": "Categoría nivel 2 con formación técnica sólida, expresión y disciplina como pilares centrales",
  "magic": "Acrobacias avanzadas, stunts de nivel 3 y rutinas de alto impacto para competencia regional.",
  "blood tigers": "Nuestro equipo insignia. Atletas seleccionados que representan el club en competencias nacionales e internacionales.",
};

export const ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
