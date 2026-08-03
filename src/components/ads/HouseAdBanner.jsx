import { useState } from "react";
import { Link } from "react-router-dom";
import PremiumDiamond from "../ui/PremiumDiamond";
import "../../styles/HouseAdBanner.css";

const MESSAGES = [
  { title: "Likes ilimitados te esperan", body: "Con Premium dejas de contar swipes y empiezas a conocer gente de verdad." },
  { title: "¿Quién te dio like?", body: "Descúbrelo al instante con Premium, sin esperar a que aparezcan en tu mazo." },
  { title: "Destaca sobre los demás", body: "Con VIP tu perfil se impulsa una vez por semana y aparece primero." },
];

function pickRandomMessage() {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

function HouseAdBanner({ variant = "grid" }) {
  const [message] = useState(pickRandomMessage);

  return (
    <div className={`house-ad house-ad-${variant}`}>

      <div className="house-ad-icon"><PremiumDiamond size={30} /></div>

      <h3>{message.title}</h3>
      <p>{message.body}</p>

      <Link to="/premium" className="house-ad-btn">
        <PremiumDiamond size={14} /> Ver planes
      </Link>

    </div>
  );
}

export default HouseAdBanner;
