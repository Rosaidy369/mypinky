import { Link } from "react-router-dom";
import HeartIcon from "../ui/HeartIcon";
import "../../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">

      <div className="footer-logo">
        <span className="footer-heart"><HeartIcon size={26} /></span> MyPinky
      </div>

      <div className="footer-links">

        <Link to="/privacidad">Privacidad</Link>

        <Link to="/terminos">Términos</Link>

        <Link to="/soporte">Soporte</Link>

        <Link to="/contacto">Contacto</Link>

      </div>

      <p>
        © 2026 MyPinky. Todos los derechos reservados.
      </p>

    </footer>
  );
}

export default Footer;