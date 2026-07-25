import { Link } from "react-router-dom";
import "../../styles/Hero.css";

function Hero() {
  return (
    <section className="hero">

      <div className="hero-left">

        <span className="badge">
          ❤️ Encuentra a alguien con quien realmente conectar
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
            <span className="stat-icon">🚫</span>
            <span className="stat-label">Sin anuncios</span>
          </div>

          <div className="stat-item">
            <span className="stat-icon">📍</span>
            <span className="stat-label">Búsqueda por distancia gratis</span>
          </div>

          <div className="stat-item">
            <span className="stat-icon">✅</span>
            <span className="stat-label">Perfiles verificados</span>
          </div>

        </div>

      </div>

      <div className="hero-right">

        <div className="floating floating1">
          🔒 Nombre y edad verificados
        </div>

        <div className="floating floating2">
          💬 Conversaciones reales
        </div>

        <div className="floating floating3">
          ⭐ Premium
        </div>

        <div className="phone">

          <div className="card">

            <img
              className="avatar"
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80"
              alt="Lauren"
            />

            <span className="online">
              🟢 En línea
            </span>

            <h3>Lauren</h3>

            <p>23 años • Madrid</p>

            <div className="tags">

              <span>💬 Amistad</span>

              <span>🎵 Música</span>

              <span>☕ Café</span>

            </div>

            <Link to="/login" className="hero-profile-btn">
              Ver perfil
            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}

export default Hero;