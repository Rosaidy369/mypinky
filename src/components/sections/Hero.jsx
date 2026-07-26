import { Link } from "react-router-dom";
import LockIcon from "../ui/LockIcon";
import MessageIcon from "../ui/MessageIcon";
import StarIcon from "../ui/StarIcon";
import HeartIcon from "../ui/HeartIcon";
import NoAdsIcon from "../ui/NoAdsIcon";
import PinIcon from "../ui/PinIcon";
import VerifiedIcon from "../ui/VerifiedIcon";
import "../../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-left">

        <span className="badge">
          <HeartIcon size={14} className="badge-heart" /> Encuentra a alguien con quien realmente conectar
        </span>

        <h1>
          Conoce personas.
          <br />
          Habla.
          <br />
          Diviértete.
        </h1>

        <p>
          Descubre personas nuevas, inicia conversaciones auténticas
          y disfruta de una comunidad donde siempre hay alguien con
          quien hablar.
        </p>

        <div className="buttons">

          <Link to="/register" className="primary">
            Crear cuenta
          </Link>

          <Link to="/explore" className="secondary">
            Explorar perfiles
          </Link>

        </div>

        <div className="stats">

          <div className="stat-item">
            <span className="stat-icon"><NoAdsIcon size={20} /></span>
            <span className="stat-label">Sin anuncios</span>
          </div>

          <div className="stat-item">
            <span className="stat-icon"><PinIcon size={20} /></span>
            <span className="stat-label">Búsqueda por distancia gratis</span>
          </div>

          <div className="stat-item">
            <span className="stat-icon"><VerifiedIcon size={20} /></span>
            <span className="stat-label">Perfiles verificados</span>
          </div>

        </div>

      </div>

      <div className="hero-right">

        <div className="floating floating1">
          <LockIcon size={15} /> Nombre y edad verificados
        </div>

        <div className="floating floating2">
          <MessageIcon size={15} /> Conversaciones reales
        </div>

        <div className="floating floating3">
          <StarIcon size={15} /> Premium
        </div>

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