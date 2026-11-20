/** "Buenos días" (5:00–11:59), "Buenas tardes" (12:00–18:59) o "Buenas noches" (19:00–4:59), según la hora local. */
export function saludoPorHora(fecha = new Date()) {
  const h = fecha.getHours();
  if (h >= 5 && h < 12) return "Buenos días";
  if (h >= 12 && h < 19) return "Buenas tardes";
  return "Buenas noches";
}

/** Fecha en español, p. ej. "viernes, 20 de noviembre de 2026". */
export function fechaLargaEs(fecha = new Date()) {
  return new Intl.DateTimeFormat("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(fecha);
}
