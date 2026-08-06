import { Link } from "react-router-dom";
import HeartIcon from "../ui/HeartIcon";
import InstagramIcon from "../ui/InstagramIcon";
import TikTokIcon from "../ui/TikTokIcon";
import XIcon from "../ui/XIcon";
import FacebookIcon from "../ui/FacebookIcon";
import "../../styles/Footer.css";

const SOCIAL_LINKS = [
  { name: "Instagram", Icon: InstagramIcon, url: "https://instagram.com/mypinky.app" },
  { name: "TikTok", Icon: TikTokIcon, url: "https://www.tiktok.com/@mypinky.app" },
  { name: "X", Icon: XIcon, url: "https://x.com/mypinkyapp" },
  { name: "Facebook", Icon: FacebookIcon, url: "https://www.facebook.com/mypinkyapp" },
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
          {SOCIAL_LINKS.map(({ name, Icon, url }) => (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-link"
              aria-label={name}
              key={name}
            >
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