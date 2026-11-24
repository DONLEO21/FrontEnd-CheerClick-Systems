import { useEffect, useState } from 'react';
import {
  cargarMiPerfil, perfilDesdeApi, guardarPerfilPropio, subirFotoPerfil, urlCertificadoPropio,
} from '../../services/perfil';
import { limpiarCacheUsuario } from '../../hooks/useUsuario';
import { almacenSesion } from '../../api/client';
import { renovarSesion } from '../../services/sesion';
import {
  CAMPOS_UNA_VEZ, DATOS_INICIALES, BLOQUEOS_INICIALES,
} from './perfilData.js';
import { validarFechaNacimiento } from '../../utils/fechaNacimiento.js';

// Caché en memoria: evita repetir consultas al navegar entre pantallas.
// Se descarta si cambia el usuario con sesión iniciada.
let cache = null;
let cacheUsuarioId = null;
const leerCache = () => {
  const id = almacenSesion.usuario()?.id ?? null;
  if (id !== cacheUsuarioId) { cache = null; cacheUsuarioId = id; }
  return cache;
};

// Reduce la foto a 512px y la convierte a JPG para que suba y cargue rápido
async function comprimirImagen(archivo, lado = 512, calidad = 0.85) {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, lado / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; // PNG con transparencia -> fondo blanco
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', calidad));
  return blob ?? archivo;
}

export default function usePerfil({ rol, mostrarAviso }) {
  // Atleta: 2 contactos de emergencia. Entrenador y admin: 1 solo contacto.
  const cantidadContactos = rol === 'atleta' ? 2 : 1;

  const [datos, setDatos] = useState(() => leerCache()?.datos ?? DATOS_INICIALES);
  const [borrador, setBorrador] = useState(() => leerCache()?.datos ?? DATOS_INICIALES);
  const [bloqueos, setBloqueos] = useState(() => leerCache()?.bloqueos ?? BLOQUEOS_INICIALES);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const [cargandoPerfil, setCargandoPerfil] = useState(() => !leerCache());

  const [modal, setModal] = useState(null); // 'foto' | 'confirmar' | null

  // Carga el perfil real desde el backend al montar
  useEffect(() => {
    let vivo = true;

    (async () => {
      try {
        const mi = await cargarMiPerfil();
        if (!vivo) return;

        const { datos: cargados, bloqueos: bloq } = perfilDesdeApi(mi, cantidadContactos);

        // Conserva la URL del certificado si ya se había generado antes
        const urlPrevia = cache?.datos?.certificadoEpsPath === cargados.certificadoEpsPath
          ? cache.datos.certificadoEpsUrl
          : '';
        const inicial = { ...cargados, certificadoEpsUrl: urlPrevia };

        cache = { datos: inicial, bloqueos: bloq };
        setDatos(inicial);
        setBorrador(inicial);
        setBloqueos(bloq);
        setCargandoPerfil(false); // el formulario aparece YA
        // Perfil incompleto (obligatorio): el formulario se abre directamente en modo edición
        if (almacenSesion.usuario()?.perfilCompleto === false) setEditando(true);

        // El certificado (ruta protegida) se descarga después, sin bloquear la pantalla
        if (cargados.certificadoEpsPath && !urlPrevia) {
          const url = await urlCertificadoPropio().catch(() => '');
          if (vivo && url) {
            setDatos((prev) => ({ ...prev, certificadoEpsUrl: url }));
            setBorrador((prev) => ({ ...prev, certificadoEpsUrl: url }));
            if (cache) cache.datos = { ...cache.datos, certificadoEpsUrl: url };
          }
        }
      } catch {
        if (vivo) {
          mostrarAviso('No pudimos cargar tu perfil.', 'error');
          setCargandoPerfil(false);
        }
      }
    })();

    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const vista = editando ? borrador : datos;

  // Edad mínima según el rol (admin/entrenador ≥ 18, atleta ≥ 5); solo mientras el campo es editable
  const errorFecha = editando && !bloqueos.fechaNacimiento
    ? validarFechaNacimiento(borrador.fechaNacimiento, rol)
    : '';

  // Nombre y apellido son obligatorios (el backend también lo valida)
  const errorNombre = editando
    ? (!borrador.nombre?.trim() ? 'El nombre es obligatorio.' : !borrador.apellido?.trim() ? 'El apellido es obligatorio.' : '')
    : '';

  const cambiosUnaVez = CAMPOS_UNA_VEZ.filter(
    (c) => !bloqueos[c] && borrador[c] !== datos[c]
  );

  /* ---- handlers de edición ---- */

  const cambiar = (campo, valor) =>
    setBorrador((prev) => ({ ...prev, [campo]: valor }));

  const cambiarContacto = (indice, campo, valor) =>
    setBorrador((prev) => ({
      ...prev,
      contactos: prev.contactos.map((c, i) => (i === indice ? { ...c, [campo]: valor } : c)),
    }));

  const activarEdicion = () => {
    setBorrador(datos);
    setErrorGuardar('');
    setEditando(true);
  };

  const cancelarEdicion = () => {
    setBorrador(datos);
    setEditando(false);
  };

  const cambiarArchivoEps = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBorrador((prev) => ({
      ...prev,
      certificadoEpsNombre: file.name,
      certificadoEpsArchivo: file,
    }));
  };

  const confirmarGuardar = async () => {
    setGuardando(true);
    setErrorGuardar('');
    try {
      await guardarPerfilPropio(borrador, cantidadContactos);

      let certificadoEpsPath = borrador.certificadoEpsPath;
      let certificadoEpsUrl = borrador.certificadoEpsUrl;
      if (borrador.certificadoEpsArchivo) {
        certificadoEpsPath = 'me';
        certificadoEpsUrl = await urlCertificadoPropio().catch(() => '');
      }

      const actualizado = {
        ...borrador,
        _existePerfil: true,
        certificadoEpsPath,
        certificadoEpsUrl,
        certificadoEpsArchivo: null,
      };
      const nuevosBloqueos = { ...bloqueos };
      cambiosUnaVez.forEach((c) => { nuevosBloqueos[c] = true; });

      setDatos(actualizado);
      setBorrador(actualizado);
      setBloqueos(nuevosBloqueos);
      cache = { datos: actualizado, bloqueos: nuevosBloqueos };
      setEditando(false);
      setModal(null);
      // La cabecera y la sesión muestran el nombre nuevo (renovar-token devuelve el usuario actualizado)
      renovarSesion().then(limpiarCacheUsuario).catch(() => limpiarCacheUsuario());
      mostrarAviso('Cambios guardados con éxito', 'ok');
    } catch (err) {
      setErrorGuardar(err.message || 'No pudimos guardar los cambios. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  // Sube la foto (comprimida) al backend; el backend devuelve su URL pública
  const guardarFoto = async (archivo) => {
    if (!archivo) return;
    setGuardandoFoto(true);
    try {
      const comprimida = await comprimirImagen(archivo);
      const fotoUrl = await subirFotoPerfil(comprimida);

      setDatos((prev) => ({ ...prev, fotoUrl }));
      setBorrador((prev) => ({ ...prev, fotoUrl }));
      if (cache) cache.datos = { ...cache.datos, fotoUrl };
      limpiarCacheUsuario(); // la cabecera recarga la foto nueva
      setModal(null);
      mostrarAviso('Foto de perfil actualizada', 'ok');
    } catch (err) {
      mostrarAviso(err.message || 'No pudimos actualizar la foto.', 'error');
    } finally {
      setGuardandoFoto(false);
    }
  };

  return {
    datos, vista, bloqueos, editando, guardando, guardandoFoto,
    errorGuardar, cargandoPerfil, modal, setModal,
    cantidadContactos, cambiosUnaVez, errorFecha, errorNombre,
    cambiar, cambiarContacto, cambiarArchivoEps,
    activarEdicion, cancelarEdicion, confirmarGuardar, guardarFoto,
  };
}