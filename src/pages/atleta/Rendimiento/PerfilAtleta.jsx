import Avatar from "../../../components/Compartidos/Avatar";
import { obtenerEstiloNivel } from "../../../components/utils/nivelEstilos";

function PerfilAtleta({ atleta }) {
  return (
    <div className="perfil-atleta">
      <Avatar foto={atleta.foto} nombre={atleta.nombre} alt={`Foto de ${atleta.nombre}`} className="perfil-atleta__foto" claseIniciales="perfil-atleta__foto--iniciales" />
      <div className="perfil-atleta__info">
        <h3>{atleta.nombre}</h3>
        <p>{atleta.edad != null ? `Edad: ${atleta.edad} años` : "Completa tu fecha de nacimiento en el perfil"}</p>
        {atleta.nivel && (
          <span className="badge-nivel" style={obtenerEstiloNivel(atleta.nivel)}>
            {atleta.nivel}
          </span>
        )}
      </div>
    </div>
  );
}

export default PerfilAtleta;