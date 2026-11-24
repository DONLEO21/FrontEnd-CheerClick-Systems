import { useEffect, useRef, useState } from 'react'
import { FileText, Eye, Download, Loader2 } from 'lucide-react'
import { obtenerCertificadoEps } from '../../../services/adminUsuarios'

/**
 * Fila «Certificado de EPS»: icono + nombre del archivo + «Ver» + «Descargar».
 * El archivo es PRIVADO: se pide al backend con el token (apiClient, Blob) solo cuando se pulsa un botón, nunca por adelantado.
 * Las URLs de objeto se revocan al terminar (descarga) o al cerrar el modal / pasados 2 minutos (pestaña de «Ver»).
 */
export default function FilaCertificado({ usuarioId, codigo, apellido, tieneCertificado }) {
  const [cargando, setCargando] = useState(null) // 'ver' | 'descargar' | null
  const [error, setError] = useState('')
  const urls = useRef(new Set())
  const montado = useRef(true)

  useEffect(() => {
    montado.current = true
    const guardadas = urls.current
    return () => {
      montado.current = false
      guardadas.forEach((u) => URL.revokeObjectURL(u))
      guardadas.clear()
    }
  }, [])

  const nombreMostrado = `certificado-eps-${[codigo, apellido].filter((x) => x && x !== '—').join('-').toLowerCase().replace(/\s+/g, '-')}`

  const pedir = async (accion) => {
    setError('')
    setCargando(accion)
    // La pestaña se abre ya (con el clic del usuario) para que el navegador no la bloquee tras el await
    const pestana = accion === 'ver' ? window.open('', '_blank') : null
    try {
      const { blob, nombreArchivo } = await obtenerCertificadoEps(usuarioId, { codigo, apellido })
      const url = URL.createObjectURL(blob)
      urls.current.add(url)
      const liberar = (ms) => setTimeout(() => { URL.revokeObjectURL(url); urls.current.delete(url) }, ms)

      if (accion === 'ver') {
        if (pestana) pestana.location.href = url
        else window.open(url, '_blank')
        liberar(120000)
      } else {
        const a = document.createElement('a')
        a.href = url
        a.download = nombreArchivo
        document.body.appendChild(a)
        a.click()
        a.remove()
        liberar(1000)
      }
    } catch (e) {
      pestana?.close()
      if (montado.current) setError(e?.message || 'No se pudo obtener el certificado.')
    } finally {
      if (montado.current) setCargando(null)
    }
  }

  if (!tieneCertificado) {
    return (
      <div className="detalle-grupo detalle-grupo--full">
        <label>Certificado de EPS</label>
        <div className="detalle-valor detalle-valor--archivo">
          <FileText size={14} strokeWidth={2} />
          <span>Sin certificado cargado</span>
        </div>
      </div>
    )
  }

  return (
    <div className="detalle-grupo detalle-grupo--full">
      <label>Certificado de EPS</label>
      <div className="fila-certificado">
        <span className="fila-certificado__nombre" title={nombreMostrado}>
          <FileText size={15} strokeWidth={2} aria-hidden="true" />
          <span>{nombreMostrado}</span>
        </span>
        <div className="fila-certificado__acciones">
          <button type="button" className="btn-certificado" onClick={() => pedir('ver')} disabled={!!cargando}>
            {cargando === 'ver' ? <Loader2 size={14} className="icono-girando" /> : <Eye size={14} strokeWidth={2} />}
            {cargando === 'ver' ? 'Abriendo…' : 'Ver'}
          </button>
          <button type="button" className="btn-certificado" onClick={() => pedir('descargar')} disabled={!!cargando}>
            {cargando === 'descargar' ? <Loader2 size={14} className="icono-girando" /> : <Download size={14} strokeWidth={2} />}
            {cargando === 'descargar' ? 'Descargando…' : 'Descargar'}
          </button>
        </div>
      </div>
      {error && <p className="campo-error" role="alert">{error}</p>}
    </div>
  )
}
