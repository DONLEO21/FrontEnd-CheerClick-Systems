import { useEffect, useState } from 'react'
import {
  cargarUsuarios, obtenerDetalleUsuario, usuariosEnCache,
  aprobarSolicitud, rechazarSolicitud, cambiarRolUsuario, cambiarActivoUsuario, crearUsuarioAdmin,
} from '../../../services/adminUsuarios'
import { ACCIONES } from './cuentasData.js'

const leerVista = () => new URLSearchParams(window.location.search).get('vista') === 'gestion'

export default function useCuentas(mostrarAviso) {
  // Si ya hay datos en caché se muestran al instante y se refrescan en segundo plano
  const [usuarios, setUsuarios] = useState(() => usuariosEnCache() ?? [])
  const [cargando, setCargando] = useState(() => !usuariosEnCache())
  const [tab, setTab] = useState('pendiente')
  const [esGestion, setEsGestion] = useState(leerVista)
  const [detalle, setDetalle] = useState(null)
  const [perfilDetalle, setPerfilDetalle] = useState(null)
  const [registroDetalle, setRegistroDetalle] = useState({ nivel: null, plan: null }) // nivel y plan del usuario
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [confirmar, setConfirmar] = useState(null) // { usuario, accion, rol? }
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [creando, setCreando] = useState(false)

  const cargar = async () => {
    try {
      setUsuarios(await cargarUsuarios())
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
  const abrirDetalle = async (u) => {
    setDetalle(u)
    setPerfilDetalle(null)
    setRegistroDetalle({ nivel: null, plan: null })
    setCargandoDetalle(true)
    try {
      const { perfil, registro } = await obtenerDetalleUsuario(u.id)
      setRegistroDetalle(registro)
      // El perfil solo se muestra en cuentas aprobadas (null si nunca editó su perfil)
      setPerfilDetalle(u.estado === 'aprobada' ? perfil : null)
    } catch (e) {
      mostrarAviso(e.message, 'error')
    } finally {
      setCargandoDetalle(false)
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
      if (e.key === 'Escape') { setDetalle(null); setConfirmar(null); setCrearAbierto(false) }
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
    detalle, setDetalle, perfilDetalle, registroDetalle, cargandoDetalle, abrirDetalle, cerrarDetalle,
    confirmar, pedirConfirmacion, cancelarConfirmacion, ejecutar,
    crearAbierto, creando, abrirCrear, cerrarCrear, crearUsuario,
  }
}