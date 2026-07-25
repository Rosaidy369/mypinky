import { Link } from "react-router-dom";
import HeartIcon from "../ui/HeartIcon";
import InstagramIcon from "../ui/InstagramIcon";
import TikTokIcon from "../ui/TikTokIcon";
import XIcon from "../ui/XIcon";
import FacebookIcon from "../ui/FacebookIcon";
import YouTubeIcon from "../ui/YouTubeIcon";
import PinterestIcon from "../ui/PinterestIcon";
import "../../styles/Footer.css";

const SOCIAL_LINKS = [
  { name: "Instagram", Icon: InstagramIcon },
  { name: "TikTok", Icon: TikTokIcon },
  { name: "X", Icon: XIcon },
  { name: "Facebook", Icon: FacebookIcon },
  { name: "YouTube", Icon: YouTubeIcon },
  { name: "Pinterest", Icon: PinterestIcon },
];

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

      <div className="footer-social">

        <p className="footer-social-title">Síguenos</p>

        <div className="footer-social-icons">
          {SOCIAL_LINKS.map(({ name, Icon }) => (
            <a href="#" className="social-icon-link" aria-label={name} key={name}>
              <Icon size={16} />
            </a>
          ))}
        </div>

      </div>

      <p>
        © 2026 MyPinky. Todos los derechos reservados.
      </p>

    </footer>
  );
}

export default Footer;