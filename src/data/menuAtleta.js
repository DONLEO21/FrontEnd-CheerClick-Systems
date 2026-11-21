import usuario from '../assets/icons/usuario.png';
import calendario from '../assets/icons/calendario.png';
import camisa from '../assets/icons/Camisa.png';
import factura from '../assets/icons/factura.png';
import comentarios from '../assets/icons/comentarios.png';
import estadisticas from '../assets/icons/estadisticas-de-barras.png';

const menuAtleta = [
  { href: '/atleta/perfil', titulo: 'Perfil', icono: usuario, alt: 'Perfil' },
  { href: '/atleta/horarios', titulo: 'Horarios', icono: calendario, alt: 'Horarios' },
  { href: '/atleta/implementos', titulo: 'Implementos Deportivos', icono: camisa, alt: 'Implementos' },
  { href: '/atleta/pagos', titulo: 'Pagos', icono: factura, alt: 'Estado de cuentas' },
  { href: '/atleta/pqrs', titulo: 'PQRS', icono: comentarios, alt: 'PQRS' },
  { href: '/atleta/rendimiento', titulo: 'Rendimiento Deportivo', icono: estadisticas, alt: 'Estado de cuentas' },
];

export default menuAtleta;
