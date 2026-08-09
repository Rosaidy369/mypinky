import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PremiumDiamond from "../ui/PremiumDiamond";
import "../../styles/HouseAdBanner.css";

function pickRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

function HouseAdBanner({ variant = "grid" }) {
  const { t } = useTranslation();
  const messages = t("houseAd.messages", { returnObjects: true });
  const [message] = useState(() => pickRandomMessage(messages));

  return (
    <div className={`house-ad house-ad-${variant}`}>

      <div className="house-ad-icon"><PremiumDiamond size={30} /></div>

      <h3>{message.title}</h3>
      <p>{message.body}</p>

      <Link to="/premium" className="house-ad-btn">
        <PremiumDiamond size={14} /> {t("houseAd.ctaButton")}
      </Link>

    </div>
  );
}

export default HouseAdBanner;
