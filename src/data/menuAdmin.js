import usuario from '../assets/icons/usuario.png';
import listaVerificacion from '../assets/icons/lista-de-verificacion.png';
import usuarios from '../assets/icons/usuarios.png';
import calendario from '../assets/icons/calendario.png';
import camisa from '../assets/icons/Camisa.png';
import factura from '../assets/icons/factura.png';
import comentarios from '../assets/icons/comentarios.png';
import estadisticas from '../assets/icons/estadisticas-de-barras.png';

const menuAdmin = [
  { href: '/admin/perfil', titulo: 'Perfil', icono: usuario, alt: 'Perfil' },
  { href: '/admin/asistencia', titulo: 'Asistencia', icono: listaVerificacion, alt: 'Asistencia' },
  { href: '/admin/usuarios', titulo: 'Cuentas de Usuarios', icono: usuarios, alt: 'Validación de cuentas' },
  { href: '/admin/horarios', titulo: 'Horarios', icono: calendario, alt: 'Horarios' },
  { href: '/admin/implementos', titulo: 'Implementos Deportivos', icono: camisa, alt: 'Implementos' },
  { href: '/admin/pagos', titulo: 'Pagos', icono: factura, alt: 'Estado de cuentas' },
  { href: '/admin/pqrs', titulo: 'PQRS', icono: comentarios, alt: 'PQRS' },
  { href: '/admin/rendimiento', titulo: 'Rendimiento Deportivo', icono: estadisticas, alt: 'Estado de cuentas' },
];

export default menuAdmin;