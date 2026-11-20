function Targetaestado({titulo, dato, texto}){
    return(
        
        <div className="targe-ren">
            <h4 className="titu-targe">{titulo}</h4>
            <div className="conte-targe">
                <span className="numero">{dato}</span>
                <p className="nombre-tar">{texto}</p>
            </div>
        </div>
    )
}

export default Targetaestado