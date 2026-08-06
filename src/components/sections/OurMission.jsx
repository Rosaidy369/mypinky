import { useTranslation } from "react-i18next";
import PersonIcon from "../ui/PersonIcon";
import QuoteIcon from "../ui/QuoteIcon";
import "../../styles/OurMission.css";

function OurMission() {
  const { t } = useTranslation();

  return (
    <section className="our-mission">

      <h2>{t("home.ourMission.title")}</h2>

      <div className="mission-letter">

        <span className="mission-quote-icon"><QuoteIcon size={46} /></span>

        <p className="mission-lede">
          {t("home.ourMission.lede")}
        </p>

        <p>
          {t("home.ourMission.body1")}
        </p>

        <p>
          {t("home.ourMission.body2")}
        </p>

        <p>
          {t("home.ourMission.body3")}
        </p>

        <div className="mission-signature">
          <span className="mission-avatar"><PersonIcon size={20} /></span>
          <span className="mission-signature-text">
            {t("home.ourMission.signature", { name: "Rosaidy Mercedes" })}
          </span>
        </div>

      </div>

    </section>
  );
}

export default OurMission;
