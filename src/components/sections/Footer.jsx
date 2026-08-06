import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

  return (
    <footer className="footer">

      <div className="footer-logo">
        <span className="footer-heart"><HeartIcon size={26} /></span> MyPinky
      </div>

      <div className="footer-links">

        <Link to="/privacidad">{t("footer.privacy")}</Link>

        <Link to="/terminos">{t("footer.terms")}</Link>

        <Link to="/soporte">{t("footer.support")}</Link>

        <Link to="/contacto">{t("footer.contact")}</Link>

      </div>

      <div className="footer-social">

        <p className="footer-social-title">{t("footer.followUs")}</p>

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
        {t("footer.copyright", { year: new Date().getFullYear() })}
      </p>

    </footer>
  );
}

export default Footer;
