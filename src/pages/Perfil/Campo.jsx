export default function Campo({ id, label, icono: Icono, children, aviso, error }) {
  return (
    <div className="form-grupo">
      <div className="form-grupo__cabecera">
        <label htmlFor={id}>{label}</label>
        {aviso && <small className="campo-aviso">{aviso}</small>}
      </div>
      <div className="campo-con-icono">
        <Icono size={16} />
        {children}
      </div>
      {error && <small className="perfil-campo-error" role="alert">{error}</small>}
    </div>
  );
}