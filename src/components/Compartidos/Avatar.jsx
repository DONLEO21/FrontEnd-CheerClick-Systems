import { useState } from "react";
import { getImageUrl } from "../../api/client";
import { colorAvatar, inicialesDe } from "../../utils/iniciales";

/**
 * Avatar ÚNICO del proyecto: la foto de la persona o, si no hay (o la imagen falla), un círculo con DOS iniciales.
 *
 *   <Avatar usuario={{ nombre, apellido, foto, codigo }} tamano={40} />
 *   <Avatar nombre="Leonardo" apellido="Jara Molina" foto={url} />
 *   <Avatar nombre="Leonardo Jara Molina" className="mi-clase-de-tamano" />   // un solo texto de nombre completo
 *
 * `claseIniciales` agrega clases solo al círculo de iniciales (no a la foto). `tamano` (px) fija ancho, alto y tipografía; sin él, el tamaño y el aro los define `className` de quien lo usa.
 * El color de fondo es estable por persona (código o id; si no, el nombre). Reglas de las iniciales: utils/iniciales.js.
 */
export default function Avatar({ usuario, nombre, apellido, foto, codigo, id, tamano, className = "", claseIniciales = "", alt, style }) {
  const nom = nombre ?? usuario?.nombre ?? "";
  const ape = apellido ?? usuario?.apellido ?? "";
  const src = getImageUrl(foto ?? usuario?.foto ?? usuario?.fotoUrl ?? "");
  const clave = codigo ?? usuario?.codigo ?? id ?? usuario?.id ?? usuario?._id ?? `${nom} ${ape}`;
  const etiqueta = alt ?? (`${nom} ${ape}`.trim() || "Sin nombre");

  // Se guarda la URL que falló (no un booleano): al cambiar `foto` se vuelve a intentar con la nueva
  const [fallida, setFallida] = useState(null);

  const medidas = tamano ? { width: tamano, height: tamano, fontSize: Math.max(10, Math.round(tamano * 0.38)) } : null;

  if (!src || fallida === src) {
    const { fondo, texto } = colorAvatar(clave);
    return (
      <span
        className={`foto-iniciales ui-avatar ${className} ${claseIniciales}`.replace(/\s+/g, " ").trim()}
        role="img"
        aria-label={etiqueta}
        style={{ backgroundColor: fondo, color: texto, ...medidas, ...style }}
      >
        {inicialesDe(nom, ape)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={etiqueta}
      className={`ui-avatar ${className}`.trim()}
      style={{ ...medidas, objectFit: "cover", ...(tamano ? { borderRadius: "50%" } : null), ...style }}
      onError={() => setFallida(src)}
    />
  );
}
