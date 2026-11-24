import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * Formulario que depende de datos asíncronos (el registro a editar + las listas de opciones): PRIMERO los datos, DESPUÉS el
 * formulario. Un solo patrón para todos:
 *
 *   const f = useFormularioAsincrono({
 *     clave: registro?.id,                                   // clave ESTABLE del registro: al cambiar, se recarga y se reinicia
 *     cargar: (signal) => Promise.all([getRegistro(id), getNiveles()]).then(([registro, niveles]) => ({ registro, niveles })),
 *     inicial: ({ registro }) => ({ nombre: registro.nombre, nivel: registro.nivelId }),   // valores definitivos, calculados UNA vez
 *   })
 *   <EstadoTarjeta cargando={f.cargando} error={f.error} onReintentar={f.reintentar}>   // skeleton / «Reintentar», sin formulario
 *     <input value={f.valores.nombre} onChange={(e) => f.cambiar('nombre', e.target.value)} />
 *     <button disabled={!f.listo || !f.hayCambios} onClick={() => guardar(f.diff)} />    // solo se envía lo modificado
 *   </EstadoTarjeta>
 *
 * Garantías:
 *  · Mientras no llegó TODO, `listo` es false y `valores` está vacío (el formulario no debe pintarse ni habilitar «Guardar»).
 *  · El formulario se inicializa UNA sola vez con los datos definitivos; un re-render, o que cambie una lista, NO pisa lo que el
 *    usuario ya escribió (las ediciones se guardan aparte y solo se descartan al cambiar `clave` o al recargar a propósito).
 *  · Se cancela al desmontar o al cambiar `clave` (AbortController: `cargar` recibe `signal`) y se descartan las respuestas
 *    viejas (condición de carrera al abrir otro registro).
 *  · `diff` contiene solo los campos que el usuario cambió respecto a los valores iniciales.
 *
 * `cargar` puede ser una función o devolver un arreglo/objeto de promesas ya resueltas con Promise.all. Si quieres tolerar
 * fallos parciales, usa Promise.allSettled dentro de `cargar` y devuelve lo que sí llegó.
 */
export default function useFormularioAsincrono({ clave, cargar, inicial, activo = true }) {
  const [intento, setIntento] = useState(0)
  // El resultado recuerda DE QUÉ carga es (clave + intento): si no coincide con la actual, está "cargando". Así no hace falta
  // reiniciar estado con setState dentro del efecto.
  const [resultado, setResultado] = useState({ clave: undefined, intento: -1, datos: null, error: '' })
  const [ediciones, setEdiciones] = useState({ datos: null, cambios: {} })

  useEffect(() => {
    if (!activo) return undefined
    const control = new AbortController()
    Promise.resolve()
      .then(() => cargar(control.signal))
      .then((datos) => { if (!control.signal.aborted) setResultado({ clave, intento, datos, error: '' }) })
      .catch((e) => {
        if (control.signal.aborted) return
        setResultado({ clave, intento, datos: null, error: e?.message || 'No se pudo cargar la información.' })
      })
    return () => control.abort()
    // `cargar` se vuelve a crear en cada render de quien lo usa: solo `clave`, `intento` y `activo` disparan la carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, intento, activo])

  const vigente = activo && resultado.clave === clave && resultado.intento === intento
  const datos = vigente ? resultado.datos : null
  const error = vigente ? resultado.error : ''
  const cargando = activo && !vigente
  const listo = vigente && !!datos && !error

  const valoresIniciales = useMemo(() => (datos ? inicial(datos) : null), [datos]) // eslint-disable-line react-hooks/exhaustive-deps
  const cambios = ediciones.datos === datos && datos ? ediciones.cambios : null
  const valores = useMemo(() => (valoresIniciales ? { ...valoresIniciales, ...cambios } : {}), [valoresIniciales, cambios])

  const cambiar = useCallback((campo, valor) => {
    if (!datos) return
    setEdiciones((prev) => ({ datos, cambios: { ...(prev.datos === datos ? prev.cambios : {}), [campo]: valor } }))
  }, [datos])

  const diff = useMemo(() => {
    if (!valoresIniciales) return {}
    return Object.fromEntries(Object.entries(valores).filter(([k, v]) => v !== valoresIniciales[k]))
  }, [valores, valoresIniciales])

  const reintentar = useCallback(() => setIntento((n) => n + 1), [])
  /** Descarta lo escrito y vuelve a los valores iniciales (sin volver a pedir los datos). */
  const descartar = useCallback(() => setEdiciones({ datos: null, cambios: {} }), [])

  return {
    cargando, error, listo, datos, valores, valoresIniciales, diff,
    hayCambios: Object.keys(diff).length > 0,
    cambiar, descartar, reintentar,
  }
}
