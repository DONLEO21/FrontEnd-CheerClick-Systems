function InfoUsuario({ atleta }) {
  return (
    <aside className="atl-pagos-infor-usuario-atl">
      <div className="atl-pagos-infor-usua-atl">
        <div className="atl-pagos-detalle-usu-atl"></div>
        <h3>
          {atleta?.nombre ?? "Cargando…"}
          <p>{atleta?.nivel ? `Atleta · ${atleta.nivel}` : "Atleta"}</p>
        </h3>
      </div>
      <div className="atl-pagos-perfil-atl">
        <button type="button">
          <svg className="atl-pagos-lapiz-atl" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            <path d="m15 5 4 4" />
          </svg>
          Perfil
        </button>
      </div>
    </aside>
  );
}
export default InfoUsuario;