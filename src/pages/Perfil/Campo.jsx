// requerido: asterisco (perfil incompleto, campo obligatorio); faltante: además, borde de acento mientras siga vacío
export default function Campo({ id, label, icono: Icono, children, aviso, error, requerido = false, faltante = false }) {
  return (
    <div className={`form-grupo${faltante ? ' perfil-campo--faltante' : ''}`}>
      <div className="form-grupo__cabecera">
        <label htmlFor={id}>{label}{requerido && <span className="perfil-asterisco" aria-hidden="true">*</span>}</label>
        {aviso && <small className="campo-aviso">{aviso}</small>}
      </div>
      <div className="campo-con-icono">
        <Icono size={16} />
        {children}
      </div>
      {error && <small className="perfil-campo-error" id={`${id}-error`} role="alert">{error}</small>}
    </div>
  );
}