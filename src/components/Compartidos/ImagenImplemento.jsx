import { useState } from "react";
import { getImageUrl } from "../../api/client";

// Placeholder neutro (SVG en línea, no depende de ningún archivo ni ruta del servidor)
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect width="24" height="24" fill="#f3f4f6" stroke="none"/><path d="M20.4 14.5 16 10 4 20"/><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.5"/></svg>'
  );

/**
 * <img> de un implemento con respaldo: resuelve rutas relativas del backend y, si la imagen falta o está rota, muestra
 * un placeholder en vez del texto alternativo. Acepta las mismas props que <img>.
 */
export default function ImagenImplemento({ src, alt = "", ...resto }) {
  const [fallo, setFallo] = useState(false);
  const url = !fallo && src ? getImageUrl(src) : PLACEHOLDER;
  return <img {...resto} src={url} alt={alt} onError={() => setFallo(true)} loading="lazy" />;
}
