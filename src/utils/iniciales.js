// Iniciales de una persona: UNA sola regla para todo el proyecto (avatares, tablas, tarjetas).
//   · Dos iniciales en mayúscula: la primera letra del PRIMER NOMBRE y la del PRIMER APELLIDO ("Leonardo" "Jara Molina" → "LJ").
//   · Se ignoran espacios, signos y números; se respetan las tildes y la Ñ ("Álvaro Ñúñez" → "AÑ").
//   · Si falta el apellido, solo la inicial del nombre; si falta todo, "?".
//   · Con UN solo texto de nombre completo ("Leonardo Jara Molina"): 2 o 3 palabras → primera y segunda; 4 o más (dos
//     nombres y dos apellidos) → primera y tercera. Siempre que se pueda, pasa nombre y apellido por separado.

const letraInicial = (texto) => (String(texto ?? "").match(/\p{L}/u)?.[0] ?? "").toLocaleUpperCase("es");
const palabras = (texto) => String(texto ?? "").split(/\s+/).filter((p) => /\p{L}/u.test(p));

export function inicialesDe(nombre = "", apellido = "") {
  const nombres = palabras(nombre);
  const apellidos = palabras(apellido);
  const primera = letraInicial(nombres[0]);
  // Segunda inicial: el primer apellido si viene aparte; si no, la segunda palabra (la tercera con 4 o más palabras)
  const segunda = letraInicial(apellidos.length > 0 ? apellidos[0] : nombres[nombres.length >= 4 ? 2 : 1]);
  return `${primera}${segunda}` || "?";
}

// Paleta suave del proyecto (fondo + texto oscuro del mismo tono: contraste AA). El rojo corporativo suave va primero.
const PALETA = [
  { fondo: "#fbe3e4", texto: "#8a0f14" },
  { fondo: "#fde8d7", texto: "#8a3a05" },
  { fondo: "#fdf1c7", texto: "#6b4e00" },
  { fondo: "#dff3e4", texto: "#14562b" },
  { fondo: "#d9f0f3", texto: "#0c5560" },
  { fondo: "#dfe7fb", texto: "#233f94" },
  { fondo: "#eadffb", texto: "#4a2491" },
  { fondo: "#f9dcec", texto: "#85145a" },
];

/** Color estable por persona: depende solo de la clave (código o id), así no cambia entre pantallas ni al recargar. */
export function colorAvatar(clave) {
  const texto = String(clave ?? "");
  if (!texto) return PALETA[0];
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return PALETA[h % PALETA.length];
}
