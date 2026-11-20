// Resumen de habilidades (todo calculado con la lista real): total, habilitadas, por tipo y deshabilitadas.
function TargetasEstadoHabilidad({ habilidades }) {
  const habilitadas = habilidades.filter((h) => h.estado !== "inhabilitada");
  const contarPorCategoria = (categoria) => habilitadas.filter((h) => h.categoria === categoria).length;
  const deshabilitadas = habilidades.length - habilitadas.length;

  const tarjetas = [
    { id: "total", punto: "negro", valor: habilidades.length, titulo: "Total" },
    { id: "habilitadas", punto: "verde", valor: habilitadas.length, titulo: "Habilitadas" },
    { id: "apropiada", punto: "azul", valor: contarPorCategoria("apropiada"), titulo: "Apropiadas" },
    { id: "avanzada", punto: "rojo", valor: contarPorCategoria("avanzada"), titulo: "Avanzadas" },
    { id: "elite", punto: "ama", valor: contarPorCategoria("elite"), titulo: "Élite" },
    { id: "deshabilitadas", punto: "gris", valor: deshabilitadas, titulo: "Deshabilitadas" },
  ];

  return (
    <section className="ui-tarjetas adm-rendimiento-targetas-h" aria-label="Resumen de habilidades">
      {tarjetas.map((t) => (
        <div className="targe-ren-h" key={t.id}>
          <div className={`adm-rendimiento-detalle-cir-${t.punto}`}></div>
          <h3 className="adm-rendimiento-valor-targe">{t.valor}</h3>
          <h4 className="titu-targe">{t.titulo}</h4>
        </div>
      ))}
    </section>
  );
}

export default TargetasEstadoHabilidad;
