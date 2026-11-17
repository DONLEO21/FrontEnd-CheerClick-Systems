import { useEffect, useRef, useState } from "react";

// Select personalizado reutilizable (mismos estilos .filtro-caja-custom / .custom-dropdown)
export default function FiltroSelect({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className="filtro-caja-custom" ref={containerRef}>
      <span className="filtro-label">{label}:</span>
      <div className="custom-dropdown">
        <button type="button" className="custom-dropdown-btn" onClick={() => setOpen(!open)}>
          <span>{selectedOption.label}</span>
          <svg className={`arrow-icon ${open ? "open" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <ul className="custom-dropdown-menu">
            {options.map((opt) => (
              <li
                key={opt.value}
                className={`custom-dropdown-item ${value === opt.value ? "active" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
