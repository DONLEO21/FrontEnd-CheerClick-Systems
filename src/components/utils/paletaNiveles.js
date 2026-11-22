// Paleta determinista para etiquetas de nivel / plan: el mismo nombre siempre da el mismo color y un nivel o plan NUEVO
// creado por el administrador se ve bien sin tocar código (antes caía en un gris genérico).
const PALETA = [
  { backgroundColor: "#dbeafe", color: "#2f80ed" },
  { backgroundColor: "#e7ceff", color: "#a318ff" },
  { backgroundColor: "#fcd1e5", color: "#fc4e4e" },
  { backgroundColor: "#fae9b8", color: "#fa9230" },
  { backgroundColor: "#faa9b1", color: "#ff1414" },
  { backgroundColor: "#d1f2e0", color: "#1eaf52" },
  { backgroundColor: "#d6f1f5", color: "#0e8aa0" },
];

const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

/** Color de la paleta según el texto (hash estable). Texto vacío -> gris neutro. */
export function estiloPorPaleta(texto) {
  const clave = normalizar(texto);
  if (!clave) return { backgroundColor: "#495057", color: "#ffffff" };
  let hash = 0;
  for (const c of clave) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return PALETA[hash % PALETA.length];
}
