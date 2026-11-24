import { useEffect, useRef, useState } from 'react'
import {
  cargarUsuarios, obtenerDetalleUsuario, usuariosEnCache,
  aprobarSolicitud, rechazarSolicitud, cambiarRolUsuario, cambiarActivoUsuario, crearUsuarioAdmin,
  guardarFichaUsuario, reasignarNivelUsuario, reasignarPlanUsuario, cambiarRolEntrenadorUsuario,
} from '../../../services/adminUsuarios'
import { listarNivelesOpciones, listarPlanesOpciones } from '../../../services/catalogos'
import { ACCIONES } from './cuentasData.js'
import { almacenSesion } from '../../../api/client'
import { renovarSesion } from '../../../services/sesion'

const leerVista = () => new URLSearchParams(window.location.search).get('vista') === 'gestion'

export default function useCuentas(mostrarAviso) {
  // Si ya hay datos en caché se muestran al instante y se refrescan en segundo plano
  // Esta pantalla incluye a los administradores (Gestión de cuentas los edita); las solicitudes los excluyen al pintar
  const [usuarios, setUsuarios] = useState(() => usuariosEnCache() ?? [])
  const [cargando, setCargando] = useState(() => !usuariosEnCache())
  const [tab, setTab] = useState('pendiente')
  const [esGestion, setEsGestion] = useState(leerVista)
  const [detalle, setDetalle] = useState(null)
  const [perfilDetalle, setPerfilDetalle] = useState(null)
  const [registroDetalle, setRegistroDetalle] = useState({ nivel: null, plan: null }) // nivel y plan del usuario
  const [fichaDetalle, setFichaDetalle] = useState(null) // detalle tal cual del backend (lo usa el formulario de edición)
  const [catalogos, setCatalogos] = useState({ niveles: [], planes: [] })
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [confirmar, setConfirmar] = useState(null) // { usuario, accion, rol? }
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [creando, setCreando] = useState(false)

  const cargar = async () => {
    try {
      setUsuarios(await cargarUsuarios({ conAdministradores: true }))
    } catch (e) {
      mostrarAviso(e.message, 'error')
    } finally {
      setCargando(false)
    }
  }
  useEffect(() => { cargar() }, [])

  /* ── vista (solicitudes / gestión) sincronizada con la URL ── */
  useEffect(() => {
    const onPop = () => setEsGestion(leerVista())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const alternarVista = () => {
    if (!esGestion) {
      window.history.pushState({ vista: 'gestion' }, '', `${window.location.pathname}?vista=gestion`)
      setEsGestion(true)
    } else if (window.history.state?.vista === 'gestion') {
      window.history.back()
    } else {
      window.history.replaceState({}, '', window.location.pathname)
      setEsGestion(false)
    }
  }

  /* ── detalle ── */
  const peticionDetalle = useRef(0) // descarta la respuesta de un detalle viejo si se abrió otro mientras cargaba
  const abrirDetalle = async (u) => {
    const mia = ++peticionDetalle.current
    setDetalle(u)
    setPerfilDetalle(null)
    setRegistroDetalle({ nivel: null, plan: null })
    setFichaDetalle(null)
    setCargandoDetalle(true)
    // Niveles y planes ACTIVOS reales (para reasignar); se piden una vez al abrir el primer detalle
    if (catalogos.niveles.length === 0 || catalogos.planes.length === 0) {
      Promise.all([listarNivelesOpciones(), listarPlanesOpciones()])
        .then(([niveles, planes]) => setCatalogos({ niveles, planes }))
        .catch(() => { /* sin catálogos no se puede reasignar, pero el detalle se sigue viendo */ })
    }
    try {
      const { perfil, registro, ficha } = await obtenerDetalleUsuario(u.id)
      if (mia !== peticionDetalle.current) return
      setRegistroDetalle(registro)
      setFichaDetalle(ficha)
      // El perfil solo se muestra en cuentas aprobadas (null si nunca editó su perfil)
      setPerfilDetalle(u.estado === 'aprobada' ? perfil : null)
    } catch (e) {
      if (mia === peticionDetalle.current) mostrarAviso(e.message, 'error')
    } finally {
      if (mia === peticionDetalle.current) setCargandoDetalle(false)
    }
  }
  const cerrarDetalle = () => setDetalle(null)

  // Abre el detalle de ?ver=<id> (viene del dashboard)
  useEffect(() => {
    if (cargando) return
    const id = new URLSearchParams(window.location.search).get('ver')
    if (!id) return
    const u = usuarios.find((x) => x.id === id)
    if (u) { setTab(u.estado); abrirDetalle(u) }
    window.history.replaceState({}, '', window.location.pathname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando, usuarios])

  useEffect(() => {
    const onKey = (e) => {
      // El detalle maneja su propio Escape (pide confirmación si hay cambios sin guardar)
      if (e.key === 'Escape') { setConfirmar(null); setCrearAbierto(false) }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  /* ── confirmación y ejecución de acciones ── */
  const pedirConfirmacion = (usuario, accion, extra = {}) => setConfirmar({ usuario, accion, ...extra })
  const cancelarConfirmacion = () => setConfirmar(null)

  const ejecutar = async () => {
    const { usuario, accion, rol } = confirmar
    try {
      if (accion === 'aprobar') {
        await aprobarSolicitud(usuario.id, rol ?? usuario.rol)
      } else if (accion === 'rechazar') {
        await rechazarSolicitud(usuario.id)
      } else if (accion === 'cambiar-rol') {
        await cambiarRolUsuario(usuario.id, rol)
      } else {
        await cambiarActivoUsuario(usuario.id, accion === 'activar')
      }
      setConfirmar(null)
      mostrarAviso(ACCIONES[accion].exito, ACCIONES[accion].tipo)
      cargar()
    } catch (e) {
      setConfirmar(null)
      mostrarAviso(e.message, 'error')
    }
  }

  /* ── edición de cuentas: cada acción habla con el backend y refresca tabla y modal sin recargar la página ── */
  const refrescarTrasCambio = async (id) => {
    const [filas, det] = await Promise.all([cargarUsuarios({ conAdministradores: true }), obtenerDetalleUsuario(id)])
    setUsuarios(filas)
    setDetalle((actual) => (actual?.id === id ? (filas.find((f) => f.id === id) ?? actual) : actual))
    setRegistroDetalle(det.registro)
    setFichaDetalle(det.ficha)
    setPerfilDetalle(det.perfil)
  }

  // Los errores del backend se relanzan: el modal los muestra dentro de sí mismo
  const guardarFicha = async (cuerpo) => {
    const r = await guardarFichaUsuario(detalle.id, cuerpo)
    await refrescarTrasCambio(detalle.id)
    mostrarAviso(r.msg || 'Datos actualizados', 'ok')
  }
  const reasignarNivel = async (nivelId) => {
    await reasignarNivelUsuario(detalle.id, nivelId)
    await refrescarTrasCambio(detalle.id)
    mostrarAviso('Nivel reasignado. Se avisó al atleta y a los entrenadores de ambos niveles.', 'ok')
  }
  const reasignarPlan = async (planId) => {
    const r = await reasignarPlanUsuario(detalle.id, planId)
    await refrescarTrasCambio(detalle.id)
    const accion = r.mensualidad?.accion
    mostrarAviso(
      accion === 'actualizada' ? 'Plan reasignado: se actualizó la mensualidad pendiente de este mes.'
        : accion === 'creada' ? 'Plan reasignado: se generó la mensualidad de este mes.'
          : accion === 'siguiente-periodo' ? 'Plan reasignado: el plan nuevo rige desde la mensualidad del mes siguiente.'
            : 'Plan reasignado.',
      'ok',
    )
  }
  const cambiarEntrenador = async (activo) => {
    const r = await cambiarRolEntrenadorUsuario(detalle.id, activo)
    await refrescarTrasCambio(detalle.id)
    // Si el administrador se cambió a sí mismo, su sesión se renueva para que el selector de rol del encabezado se actualice
    // sin cerrar sesión (los permisos reales siempre salen de la base de datos)
    if (String(almacenSesion.usuario()?.id) === String(detalle.id)) await renovarSesion().catch(() => {})
    const texto = activo ? 'Ahora también actúa como entrenador.' : 'Ya no actúa como entrenador.'
    // Dato antiguo inválido (p. ej. fecha de nacimiento futura): no impide el cambio, pero se avisa para corregirlo
    if (r?.aviso) mostrarAviso(`${texto} ${r.aviso}`, 'advertencia')
    else mostrarAviso(texto, 'ok')
  }

  /* ── crear usuario por admin*/
  const abrirCrear = () => setCrearAbierto(true)
  const cerrarCrear = () => setCrearAbierto(false)

  const crearUsuario = async (datos) => {
    setCreando(true)
    try {
      await crearUsuarioAdmin(datos)
      setCrearAbierto(false)
      mostrarAviso(ACCIONES['crear-usuario'].exito, ACCIONES['crear-usuario'].tipo)
      cargar()
    } finally {
      setCreando(false)
    }
  }

  return {
    usuarios, cargando, tab, setTab, esGestion, alternarVista,
    detalle, setDetalle, perfilDetalle, registroDetalle, fichaDetalle, catalogos, cargandoDetalle, abrirDetalle, cerrarDetalle,
    guardarFicha, reasignarNivel, reasignarPlan, cambiarEntrenador,
    confirmar, pedirConfirmacion, cancelarConfirmacion, ejecutar,
    crearAbierto, creando, abrirCrear, cerrarCrear, crearUsuario,
  }
}