import { Link } from "react-router-dom";
import profiles from "../../data/profiles";
import "../../styles/FeaturedProfiles.css";

const featuredProfiles = profiles.slice(0, 3);

function FeaturedProfiles() {
  return (
    <section className="featured">

      <h2>Perfiles destacados</h2>

      <p>
        Descubre personas listas para conversar.
      </p>

      <div className="profiles">

        {featuredProfiles.map((profile) => (

          <div className="profile-card" key={profile.id}>

            <Link to="/login">

              <div className="featured-image">

                <img
                  src={profile.image}
                  alt={profile.name}
                />

                {profile.premium && (
                  <span className="featured-premium-badge">
                    💎 Premium
                  </span>
                )}

                {profile.online && (
                  <span className="featured-online-dot"></span>
                )}

              </div>

            </Link>

            <h3>{profile.name}</h3>

            <span>
              {profile.age} años • {profile.country}
            </span>

            <Link
              to="/login"
              className="featured-button"
            >
              Ver perfil
            </Link>

          </div>

        ))}

      </div>

    </section>
  );
}

export default FeaturedProfiles;