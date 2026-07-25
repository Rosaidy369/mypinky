import { Link } from "react-router-dom";
import LockIcon from "../ui/LockIcon";
import MessageIcon from "../ui/MessageIcon";
import StarIcon from "../ui/StarIcon";
import HeartIcon from "../ui/HeartIcon";
import NoAdsIcon from "../ui/NoAdsIcon";
import PinIcon from "../ui/PinIcon";
import VerifiedIcon from "../ui/VerifiedIcon";
import PremiumDiamond from "../ui/PremiumDiamond";
import "../../styles/Hero.css";
import "../../styles/Swipe.css";

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

        <div className="phone">

          <div className="hero-swipe-card-frame" aria-hidden="true">
            <div className="swipe-card">
              <div
                className="swipe-card-image"
                style={{ backgroundImage: "url(https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80)" }}
              >

                <div className="swipe-top-row">

                  <span className="swipe-premium"><PremiumDiamond size={14} /> Premium</span>

                  <div className="swipe-top-right">
                    <span className="swipe-online" title="En línea"></span>
                    <span className="swipe-match">🔥 92% match</span>
                  </div>

                </div>

                <div className="swipe-card-overlay">

                  <div className="swipe-name-row">
                    <h2>Lauren, 23</h2>
                    <span className="swipe-distance">📍 3 km</span>
                  </div>

                  <p>Madrid</p>

                  <div className="swipe-bottom-row">
                    <div className="swipe-mood">💬 Amistad</div>
                  </div>

                </div>

              </div>
            </div>
          </div>

          <Link to="/login" className="hero-profile-btn">
            Ver perfil
          </Link>

        </div>

        <p className="hero-illustrative-note">
          Las imágenes mostradas son con fines ilustrativos y no representan usuarios reales de la plataforma.
        </p>

      </div>

    </section>
  );
}

export default Hero;