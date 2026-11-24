import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, ImageOff, KeyRound, Landmark, Maximize2, Phone, X } from 'lucide-react';
import { getImageUrl } from '../../api/client';
import { esMetodoEfectivo } from '../../utils/metodosPago';

/**
 * Datos para pagar con un método: QR (ampliable y descargable), llave, teléfono y cuenta (cada uno con «Copiar») y, si se
 * pasan, el valor a pagar y el concepto. Un solo componente para TODOS los flujos de pago (mensualidad, competencia,
 * pedido de implementos y registro del administrador).
 *
 * Props: metodo { nombre, qr, llave, numeroTelefono, numeroCuenta, requiereComprobante }, valor (número, opcional),
 * concepto (texto, opcional), textoEfectivo (opcional: ayuda propia del flujo para Efectivo). Los datos vacíos no se muestran. Sin nada que mostrar: texto de ayuda según el método.
 * Anchos: QR y datos lado a lado y, en pantallas estrechas, apilados (ver global.css, «ui-datos-pago»).
 */
const pesos = (n) => Number(n).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

async function copiarTexto(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Sin permiso de portapapeles (http, iframe…): alternativa con un campo temporal
    try {
      const campo = document.createElement('textarea');
      campo.value = texto;
      campo.setAttribute('readonly', '');
      campo.style.position = 'fixed';
      campo.style.opacity = '0';
      document.body.appendChild(campo);
      campo.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(campo);
      return ok;
    } catch {
      return false;
    }
  }
}

function FilaDato({ icono: Icono, etiqueta, valor }) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copiar = async () => {
    if (!(await copiarTexto(valor))) return;
    setCopiado(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), 1600);
  };

  return (
    <div className="ui-datos-pago__fila">
      <span className="ui-datos-pago__icono" aria-hidden="true"><Icono size={16} /></span>
      <div className="ui-datos-pago__texto">
        <span className="ui-datos-pago__etiqueta">{etiqueta}</span>
        <strong className="ui-datos-pago__valor">{valor}</strong>
      </div>
      <button type="button" className={`ui-datos-pago__copiar${copiado ? ' ui-datos-pago__copiar--ok' : ''}`} onClick={copiar} aria-label={`Copiar ${etiqueta.toLowerCase()}`}>
        {copiado ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
        <span role="status">{copiado ? 'Copiado' : 'Copiar'}</span>
      </button>
    </div>
  );
}

export default function DatosPagoMetodo({ metodo, valor, concepto, textoEfectivo }) {
  const urlQr = getImageUrl(metodo?.qr);
  // Se recuerda DE QUÉ imagen se trata: al cambiar de método (otra URL) el estado «roto» o «ampliado» deja de aplicar solo
  const [urlRota, setUrlRota] = useState(null);
  const [urlAmpliada, setUrlAmpliada] = useState(null);
  const qrRoto = !!urlQr && urlRota === urlQr;
  const ampliado = !!urlQr && urlAmpliada === urlQr;
  const setQrRoto = () => setUrlRota(urlQr);
  const setAmpliado = (abrir) => setUrlAmpliada(abrir ? urlQr : null);
  const visor = useRef(null);

  useEffect(() => {
    const dialogo = visor.current;
    if (!dialogo) return;
    if (ampliado && !dialogo.open) dialogo.showModal();
    if (!ampliado && dialogo.open) dialogo.close();
  }, [ampliado]);

  if (!metodo) return null;

  const datos = [
    { icono: KeyRound, etiqueta: 'Llave', valor: metodo.llave },
    { icono: Phone, etiqueta: 'Teléfono', valor: metodo.numeroTelefono },
    { icono: Landmark, etiqueta: 'Cuenta', valor: metodo.numeroCuenta },
  ].filter((d) => String(d.valor ?? '').trim());
  const hayQr = !!urlQr;
  const efectivo = esMetodoEfectivo(metodo.nombre) || metodo.requiereComprobante === false;
  const montoOk = valor !== undefined && valor !== null && valor !== '' && Number.isFinite(Number(valor));

  const descargar = async () => {
    const nombre = `QR-${String(metodo.nombre).replace(/[^\p{L}\p{N}]+/gu, '-')}.png`;
    try {
      const blob = await (await fetch(urlQr)).blob();
      const enlace = document.createElement('a');
      enlace.href = URL.createObjectURL(blob);
      enlace.download = nombre;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      setTimeout(() => URL.revokeObjectURL(enlace.href), 1000);
    } catch {
      window.open(urlQr, '_blank', 'noopener'); // si el navegador no deja descargar, al menos se abre la imagen
    }
  };

  return (
    <section className="ui-datos-pago" aria-label={`Datos para pagar con ${metodo.nombre}`}>
      {(montoOk || concepto) && (
        <div className="ui-datos-pago__resumen">
          {montoOk && (
            <div>
              <span className="ui-datos-pago__etiqueta">Valor a pagar</span>
              <strong className="ui-datos-pago__monto">{pesos(valor)}</strong>
            </div>
          )}
          {concepto && (
            <div>
              <span className="ui-datos-pago__etiqueta">Concepto</span>
              <strong className="ui-datos-pago__valor">{concepto}</strong>
            </div>
          )}
        </div>
      )}

      {hayQr || datos.length > 0 ? (
        <div className="ui-datos-pago__cuerpo">
          {hayQr && (
            <div className="ui-datos-pago__qr">
              {qrRoto ? (
                <div className="ui-datos-pago__qr-roto" role="img" aria-label="No se pudo cargar el código QR">
                  <ImageOff size={28} aria-hidden="true" />
                  <span>No se pudo cargar el QR</span>
                </div>
              ) : (
                <button type="button" className="ui-datos-pago__qr-marco" onClick={() => setAmpliado(true)} aria-label="Ampliar código QR">
                  <img src={urlQr} alt={`Código QR de ${metodo.nombre}`} onError={setQrRoto} />
                  <span className="ui-datos-pago__ampliar" aria-hidden="true"><Maximize2 size={14} /></span>
                </button>
              )}
              {!qrRoto && (
                <button type="button" className="ui-datos-pago__descargar" onClick={descargar}>
                  <Download size={14} aria-hidden="true" /> Descargar QR
                </button>
              )}
            </div>
          )}

          {datos.length > 0 && (
            <div className="ui-datos-pago__datos">
              {datos.map((d) => <FilaDato key={d.etiqueta} {...d} />)}
            </div>
          )}
        </div>
      ) : (
        <p className="ui-datos-pago__ayuda" role="note">
          {efectivo
            ? (textoEfectivo ?? 'Pagarás en el club. No necesitas subir comprobante.')
            : `Este método aún no tiene datos de pago configurados. Pregunta en el club cómo pagar con ${metodo.nombre}.`}
        </p>
      )}

      {/* Visor del QR: un <dialog> propio (capa superior), así no rompe el modal que lo contiene */}
      {hayQr && !qrRoto && (
        <dialog ref={visor} className="ui-datos-pago__visor" onClose={() => setAmpliado(false)} onClick={(e) => { if (e.target === visor.current) setAmpliado(false); }}>
          <button type="button" className="ui-datos-pago__visor-cerrar" onClick={() => setAmpliado(false)} aria-label="Cerrar visor"><X size={18} /></button>
          <img src={urlQr} alt={`Código QR de ${metodo.nombre} ampliado`} />
          <button type="button" className="ui-datos-pago__descargar" onClick={descargar}>
            <Download size={14} aria-hidden="true" /> Descargar QR
          </button>
        </dialog>
      )}
    </section>
  );
}
