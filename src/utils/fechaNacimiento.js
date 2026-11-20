// Validación de la fecha de nacimiento según el rol.
// Regla de negocio: administrador y entrenador deben ser mayores de edad (≥ 18);
// el atleta debe tener al menos 5 años.

export const EDAD_MINIMA = { admin: 18, administrador: 18, entrenador: 18, atleta: 5 };
const EDAD_MAXIMA = 100;

const aISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Edad cumplida a la fecha de hoy a partir de 'AAAA-MM-DD' (null si no es una fecha válida). */
export function calcularEdad(valor, hoy = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor ?? '');
  if (!m) return null;
  const [anio, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return null;
  let edad = hoy.getFullYear() - anio;
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) edad -= 1;
  return edad;
}

/** Fecha más reciente permitida (para el atributo max del input date). */
export function fechaMaximaPermitida(rol, hoy = new Date()) {
  const minima = EDAD_MINIMA[rol] ?? 0;
  return aISO(new Date(hoy.getFullYear() - minima, hoy.getMonth(), hoy.getDate()));
}

/** Devuelve el mensaje de error, o '' si la fecha es válida (o está vacía). */
export function validarFechaNacimiento(valor, rol) {
  if (!valor) return '';
  const edad = calcularEdad(valor);
  if (edad === null) return 'La fecha de nacimiento no es válida.';
  if (edad < 0) return 'La fecha de nacimiento no puede ser futura.';
  if (edad > EDAD_MAXIMA) return 'La fecha de nacimiento no es válida.';
  const minima = EDAD_MINIMA[rol];
  if (minima && edad < minima) {
    return rol === 'atleta'
      ? `El atleta debe tener al menos ${minima} años.`
      : `El ${rol === 'entrenador' ? 'entrenador' : 'administrador'} debe ser mayor de edad (mínimo ${minima} años).`;
  }
  return '';
}
