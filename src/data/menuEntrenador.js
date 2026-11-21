import usuario from '../assets/icons/usuario.png';
import listaVerificacion from '../assets/icons/lista-de-verificacion.png';
import calendario from '../assets/icons/calendario.png';
import estadisticas from '../assets/icons/estadisticas-de-barras.png';
import comentarios from '../assets/icons/comentarios.png';

const menuEntrenador = [
  { href: '/entrenador/perfil', titulo: 'Perfil', icono: usuario, alt: 'Perfil' },
  { href: '/entrenador/asistencia', titulo: 'Asistencia', icono: listaVerificacion, alt: 'Estado de cuentas' },
  { href: '/entrenador/horarios', titulo: 'Horarios', icono: calendario, alt: 'Horarios' },
  { href: '/entrenador/rendimiento', titulo: 'Rendimiento Deportivo', icono: estadisticas, alt: 'Estado de cuentas' },
  { href: '/entrenador/pqrs', titulo: 'PQRS', icono: comentarios, alt: 'PQRS' },
];

export default menuEntrenador;
