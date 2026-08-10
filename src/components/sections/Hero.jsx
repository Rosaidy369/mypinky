import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HeartIcon from "../ui/HeartIcon";
import CompatibilityIcon from "../ui/CompatibilityIcon";
import PinIcon from "../ui/PinIcon";
import VerifiedIcon from "../ui/VerifiedIcon";
import "../../styles/Hero.css";

function Hero() {
  const { t } = useTranslation();

  return (
    <section className="hero">

      <div className="hero-left">

        <span className="badge">
          <HeartIcon size={14} className="badge-heart" /> {t("home.hero.badge")}
        </span>

        <h1>
          {t("home.hero.titleLine1")}
          <br />
          {t("home.hero.titleLine2")}
          <br />
          {t("home.hero.titleLine3")}
        </h1>

        <p>
          {t("home.hero.subtitle")}
        </p>

        <div className="buttons">

          <Link to="/register" className="primary">
            {t("home.hero.ctaRegister")}
          </Link>

          <Link to="/explore" className="secondary">
            {t("home.hero.ctaExplore")}
          </Link>

        </div>

        <div className="stats">

          <div className="stat-item">
            <span className="stat-icon"><CompatibilityIcon size={20} /></span>
            <span className="stat-label">{t("home.hero.statCompatibility")}</span>
          </div>

          <div className="stat-item">
            <span className="stat-icon"><PinIcon size={20} /></span>
            <span className="stat-label">{t("home.hero.statFreeDistance")}</span>
          </div>

          <div className="stat-item">
            <span className="stat-icon"><VerifiedIcon size={20} /></span>
            <span className="stat-label">{t("home.hero.statVerified")}</span>
          </div>

        </div>

      </div>

      <div className="hero-right">

        <div className="hero-illustration" aria-hidden="true">

          <svg viewBox="0 0 440 380" className="connection-svg">

            <defs>
              <linearGradient id="personAGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9dc3" />
                <stop offset="100%" stopColor="#ff3f87" />
              </linearGradient>
              <linearGradient id="personBGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#5b9df0" />
              </linearGradient>
              <linearGradient id="heroHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff9dc3" />
                <stop offset="100%" stopColor="#ff3f87" />
              </linearGradient>
            </defs>

            <ellipse cx="110" cy="280" rx="50" ry="78" fill="url(#personAGrad)" />
            <circle cx="110" cy="150" r="38" fill="url(#personAGrad)" />

            <ellipse cx="330" cy="280" rx="50" ry="78" fill="url(#personBGrad)" />
            <circle cx="330" cy="150" r="38" fill="url(#personBGrad)" />

            <g transform="translate(220,150)">
              <circle r="50" fill="#ffe4ef" opacity="0.55" className="heart-glow" />
              <g className="hero-heart-pulse">
                <path
                  transform="translate(-22,-20) scale(1.8)"
                  fill="url(#heroHeartGrad)"
                  d="M12 21s-7.5-4.9-10.2-9.3C.4 9.5 1 6.2 3.6 4.7c2.2-1.3 4.9-.7 6.4 1.3.6.8 1.3 1.9 2 3 .7-1.1 1.4-2.2 2-3 1.5-2 4.2-2.6 6.4-1.3 2.6 1.5 3.2 4.8 1.8 7-2.7 4.4-10.2 9.3-10.2 9.3z"
                />
              </g>
            </g>

            <g transform="translate(45,30) scale(1.8)">
              <g className="illustration-bubble bubble-a">
                <path d="M4 5h16v11H8l-4 4z" fill="white" />
                <circle cx="9" cy="10" r="1" fill="#ff3f87" />
                <circle cx="12" cy="10" r="1" fill="#ff3f87" />
                <circle cx="15" cy="10" r="1" fill="#ff3f87" />
              </g>
            </g>

            <g transform="translate(330,30) scale(1.8)">
              <g className="illustration-bubble bubble-b">
                <path d="M20 5H4v11h12l4 4z" fill="white" />
                <circle cx="9" cy="10" r="1" fill="#5b9df0" />
                <circle cx="12" cy="10" r="1" fill="#5b9df0" />
                <circle cx="15" cy="10" r="1" fill="#5b9df0" />
              </g>
            </g>

            <circle className="illustration-sparkle spark-1" cx="180" cy="90" r="4" fill="#fff" />
            <circle className="illustration-sparkle spark-2" cx="262" cy="98" r="3" fill="#fff" />
            <circle className="illustration-sparkle spark-3" cx="220" cy="235" r="3.5" fill="#ffd76a" />

          </svg>

        </div>

      </div>

    </section>
  );
}

export default Hero;