import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import profiles from "../../data/profiles";
import PremiumDiamond from "../ui/PremiumDiamond";
import "../../styles/FeaturedProfiles.css";

const featuredProfiles = profiles.slice(0, 3);

function FeaturedProfiles() {
  const { t } = useTranslation();

  return (
    <section className="featured">

      <h2>{t("home.featuredProfiles.title")}</h2>

      <p>
        {t("home.featuredProfiles.subtitle")}
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
                    <PremiumDiamond size={13} /> {t("home.featuredProfiles.premiumBadge")}
                  </span>
                )}

                {profile.online && (
                  <span className="featured-online-dot"></span>
                )}

              </div>

            </Link>

            <h3>{profile.name}</h3>

            <span>
              {t("home.featuredProfiles.ageCountry", { age: profile.age, country: profile.country })}
            </span>

            <Link
              to="/login"
              className="featured-button"
            >
              {t("home.featuredProfiles.viewProfile")}
            </Link>

          </div>

        ))}

      </div>

      <p className="featured-illustrative-note">
        {t("home.featuredProfiles.disclaimer")}
      </p>

    </section>
  );
}

export default FeaturedProfiles;