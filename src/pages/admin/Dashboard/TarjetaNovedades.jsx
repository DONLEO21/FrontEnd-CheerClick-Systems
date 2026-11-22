import { Banknote, Megaphone, MessageSquareDot, Shirt } from "lucide-react";
import { MAX_ITEMS, RUTA_NOVEDADES } from "./dashboardAdminData.js";
import useFuente from "../../../hooks/useFuente";
import EstadoTarjeta from "../../../components/Compartidos/EstadoTarjeta";
import { cargarNovedades } from "../../../services/dashboardAdminService";

const ICONO = { pqrs: MessageSquareDot, pedido: Shirt, pago: Banknote };
const RUTA = { pqrs: "/admin/pqrs", pedido: "/admin/implementos", pago: "/admin/pagos" };

export default function TarjetaNovedades({ onNavigate }) {
  const { datos, cargando, error, recargar } = useFuente(cargarNovedades);
  const lista = datos ?? [];

  return (
    <article className="tarjeta-dashboard">
      <header className="tarjeta-dashboard__header tarjeta-dashboard__header--icono">
        <span className="icono-cabecera">
          <Megaphone size={22} strokeWidth={2} />
        </span>
        <h2>Novedades</h2>
      </header>

      <div className="tarjeta-dashboard__contenido">
        <EstadoTarjeta cargando={cargando} error={error} onReintentar={recargar} vacio={lista.length === 0} textoVacio="Aún no hay novedades pendientes.">
          <ul className="lista-novedades">
            {lista.slice(0, MAX_ITEMS).map(({ id, tipo, titulo, detalle }) => {
              const Icono = ICONO[tipo] ?? Megaphone;
              const ruta = RUTA[tipo] ?? RUTA_NOVEDADES;
              return (
                <li className="lista-novedades__item" key={id}>
                  <a
                    href={ruta}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(ruta);
                    }}
                  >
                    <div className="lista-novedades__icono">
                      <Icono size={24} strokeWidth={2} />
                    </div>
                    <div className="lista-novedades__texto">
                      <h3>{titulo}</h3>
                      <p>{detalle}</p>
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
        </EstadoTarjeta>
      </div>
    </article>
  );
}
