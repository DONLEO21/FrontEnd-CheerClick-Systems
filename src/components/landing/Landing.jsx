import './landing.css';
import Navbar from './Navbar.jsx';
import Hero from './Hero.jsx';
import Nosotros from './Nosotros.jsx';
import Servicios from './Servicios.jsx';
import Niveles from './Niveles.jsx';
import Horarios from './Horarios.jsx';
import Footer from './Footer.jsx';
import useTituloPagina from '../../hooks/useTituloPagina';

export default function Landing() {
  useTituloPagina();
  return (
    <div className="pagina-landing">
      <Navbar />
      <Hero />
      <Nosotros />
      <Servicios />
      <Niveles />
      <Horarios />
      <Footer />
    </div>
  );
}