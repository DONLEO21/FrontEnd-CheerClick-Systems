import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X, User, Mail, Phone, FileText, Hash, Users, CalendarDays, HeartPulse, Pencil,
  Dumbbell, Wallet, ShieldCheck, Loader2,
} from 'lucide-react'
import ModalConfirmar from '../../../components/Compartidos/ModalConfirmar'
import CampoIcono from './CampoIcono.jsx'
import FilaCertificado from './FilaCertificado.jsx'
import {
  NOMBRE_ROL, ROLES, NOMBRE_GENERO, NOMBRE_TIPO_DOC, NOMBRE_EPS, val, fechaVal, parentescoLegible,
} from './cuentasData.js'
import {
  OPCIONES_TIPO_DOC, OPCIONES_GENERO, OPCIONES_EPS, OPCIONES_PARENTESCO,
  borradorDesdeFicha, hayCambios, validarBorrador, cuerpoDeCambios, erroresDeApi,
} from './edicionCuenta.js'
import { fechaMaximaPermitida } from '../../../utils/fechaNacimiento.js'

/* ───────── vista de solo lectura ───────── */
function Campo({ etiqueta, children, completo }) {
  return (
    <div className={`detalle-grupo ${completo ? 'detalle-grupo--full' : ''}`}>
      <label>{etiqueta}</label>
      <div className="detalle-valor">{children}</div>
    </div>
  )
}

function SeccionPerfil({ perfil, detalle }) {
  const contactos = Array.isArray(perfil.contactos) ? perfil.contactos : []

  return (
    <>
      <div className="detalle-titulo-seccion">
        <User size={14} strokeWidth={2} />
        Información del perfil
      </div>
      <div className="detalle-grid">
        <Campo etiqueta="Tipo de documento">{val(NOMBRE_TIPO_DOC[perfil.tipo_documento])}</Campo>
        <Campo etiqueta="Número de documento">{val(perfil.numero_documento)}</Campo>
        <Campo etiqueta="Género">{val(NOMBRE_GENERO[perfil.genero])}</Campo>
        <Campo etiqueta="Fecha de nacimiento">{fechaVal(perfil.fecha_nacimiento)}</Campo>
        <Campo etiqueta="Teléfono">{val(perfil.telefono)}</Campo>
        <Campo etiqueta="EPS">{val(NOMBRE_EPS[perfil.eps] ?? perfil.eps)}</Campo>
        <FilaCertificado
          usuarioId={detalle.id}
          codigo={detalle.codigo}
          apellido={detalle.apellido}
          tieneCertificado={perfil.tiene_certificado_eps}
        />
      </div>

      {contactos.length > 0 && (
        <>
          <div className="detalle-titulo-seccion">Contactos de emergencia</div>
          {contactos.map((c, i) => (
            <div key={i} className="detalle-contacto-bloque">
              <p className="detalle-contacto-nombre">Contacto {i + 1}</p>
              <div className="detalle-grid">
                <Campo etiqueta="Nombre">{val(c.nombre)}</Campo>
                <Campo etiqueta="Apellido">{val(c.apellido)}</Campo>
                <Campo etiqueta="Teléfono">{val(c.telefono)}</Campo>
                {c.parentesco && <Campo etiqueta="Parentesco">{parentescoLegible(c.parentesco)}</Campo>}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  )
}

/* ───────── formulario de edición ───────── */
function FormularioEdicion({ borrador, cambiar, cambiarContacto, errores, rol, ficha, detalle }) {
  const e = errores
  return (
    <>
      <div className="detalle-titulo-seccion detalle-titulo-seccion--inicio">
        <User size={14} strokeWidth={2} />
        Datos de la cuenta
      </div>
      <div className="detalle-grid">
        <CampoIcono etiqueta="Nombre" icono={User} valor={borrador.nombre} onChange={cambiar('nombre')} error={e.nombre} maxLength={60} />
        <CampoIcono etiqueta="Apellido" icono={User} valor={borrador.apellido} onChange={cambiar('apellido')} error={e.apellido} maxLength={60} />
        <CampoIcono etiqueta="Correo electrónico" icono={Mail} tipo="email" completo valor={borrador.email} onChange={cambiar('email')} error={e.email} />
      </div>

      {borrador.tienePerfil ? (
        <>
          <div className="detalle-titulo-seccion">
            <FileText size={14} strokeWidth={2} />
            Información del perfil
          </div>
          <div className="detalle-grid">
            <CampoIcono etiqueta="Tipo de documento" icono={FileText} opciones={OPCIONES_TIPO_DOC} valor={borrador.tipoDocumento} onChange={cambiar('tipoDocumento')} error={e.tipoDocumento} />
            <CampoIcono etiqueta="Número de documento" icono={Hash} valor={borrador.numDocumento} onChange={cambiar('numDocumento')} error={e.numDocumento} maxLength={20} />
            <CampoIcono etiqueta="Género" icono={Users} opciones={OPCIONES_GENERO} valor={borrador.genero} onChange={cambiar('genero')} error={e.genero} />
            {borrador.genero === 'Otro'
              ? <CampoIcono etiqueta="¿Cuál?" icono={Users} valor={borrador.generoOtro} onChange={cambiar('generoOtro')} error={e.generoOtro} maxLength={40} />
              : <div aria-hidden="true" />}
            <CampoIcono etiqueta="Fecha de nacimiento" icono={CalendarDays} tipo="date" max={fechaMaximaPermitida(rol)} valor={borrador.fechaNacimiento} onChange={cambiar('fechaNacimiento')} error={e.fechaNacimiento} />
            <CampoIcono etiqueta="Teléfono" icono={Phone} tipo="tel" valor={borrador.telefono} onChange={cambiar('telefono')} error={e.telefono} maxLength={20} />
            <CampoIcono etiqueta="EPS" icono={HeartPulse} opciones={OPCIONES_EPS} valor={borrador.eps} onChange={cambiar('eps')} error={e.eps} />
            {borrador.eps === 'Otra'
              ? <CampoIcono etiqueta="¿Cuál EPS?" icono={HeartPulse} valor={borrador.epsOtra} onChange={cambiar('epsOtra')} error={e.epsOtra} maxLength={60} />
              : <div aria-hidden="true" />}
            <FilaCertificado
              usuarioId={detalle.id}
              codigo={detalle.codigo}
              apellido={detalle.apellido}
              tieneCertificado={!!ficha?.perfil?.tieneCertificadoEps}
            />
          </div>

          {borrador.contactos.length > 0 && <div className="detalle-titulo-seccion">Contactos de emergencia</div>}
          {borrador.contactos.map((c, i) => (
            <div key={c._id ?? i} className="detalle-contacto-bloque">
              <p className="detalle-contacto-nombre">Contacto {i + 1}</p>
              <div className="detalle-grid">
                <CampoIcono etiqueta="Nombre" icono={User} valor={c.nombre} onChange={cambiarContacto(i, 'nombre')} error={e[`contactos.${i}.nombre`]} maxLength={60} />
                <CampoIcono etiqueta="Apellido" icono={User} valor={c.apellido} onChange={cambiarContacto(i, 'apellido')} error={e[`contactos.${i}.apellido`]} maxLength={60} />
                <CampoIcono etiqueta="Teléfono" icono={Phone} tipo="tel" valor={c.telefono} onChange={cambiarContacto(i, 'telefono')} error={e[`contactos.${i}.telefono`]} maxLength={20} />
                <CampoIcono etiqueta="Parentesco" icono={Users} opciones={OPCIONES_PARENTESCO} valor={c.parentesco} onChange={cambiarContacto(i, 'parentesco')} error={e[`contactos.${i}.parentesco`]} />
                {c.parentesco === 'Otro' && (
                  <CampoIcono etiqueta="¿Cuál parentesco?" icono={Users} completo valor={c.parentescoOtro} onChange={cambiarContacto(i, 'parentescoOtro')} error={e[`contactos.${i}.parentescoOtro`]} maxLength={40} />
                )}
              </div>
            </div>
          ))}
        </>
      ) : (
        <p className="perfil-modal-descripcion">
          Este usuario aún no completó su perfil: por ahora solo se pueden editar su nombre, apellido y correo.
        </p>
      )}
    </>
  )
}

// Si el nivel o plan actual ya está inactivo no aparece en el catálogo: se agrega para que el selector muestre el valor real
const conActual = (lista, id, nombre) => (id && !lista.some(([v]) => v === id) ? [[id, nombre ?? 'Actual (inactivo)'], ...lista] : lista)

/* ───────── modal ───────── */
export default function ModalDetalle({
  detalle, perfil, registro, ficha, cargandoPerfil, niveles = [], planes = [], puedeEditar = false,
  onCerrar, onAccion, onGuardar, onReasignarNivel, onReasignarPlan, onCambiarEntrenador,
}) {
  const [modo, setModo] = useState('ver') // 'ver' | 'editar'
  const [borrador, setBorrador] = useState(null)
  const [inicial, setInicial] = useState(null)
  const [errores, setErrores] = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [sinCambios, setSinCambios] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [descartar, setDescartar] = useState(null)   // 'cerrar' | 'volver' | null
  const [cambio, setCambio] = useState(null)         // { tipo: 'nivel'|'plan'|'entrenador', ... } pendiente de confirmar
  const [aplicando, setAplicando] = useState(false)
  const [errorCambio, setErrorCambio] = useState('')
  const cuerpoRef = useRef(null)

  const editando = modo === 'editar'
  const sucio = editando && borrador && inicial && hayCambios(inicial, borrador)
  const esAtleta = detalle.rol === 'atleta'
  const esAdminTarget = detalle.rol === 'administrador'
  const aprobada = detalle.estado === 'aprobada'
  const tambienEntrenador = !!ficha?.usuario?.rolesAdicionales?.includes('Entrenador')

  // Se pide cerrar: si hay cambios sin guardar, primero se confirma
  const pedirCierre = () => (sucio ? setDescartar('cerrar') : onCerrar())
  const alRef = useRef(pedirCierre)
  useEffect(() => { alRef.current = pedirCierre })

  // Escape: cierra (con confirmación si hay cambios). Los diálogos de confirmación manejan su propio Escape.
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key !== 'Escape' || document.querySelector('dialog[open]')) return
      alRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // El fondo de la página no se desplaza mientras el modal está abierto
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previo }
  }, [])

  const entrarEdicion = () => {
    const b = borradorDesdeFicha(ficha)
    setBorrador(b)
    setInicial(b)
    setErrores({})
    setErrorGeneral('')
    setSinCambios(false)
    setModo('editar')
    cuerpoRef.current?.scrollTo?.({ top: 0 })
  }

  const salirEdicion = () => {
    setModo('ver')
    setBorrador(null)
    setInicial(null)
    setErrores({})
    setErrorGeneral('')
  }

  const cancelarEdicion = () => (sucio ? setDescartar('volver') : salirEdicion())

  const cambiar = (campo) => (ev) => {
    const valor = ev.target.value
    setBorrador((b) => ({ ...b, [campo]: valor }))
    setErrores((x) => (x[campo] ? { ...x, [campo]: undefined } : x))
  }
  const cambiarContacto = (i, campo) => (ev) => {
    const valor = ev.target.value
    setBorrador((b) => ({ ...b, contactos: b.contactos.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)) }))
    setErrores((x) => (x[`contactos.${i}.${campo}`] ? { ...x, [`contactos.${i}.${campo}`]: undefined } : x))
  }

  // Resumen arriba («Hay N campos por corregir») y scroll al primer campo con error, aunque el formulario esté desplazado
  const mostrarErrores = (mapa, mensajeBackend) => {
    const n = Object.values(mapa).filter(Boolean).length
    setErrores(mapa)
    setErrorGeneral(n > 0 ? (n === 1 ? 'Hay 1 campo por corregir.' : `Hay ${n} campos por corregir.`) : (mensajeBackend || 'No se pudieron guardar los cambios.'))
    setTimeout(() => {
      const primero = cuerpoRef.current?.querySelector('[aria-invalid="true"]')
      if (primero) { primero.scrollIntoView({ block: 'center', behavior: 'smooth' }); primero.focus({ preventScroll: true }) }
      else cuerpoRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
    }, 60)
  }

  const guardar = async () => {
    setErrorGeneral('')
    setSinCambios(false)
    // El botón nunca queda deshabilitado en silencio: sin cambios se avisa
    if (!sucio) { setSinCambios(true); cuerpoRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' }); return }
    const e = validarBorrador(borrador, detalle.rol, inicial)
    if (Object.keys(e).length > 0) return mostrarErrores(e)
    setGuardando(true)
    try {
      await onGuardar(cuerpoDeCambios(inicial, borrador))
      salirEdicion()
    } catch (err) {
      // El backend manda su propio motivo (correo repetido, documento repetido, edad…): se muestra aquí mismo, en el modal
      const mapa = erroresDeApi(err)
      mostrarErrores(mapa, err?.message)
      if (Object.keys(mapa).length > 0 && err?.message && err.status === 409) setErrorGeneral(err.message)
    } finally {
      setGuardando(false)
    }
  }

  /* ── nivel / plan / rol adicional: se confirman y se aplican en el momento (no dependen del botón «Guardar cambios») ── */
  const nombreDe = (lista, id) => lista.find(([v]) => v === id)?.[1] ?? '—'
  const pedirCambio = (tipo, nuevoId) => {
    setErrorCambio('')
    if (tipo === 'nivel') setCambio({ tipo, nuevoId, actual: registro?.nivel ?? 'Sin nivel', nuevo: nombreDe(niveles, nuevoId) })
    if (tipo === 'plan') setCambio({ tipo, nuevoId, actual: registro?.plan ?? 'Sin plan', nuevo: nombreDe(planes, nuevoId) })
  }
  const pedirCambioEntrenador = (activo) => { setErrorCambio(''); setCambio({ tipo: 'entrenador', activo }) }

  const aplicarCambio = async () => {
    setAplicando(true)
    setErrorCambio('')
    try {
      if (cambio.tipo === 'nivel') await onReasignarNivel(cambio.nuevoId)
      else if (cambio.tipo === 'plan') await onReasignarPlan(cambio.nuevoId)
      else await onCambiarEntrenador(cambio.activo)
      setCambio(null)
    } catch (err) {
      setErrorCambio(err?.message || 'No se pudo aplicar el cambio.')
    } finally {
      setAplicando(false)
    }
  }

  const idNivelActual = useMemo(() => {
    const n = ficha?.usuario?.nivel
    return typeof n === 'object' ? n?._id : n
  }, [ficha])
  const idPlanActual = useMemo(() => {
    const p = ficha?.usuario?.planAsociado
    return typeof p === 'object' ? p?._id : p
  }, [ficha])

  const mensajeCambio = () => {
    if (!cambio) return ''
    if (cambio.tipo === 'nivel') return `${detalle.nombre} pasará de ${cambio.actual} a ${cambio.nuevo}. Su historial (asistencia, rendimiento y justificaciones) se conserva con el nivel anterior. Se avisará al atleta y a los entrenadores de ambos niveles.`
    if (cambio.tipo === 'plan') return `${detalle.nombre} pasará del plan ${cambio.actual} al plan ${cambio.nuevo}. Si su mensualidad de este mes sigue pendiente sin enviar, se actualiza el valor; si ya está pagada o en verificación, el plan nuevo rige desde el mes siguiente.`
    return cambio.activo
      ? `${detalle.nombre} podrá actuar también como entrenador: aparecerá como opción al asignar entrenadores a un nivel y tendrá la vista de entrenador.`
      : `${detalle.nombre} dejará de actuar como entrenador. Si tiene niveles a cargo, deberás reasignarlos antes.`
  }
  const tituloCambio = () => {
    if (!cambio) return ''
    if (cambio.tipo === 'nivel') return `Nivel: ${cambio.actual} → ${cambio.nuevo}`
    if (cambio.tipo === 'plan') return `Plan: ${cambio.actual} → ${cambio.nuevo}`
    return cambio.activo ? '¿Activar rol de entrenador?' : '¿Quitar rol de entrenador?'
  }

  return createPortal(
    // .adm-cuentas: los estilos de este módulo están acotados a esa clase; el portal saca el modal del contenedor animado
    // de la página (un ancestro con transform lo descentraba y lo cortaba) y lo deja centrado sobre toda la ventana.
    <div className="adm-cuentas">
      <div className="modal-overlay modal-overlay--scroll" onMouseDown={(ev) => { if (ev.target === ev.currentTarget) pedirCierre() }}>
        <div className={`modal-dialogo modal--detalles ${editando ? 'modal--editando' : ''}`} role="dialog" aria-modal="true" aria-labelledby="detalle-titulo">
          <div className="modal-cabeza">
            <h2 className="modal-cabeza__titulo" id="detalle-titulo">
              {editando ? 'Editar cuenta' : aprobada ? 'Detalles de la cuenta' : 'Detalles de la solicitud'}
            </h2>
            <button className="modal-cerrar" onClick={pedirCierre} aria-label="Cerrar"><X size={20} strokeWidth={2.5} /></button>
          </div>

          <div className="modal-cuerpo modal-cuerpo--scroll" ref={cuerpoRef}>
            {editando && borrador ? (
              <>
                {/* Arriba, para que se vea aunque el formulario esté desplazado */}
                {errorGeneral && <div className="alerta-modal" role="alert">{errorGeneral}</div>}
                {sinCambios && <div className="alerta-modal alerta-modal--info" role="status">No hay cambios por guardar.</div>}
                <FormularioEdicion
                  borrador={borrador} cambiar={cambiar} cambiarContacto={cambiarContacto}
                  errores={errores} rol={detalle.rol} ficha={ficha} detalle={detalle}
                />
              </>
            ) : (
              <>
                <div className="detalle-titulo-seccion detalle-titulo-seccion--inicio">
                  <User size={14} strokeWidth={2} />
                  Datos del registro
                </div>
                <div className="detalle-grid">
                  <div className="detalle-grupo">
                    <label htmlFor="detalle-rol">Rol</label>
                    <div className="detalle-rol">
                      {/* Pendiente: select (selección local, se guarda al aprobar).
                          Aprobada/rechazada: solo insignia; el cambio de rol se hace en Gestión de cuentas. */}
                      {detalle.estado === 'pendiente' ? (
                        <select
                          id="detalle-rol"
                          className={`select-rol-modal select-rol-modal--${detalle.rol}`}
                          value={detalle.rol}
                          onChange={(ev) => onAccion(detalle, 'cambiar-rol', { rol: ev.target.value })}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
                        </select>
                      ) : (
                        <span className={`insignia-rol insignia-rol--tabla insignia-rol--${detalle.rol}`}>
                          {NOMBRE_ROL[detalle.rol]}
                        </span>
                      )}
                      {tambienEntrenador && <span className="insignia-rol insignia-rol--tabla insignia-rol--entrenador" title="También actúa como entrenador">+ Entrenador</span>}
                    </div>
                  </div>
                  <Campo etiqueta="Nombre">{val(detalle.primerNombre ?? detalle.nombre)}</Campo>
                  {detalle.apellido && <Campo etiqueta="Apellido">{val(detalle.apellido)}</Campo>}
                  <Campo etiqueta="Correo electrónico" completo>{val(detalle.email)}</Campo>
                  {!esAdminTarget && <Campo etiqueta="Nivel">{cargandoPerfil ? 'Cargando…' : val(registro?.nivel)}</Campo>}
                  {esAtleta && <Campo etiqueta="Plan asociado">{cargandoPerfil ? 'Cargando…' : val(registro?.plan)}</Campo>}
                </div>

                {/* el perfil solo existe para cuentas aprobadas */}
                {aprobada && (
                  <>
                    {cargandoPerfil && <p className="perfil-modal-descripcion">Cargando información del perfil…</p>}
                    {!cargandoPerfil && perfil && <SeccionPerfil perfil={perfil} detalle={detalle} />}
                    {!cargandoPerfil && !perfil && (
                      <p className="perfil-modal-descripcion">Este usuario aún no ha completado su perfil.</p>
                    )}
                  </>
                )}
              </>
            )}

            {/* Reasignaciones y rol adicional: solo el administrador, sobre cuentas aprobadas */}
            {puedeEditar && aprobada && !cargandoPerfil && ficha && (
              <>
                {(esAtleta || esAdminTarget) && (
                  <div className="detalle-titulo-seccion">
                    {esAtleta ? <Dumbbell size={14} strokeWidth={2} /> : <ShieldCheck size={14} strokeWidth={2} />}
                    {esAtleta ? 'Nivel y plan' : 'Rol adicional'}
                  </div>
                )}
                {esAtleta && (
                  <div className="detalle-grid">
                    <CampoIcono
                      etiqueta="Nivel" icono={Dumbbell} opciones={conActual(niveles, idNivelActual, registro?.nivel)} valor={idNivelActual ?? ''}
                      onChange={(ev) => ev.target.value !== idNivelActual && pedirCambio('nivel', ev.target.value)}
                    />
                    <CampoIcono
                      etiqueta="Plan asociado" icono={Wallet} opciones={conActual(planes, idPlanActual, registro?.plan)} valor={idPlanActual ?? ''}
                      onChange={(ev) => ev.target.value !== idPlanActual && pedirCambio('plan', ev.target.value)}
                    />
                  </div>
                )}
                {esAdminTarget && (
                  <label className="interruptor-fila">
                    <span className="interruptor-fila__texto">
                      <strong>También actúa como entrenador</strong>
                      <small>Podrá dirigir niveles y usar la vista de entrenador con el selector de rol del encabezado.</small>
                    </span>
                    <span className="toggle">
                      <input type="checkbox" checked={tambienEntrenador} onChange={(ev) => pedirCambioEntrenador(ev.target.checked)} />
                      <span className="toggle__pista" />
                    </span>
                  </label>
                )}
                {errorCambio && !cambio && <div className="alerta-modal" role="alert">{errorCambio}</div>}
              </>
            )}
          </div>

          {detalle.estado === 'pendiente' && (
            <div className="modal-pie">
              <button className="btn btn-primario" onClick={() => onAccion(detalle, 'rechazar')}>Rechazar</button>
              <button className="btn btn-verde" onClick={() => onAccion(detalle, 'aprobar')}>Aprobar</button>
            </div>
          )}
          {aprobada && puedeEditar && !editando && !cargandoPerfil && ficha && (
            <div className="modal-pie">
              <button className="btn btn-blanco" onClick={onCerrar}>Cerrar</button>
              <button className="btn btn-verde" onClick={entrarEdicion}>
                <Pencil size={15} strokeWidth={2.2} /> Editar
              </button>
            </div>
          )}
          {editando && (
            <div className="modal-pie">
              <button className="btn btn-blanco" onClick={cancelarEdicion} disabled={guardando}>Cancelar</button>
              <button className="btn btn-verde" onClick={guardar} disabled={guardando} aria-busy={guardando}>
                {guardando ? <><Loader2 size={15} className="icono-girando" /> Guardando…</> : 'Guardar cambios'}
              </button>
            </div>
          )}
        </div>
      </div>

      <ModalConfirmar
        abierto={!!descartar}
        titulo="¿Descartar los cambios?"
        mensaje="Tienes cambios sin guardar. Si sales ahora se perderán."
        tipo="peligro"
        textoConfirmar="Sí, descartar"
        textoCancelar="Seguir editando"
        onConfirmar={() => { const que = descartar; setDescartar(null); if (que === 'cerrar') onCerrar(); else salirEdicion() }}
        onCancelar={() => setDescartar(null)}
      />

      <ModalConfirmar
        abierto={!!cambio}
        titulo={tituloCambio()}
        mensaje={mensajeCambio()}
        tipo={cambio?.tipo === 'entrenador' && !cambio?.activo ? 'peligro' : 'ok'}
        textoConfirmar="Sí, confirmar"
        cargando={aplicando}
        error={errorCambio}
        onConfirmar={aplicarCambio}
        onCancelar={() => { setCambio(null); setErrorCambio('') }}
      />
    </div>,
    document.body,
  )
}
