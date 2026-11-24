import Avatar from "./Avatar";

/**
 * Compatibilidad: <FotoPersona src nombre className alt /> es el mismo <Avatar> (foto o dos iniciales).
 * El código nuevo debe usar <Avatar> directamente; `nombre` aquí es un nombre completo en un solo texto.
 */
export default function FotoPersona({ src, nombre, className = "", alt }) {
  return <Avatar foto={src} nombre={nombre} className={className} alt={alt} />;
}
