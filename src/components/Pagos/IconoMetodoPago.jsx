// Iconos genéricos por método de pago (presencial / Nequi / Davivienda)
export default function IconoMetodoPago({ id, size = 22 }) {
  const comun = {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  if (id === "nequi") {
    return (
      <svg {...comun}>
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  }
  if (id === "davivienda") {
    return (
      <svg {...comun}>
        <line x1="3" y1="21" x2="21" y2="21" />
        <line x1="5" y1="10" x2="5" y2="17" />
        <line x1="10" y1="10" x2="10" y2="17" />
        <line x1="14" y1="10" x2="14" y2="17" />
        <line x1="19" y1="10" x2="19" y2="17" />
        <path d="M12 3 3 8h18z" />
        <line x1="3" y1="21" x2="3" y2="19" />
        <line x1="21" y1="21" x2="21" y2="19" />
      </svg>
    );
  }
  return (
    <svg {...comun}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
