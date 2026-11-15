import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { ROLES, NOMBRE_ROL, fecha, paginar } from './cuentasData.js'

const BADGE_ROL = { atleta: 'badge--azul', entrenador: 'badge--amarillo' }

const fechaDe = (u) => u.created_at ?? u.creado_en ?? u.fecha_registro ?? null
const fechaTexto = (u) => {
  const valor = fechaDe(u)
  return valor ? fecha(valor) : '—'
}

export default function VistaGestion({
  usuarios = [], cargando, busqueda = '', onToggle, onCambiarRol,
}) {
  const [pagina, setPagina] = useState(1)

  const aprobados = useMemo(
    () => usuarios.filter((u) => u.estado === 'aprobada'),
    [usuarios],
  )

  // ID tipo EN001 / AT001: prefijo del rol + orden de registro dentro de ese rol
  const codigos = useMemo(() => {
    const mapa = {}
    const contador = {}
    const ordenados = [...aprobados].sort(
      (a, b) => new Date(fechaDe(a) ?? 0) - new Date(fechaDe(b) ?? 0),
    )
    ordenados.forEach((u) => {
      const prefijo = (NOMBRE_ROL[u.rol] ?? u.rol ?? 'US').slice(0, 2).toUpperCase()
      contador[prefijo] = (contador[prefijo] ?? 0) + 1
      mapa[u.id] = u.codigo ?? `${prefijo}${String(contador[prefijo]).padStart(3, '0')}`
    })
    return mapa
  }, [aprobados])

  const q = busqueda.trim().toLowerCase()
  const lista = aprobados.filter((u) =>
    `${u.nombre ?? ''} ${u.email ?? ''} ${codigos[u.id] ?? ''}`.toLowerCase().includes(q),
  )

  useEffect(() => { setPagina(1) }, [busqueda])

  const { visibles, actual, totalPaginas, total, inicio } = paginar(lista, pagina)

  const totales = aprobados.length
  const activos = aprobados.filter((u) => u.activo).length
  const inactivos = totales - activos

  return (
    <>
      <div className="gestion-encabezado">
        <div className="gestion-stats">
          <span className="stat-badge stat-badge--azul">
            <Users size={15} strokeWidth={2} /> {totales} Usuarios totales
          </span>
          <span className="stat-badge stat-badge--verde">
            <Users size={15} strokeWidth={2} /> {activos} Usuarios activos
          </span>
          <span className="stat-badge stat-badge--rojo">
            <Users size={15} strokeWidth={2} /> {inactivos} Usuarios inactivos
          </span>
        </div>
      </div>

      <div className="tabla-wrap">
        <table className="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="tabla-vacia">Cargando usuarios...</td></tr>
            ) : visibles.length === 0 ? (
              <tr><td colSpan={7} className="tabla-vacia">No hay usuarios para mostrar.</td></tr>
            ) : (
              visibles.map((u) => (
                <tr key={u.id}>
                  <td className="correo-celda">{codigos[u.id]}</td>
                  <td>
                    <div className="nombre-con-avatar">
                      <span className="avatar-inicial">{(u.nombre ?? '?').charAt(0).toUpperCase()}</span>
                      <span className="nombre-celda">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="correo-celda">{u.email}</td>
                  <td>
                    <select
                      className={`select-rol badge ${BADGE_ROL[u.rol] ?? 'badge--azul'}`}
                      value={u.rol}
                      onChange={(e) => onCambiarRol(u, e.target.value)}
                      aria-label={`Rol de ${u.nombre}`}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>{NOMBRE_ROL[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.activo ? 'badge--verde' : 'badge--rojo'}`}>
                      {u.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="correo-celda">{fechaTexto(u)}</td>
                  <td>
                    <label className="toggle" title={u.activo ? 'Desactivar cuenta' : 'Activar cuenta'}>
                      <input
                        type="checkbox"
                        checked={!!u.activo}
                        onChange={() => onToggle(u)}
                      />
                      <span className="toggle__pista" />
                    </label>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!cargando && total > 0 && (
        <div className="cuentas-pie">
          <span>Mostrando {inicio + 1}–{inicio + visibles.length} de {total}</span>
          <div className="cuentas-paginador">
            <button
              type="button"
              disabled={actual === 1}
              onClick={() => setPagina(actual - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <span className="cuentas-paginador__indicador">{actual} / {totalPaginas}</span>
            <button
              type="button"
              disabled={actual === totalPaginas}
              onClick={() => setPagina(actual + 1)}
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}