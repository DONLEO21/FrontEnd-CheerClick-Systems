import { nivelesApi } from "../api/niveles.api";
import { DESCRIPCION_GENERICA, DESCRIPCION_POR_DIVISION, ORDEN_DIAS } from "../constants/landing";

// Niveles y horarios de la página de inicio, desde el endpoint público (sin sesión): GET /niveles/publico.

const sinTildes = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

/** "Nivel 3 Magic" -> { etiqueta: "NIVEL 3", division: "MAGIC" }; "Nivel Formativo King" -> { "INICIO", "FORMATIVO KING" }. */
export function partirNombreNivel(nombre) {
  const texto = String(nombre ?? "").trim();
  const numerado = /^nivel\s+(\d+)\s+(.+)$/i.exec(texto);
  if (numerado) {
    return { etiqueta: `NIVEL ${numerado[1]}`, division: numerado[2].toUpperCase(), clave: sinTildes(numerado[2]), titulo: `Nivel ${numerado[1]} | ${numerado[2]}` };
  }
  const formativo = /^nivel\s+formativo\s+(.+)$/i.exec(texto);
  if (formativo) {
    return { etiqueta: "INICIO", division: `NIVEL FORMATIVO ${formativo[1].toUpperCase()}`, clave: sinTildes(formativo[1]), titulo: `Nivel Inicio | Formativo ${formativo[1]}` };
  }
  return { etiqueta: "NIVEL", division: texto.toUpperCase(), clave: sinTildes(texto), titulo: texto };
}

// Formativo primero, luego por número de nivel; los que no encajan, al final
const ordenNivel = (nombre) => {
  const n = sinTildes(nombre);
  if (/formativo|inicio/.test(n)) return 0;
  const num = /nivel\s+(\d+)/.exec(n);
  return num ? Number(num[1]) : 99;
};

const hora12 = (hhmm) => {
  const [h, m] = String(hhmm ?? "").split(":").map(Number);
  return { texto: `${h % 12 || 12}:${String(m).padStart(2, "0")}`, meridiano: h < 12 ? "AM" : "PM" };
};

/** "16:00","18:00" -> "4:00 - 6:00 PM"; si cruzan el mediodía: "11:00 AM - 1:00 PM". */
export function rangoHoras(inicio, fin) {
  const a = hora12(inicio);
  const b = hora12(fin);
  return a.meridiano === b.meridiano ? `${a.texto} - ${b.texto} ${b.meridiano}` : `${a.texto} ${a.meridiano} - ${b.texto} ${b.meridiano}`;
}

export async function cargarNivelesLanding() {
  const { data } = await nivelesApi.listPublico();
  return (data ?? [])
    .map((n) => {
      const { etiqueta, division, clave, titulo } = partirNombreNivel(n.nombre);
      return {
        id: n._id,
        nombre: n.nombre,
        etiqueta,
        division,
        titulo,
        descripcion: DESCRIPCION_POR_DIVISION[clave] ?? DESCRIPCION_GENERICA,
        entrenador: n.entrenador ?? "",
        horarios: [...(n.horarios ?? [])]
          .sort((x, y) => ORDEN_DIAS.indexOf(x.dia) - ORDEN_DIAS.indexOf(y.dia) || x.horaInicio.localeCompare(y.horaInicio))
          .map((h) => ({ dia: h.dia, hora: rangoHoras(h.horaInicio, h.horaFin) })),
      };
    })
    .sort((a, b) => ordenNivel(a.nombre) - ordenNivel(b.nombre));
}
