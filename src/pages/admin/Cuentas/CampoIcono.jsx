import { useId } from 'react'

/**
 * Campo de formulario con el icono DENTRO del input (a la izquierda), etiqueta y mensaje de error propio.
 * Sirve para input (por defecto), select (`opciones`) y textarea (`area`, sin redimensionar).
 *
 *   <CampoIcono etiqueta="Teléfono" icono={Phone} valor={v} onChange={(e) => ...} error={errores.telefono} />
 *   <CampoIcono etiqueta="EPS" icono={HeartPulse} opciones={[['SURA', 'SURA'], …]} valor={v} onChange={…} />
 */
export default function CampoIcono({
  etiqueta, icono: Icono, valor, onChange, error, completo = false,
  opciones, area = false, tipo = 'text', ...resto
}) {
  const id = useId()
  const claseCampo = `campo campo--icono${error ? ' campo--error' : ''}${area ? ' campo--area' : ''}`
  const comunes = { id, className: claseCampo, value: valor ?? '', onChange, 'aria-invalid': !!error, 'aria-describedby': error ? `${id}-error` : undefined, ...resto }

  let control
  if (opciones) {
    // Si el valor guardado no está en la lista (p. ej. un parentesco antiguo «Madre / Padre») se agrega como opción marcada:
    // el select nunca salta a la primera opción ni cambia el dato sin que el administrador lo vea.
    const huerfano = valor && !opciones.some(([v]) => v === valor)
    control = (
      <select {...comunes}>
        <option value="" disabled hidden>Seleccionar…</option>
        {huerfano && <option value={valor}>{valor} (valor guardado, fuera de la lista)</option>}
        {opciones.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
    )
  } else if (area) {
    control = <textarea rows={3} {...comunes} />
  } else {
    control = <input type={tipo} {...comunes} />
  }

  return (
    <div className={`detalle-grupo ${completo ? 'detalle-grupo--full' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="campo-con-icono">
        {Icono && <Icono size={15} strokeWidth={2} className="campo-con-icono__icono" aria-hidden="true" />}
        {control}
      </div>
      {error && <p className="campo-error" id={`${id}-error`} role="alert">{error}</p>}
    </div>
  )
}
