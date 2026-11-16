// Utilidades para archivos subidos por el usuario (comprobantes, QR, etc.)

const MB = 1024 * 1024;

export const leerComoDataURL = (archivo) =>
  new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.readAsDataURL(archivo);
  });

// Reduce una imagen para que no pese de más en la base de datos.
export function redimensionarImagen(archivo, { max = 1200, tipo = "image/jpeg", calidad = 0.82 } = {}) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(max / img.width, max / img.height, 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * escala);
      canvas.height = Math.round(img.height * escala);
      const ctx = canvas.getContext("2d");
      if (tipo === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(tipo, calidad));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}

// Comprobante de pago: imagen (se comprime) o PDF, máx. 5 MB.
export async function prepararComprobante(archivo) {
  const esImagen = archivo.type.startsWith("image/");
  const esPdf = archivo.type === "application/pdf";
  if (!esImagen && !esPdf) throw new Error("El comprobante debe ser una imagen (PNG, JPG) o un PDF.");
  if (archivo.size > 5 * MB) throw new Error("El comprobante no debe superar 5 MB.");
  return esImagen ? redimensionarImagen(archivo, { max: 1400 }) : leerComoDataURL(archivo);
}

// Imagen del código QR: se conserva en PNG para que siga siendo legible.
export async function prepararQR(archivo) {
  if (!archivo.type.startsWith("image/")) throw new Error("El QR debe ser una imagen (PNG o JPG).");
  if (archivo.size > 3 * MB) throw new Error("La imagen del QR no debe superar 3 MB.");
  return redimensionarImagen(archivo, { max: 700, tipo: "image/png" });
}

// Los navegadores bloquean abrir un data: URL directamente; se convierte a blob.
export async function abrirDataURL(dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
