/**
 * Textarea compacto con contador "n/250": 3 filas, sin redimensionar y con scroll interno si el texto crece.
 * Estilos: .ui-textarea-contador en global.css
 */
export default function TextareaContador({ id, value, onChange, max = 250, rows = 3, placeholder, className = "" }) {
  return (
    <div className="ui-textarea-contador">
      <textarea
        id={id}
        className={className}
        rows={rows}
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <span className="ui-textarea-contador__cuenta" aria-live="polite">{value.length}/{max}</span>
    </div>
  );
}
