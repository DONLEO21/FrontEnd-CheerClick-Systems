// Documento exportable de la asistencia mensual de un nivel (se abre en una pestaña lista para imprimir
// o guardar como PDF desde el navegador). Incluye logo del club, título, fecha de generación, resumen,
// tabla ordenada alfabéticamente por apellido y leyenda.

import { porcentajeAsistencia } from "../../../services/asistenciaService";
import { fechaHoyISO } from "../../../services/data";

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const SIMBOLO = {
  presente: { letra: "P", clase: "p", texto: "Presente" },
  inpuntual: { letra: "I", clase: "i", texto: "Inpuntual" },
  falta: { letra: "F", clase: "f", texto: "Falta" },
  justificado: { letra: "J", clase: "j", texto: "Justificado" },
};

const fechaHoraActual = () =>
  new Date().toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" });

function porcentajeDe(dias, historialAtleta, historialNivel) {
  return porcentajeAsistencia(dias, historialAtleta, fechaHoyISO(), historialNivel);
}

export function construirReporteAsistencia({ nivel, mesLabel, dias, atletas, historial, resumen, logoUrl }) {
  const ordenados = [...atletas].sort((a, b) =>
    `${a.apellido ?? ""} ${a.nombre ?? ""}`.localeCompare(`${b.apellido ?? ""} ${b.nombre ?? ""}`, "es", { sensitivity: "base" })
  );

  const encabezadoDias = dias
    .map(({ dia, letra }) => `<th class="dia"><span>${esc(dia)}</span><small>${esc(letra)}</small></th>`)
    .join("");

  const filas = ordenados
    .map((a, i) => {
      const h = historial[a.id] ?? {};
      const celdas = dias
        .map(({ dia }) => {
          const reg = h[dia];
          const s = reg && SIMBOLO[reg.estado];
          return `<td class="dia">${s ? `<span class="m ${s.clase}" title="${esc(s.texto)}">${s.letra}</span>` : ""}</td>`;
        })
        .join("");
      return `<tr><td class="n">${i + 1}</td><td class="nom">${esc(a.apellido)} ${esc(a.nombre)}</td>${celdas}<td class="pct">${porcentajeDe(dias, h, historial)}%</td></tr>`;
    })
    .join("");

  const leyenda = Object.values(SIMBOLO)
    .map((s) => `<span><span class="m ${s.clase}">${s.letra}</span> ${s.texto}</span>`)
    .join("");

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Asistencia ${esc(nivel?.categoria ?? "")} – ${esc(mesLabel)}</title>
<style>
  @page { size: A4 landscape; margin: 14mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; font-family: Arimo, Arial, Helvetica, sans-serif; color: #1f2430; background: #fff; }
  .barra { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 14px; }
  .barra button { padding: 9px 18px; border: none; border-radius: 8px; background: #cc0000; color: #fff; font-weight: 700; cursor: pointer; }
  header { display: flex; align-items: center; gap: 16px; padding-bottom: 14px; border-bottom: 3px solid #cc0000; }
  header img { width: 64px; height: 64px; object-fit: contain; }
  header h1 { margin: 0; font-size: 22px; }
  header p { margin: 3px 0 0; color: #5d6575; font-size: 13px; }
  .meta { margin-left: auto; text-align: right; font-size: 12px; color: #5d6575; }
  .resumen { display: flex; gap: 12px; margin: 16px 0; flex-wrap: wrap; }
  .resumen div { padding: 8px 16px; border: 1px solid #d9dde5; border-radius: 10px; font-size: 13px; }
  .resumen strong { display: block; font-size: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th, td { border: 1px solid #d9dde5; padding: 6px 4px; text-align: center; }
  thead th { background: #cc0000; color: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  tbody tr:nth-child(even) { background: #f6f7f9; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  th.dia span { display: block; font-size: 12px; }
  th.dia small { font-weight: 400; opacity: .85; }
  td.n { width: 28px; color: #7a8294; }
  td.nom { text-align: left; padding-left: 10px; white-space: nowrap; font-weight: 600; }
  td.pct { font-weight: 700; width: 48px; }
  .m { display: inline-block; width: 20px; height: 20px; line-height: 20px; border-radius: 50%; font-size: 11px; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .m.p { background: #d8f3e2; color: #167a3d; }
  .m.i { background: #ffefc2; color: #9a6a00; }
  .m.f { background: #fbd9d9; color: #b00000; }
  .m.j { background: #d9e8fb; color: #1d4fa8; }
  .leyenda { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 14px; font-size: 12px; color: #5d6575; }
  .leyenda > span { display: inline-flex; align-items: center; gap: 6px; }
  footer { margin-top: 18px; font-size: 11px; color: #8a92a3; text-align: center; }
  tr { break-inside: avoid; }
  @media print { body { padding: 0; } .barra { display: none; } }
</style>
</head>
<body>
  <div class="barra"><button type="button" onclick="window.print()">Imprimir / Guardar como PDF</button></div>
  <header>
    <img src="${esc(logoUrl)}" alt="Logo del club" onerror="this.style.display='none'">
    <div>
      <h1>Reporte de asistencia</h1>
      <p>${esc(nivel?.categoria ?? "")} · ${esc(mesLabel)}</p>
    </div>
    <div class="meta">Generado el<br><strong>${esc(fechaHoraActual())}</strong></div>
  </header>
  <section class="resumen">
    <div><strong>${resumen.porcentaje}%</strong>Asistencia del mes</div>
    <div><strong>${resumen.presentes}</strong>Presentes</div>
    <div><strong>${resumen.inpuntuales}</strong>Inpuntuales</div>
    <div><strong>${resumen.faltas}</strong>Faltas</div>
    <div><strong>${ordenados.length}</strong>Atletas</div>
  </section>
  <table>
    <thead><tr><th>#</th><th style="text-align:left;padding-left:10px">Atleta</th>${encabezadoDias}<th>%</th></tr></thead>
    <tbody>${filas || `<tr><td colspan="${dias.length + 3}">No hay atletas para mostrar.</td></tr>`}</tbody>
  </table>
  <div class="leyenda">${leyenda}</div>
  <footer>Blood Tigers Cheer · Documento generado por CheerClick</footer>
</body>
</html>`;
}

/** Abre el reporte en una pestaña nueva. Devuelve false si el navegador bloqueó la ventana. */
export function abrirReporteAsistencia(datos) {
  const html = construirReporteAsistencia({ ...datos, logoUrl: `${window.location.origin}/Logo-Club.png` });
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const ventana = window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return Boolean(ventana);
}
