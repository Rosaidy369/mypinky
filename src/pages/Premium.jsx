import { useState } from "react";
import { Link } from "react-router-dom";
import VipDiamond from "../components/ui/VipDiamond";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/Premium.css";

const plans = [
  {
    name: "Gratis",
    icon: "🩶",
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlight: false,
    
      features: [
      { text: "Likes limitados", included: true },
      { text: "Ver perfiles destacados", included: true },
      { text: "Chat con matches", included: true },
      { text: "Ver quién te dio like", included: false },
      { text: "Likes ilimitados", included: false },
      { text: "Rebobinar swipe", included: false },
      { text: "Modo invisible", included: false },
    ],
  },

  {
    name: "Premium",
    icon: <PremiumDiamond size={38} />,
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    highlight: true,
    features: [
      { text: "Likes ilimitados", included: true },
      { text: "Buscar por país y ciudad", included: true },
      { text: "Ver quién te dio like", included: true },
      { text: "Rebobinar swipe", included: true },
      { text: "5 Super Likes al día", included: true },
      { text: "Sin anuncios", included: true },
      { text: "Modo invisible", included: false },
      { text: "Perfil destacado", included: false },
    ],
  },
  {
    name: "VIP",
    icon: null,
    monthlyPrice: 19.99,
    yearlyPrice: 149.99,
    highlight: false,
    features: [
      { text: "Todo lo de Premium", included: true },
      { text: "Modo invisible", included: true },
      { text: "Perfil destacado 1x semana", included: true },
      { text: "Super Likes ilimitados", included: true },
      { text: "Soporte prioritario", included: true },
      { text: "Insignia VIP en tu perfil", included: true },
      { text: "Ver lecturas de mensajes", included: true },
      { text: "🎙️ Nota de voz en tu perfil", included: true },
    ],
  },
];

function Premium() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="premium-page">

      <div className="premium-header">

        <span className="premium-eyebrow"><PremiumDiamond size={14} /> MyPinky Premium</span>

        <h1>Encuentra a tu persona, más rápido</h1>

        <p>
          Desbloquea todo el potencial de MyPinky y conecta sin límites.
        </p>

        <div className="billing-toggle">

          <span className={!yearly ? "active" : ""}>Mensual</span>

          <button
            className={`toggle-switch ${yearly ? "on" : ""}`}
            onClick={() => setYearly(!yearly)}
          >
            <span className="toggle-knob"></span>
          </button>

          <span className={yearly ? "active" : ""}>
            Anual <span className="save-badge">Ahorra 33%</span>
          </span>

        </div>

      </div>

      <div className="plans-grid">

        {plans.map((plan) => (

          <div
            key={plan.name}
            className={`plan-card ${plan.highlight ? "plan-highlight" : ""}`}
          >

            {plan.highlight && (
              <span className="plan-tag">Más popular</span>
            )}

            <div className="plan-icon">
              {plan.name === "VIP" ? <VipDiamond size={38} /> : plan.icon}
            </div>

            <h2>{plan.name}</h2>

            <div className="plan-price">

              {plan.monthlyPrice === 0 ? (
                <span className="price-amount">$0</span>
              ) : (
                <>
                  <span className="price-amount">
                    ${yearly ? (plan.yearlyPrice / 12).toFixed(2) : plan.monthlyPrice}
                  </span>
                  <span className="price-period">/mes</span>
                </>
              )}

            </div>

            {plan.monthlyPrice > 0 && yearly && (
              <p className="price-billed">
                Facturado ${plan.yearlyPrice}/año
              </p>
            )}

            <ul className="plan-features">

              {plan.features.map((feature, i) => (
                <li key={i} className={feature.included ? "" : "not-included"}>
                  <span className="feature-icon">
                    {feature.included ? "✓" : "✕"}
                  </span>
                  {feature.text}
                </li>
              ))}

            </ul>

            {plan.monthlyPrice === 0 ? (
              <button className="plan-btn" disabled>
                Tu plan actual
              </button>
            ) : (
              <Link
                to={`/checkout/${plan.name.toLowerCase()}`}
                className={`plan-btn ${plan.highlight ? "plan-btn-highlight" : ""}`}
              >
                Elegir {plan.name}
              </Link>
            )}

          </div>

        ))}

      </div>

      <div className="premium-faq">

        <h2>Preguntas frecuentes</h2>

        <div className="faq-item">
          <h3>¿Puedo cancelar cuando quiera?</h3>
          <p>Sí, puedes cancelar tu suscripción en cualquier momento desde tu perfil.</p>
        </div>

        <div className="faq-item">
          <h3>¿Cómo funcionan los Super Likes?</h3>
          <p>Un Super Like le muestra a esa persona que estás muy interesado/a, destacándote sobre los demás.</p>
        </div>

        <div className="faq-item">
          <h3>¿Qué es el modo invisible?</h3>
          <p>Te permite navegar y dar like sin que tu perfil aparezca en el Explorar de otras personas, hasta que tú les des like primero.</p>
        </div>

      </div>

    </div>
  );
}

export default Premium;