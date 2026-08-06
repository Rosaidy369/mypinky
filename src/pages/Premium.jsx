import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import VipDiamond from "../components/ui/VipDiamond";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/Premium.css";

// Display text (name, feature copy) lives in the locale files under
// premium.plans.<key>; only non-text data stays here, cross-referenced by
// `key`. `features[i].included` lines up positionally with the i-th entry
// of that plan's translated features array -- keep both in sync if a
// feature is added/removed/reordered.
const plans = [
  {
    key: "free",
    icon: "🩶",
    monthlyPrice: 0,
    yearlyPrice: 0,
    highlight: false,
    features: [
      { included: true },
      { included: true },
      { included: true },
      { included: false },
      { included: false },
      { included: false },
      { included: false },
    ],
  },
  {
    key: "premium",
    icon: <PremiumDiamond size={38} />,
    monthlyPrice: 9.99,
    yearlyPrice: 79.99,
    highlight: true,
    features: [
      { included: true },
      { included: true },
      { included: true },
      { included: true },
      { included: true },
      { included: true },
      { included: false },
      { included: false },
    ],
  },
  {
    key: "vip",
    icon: null,
    monthlyPrice: 19.99,
    yearlyPrice: 149.99,
    highlight: false,
    features: [
      { included: true },
      { included: true },
      { included: true },
      { included: true },
      { included: true },
      { included: true },
      { included: true },
      { included: true },
    ],
  },
];

function Premium() {
  const { t } = useTranslation();
  const [yearly, setYearly] = useState(false);
  const faqItems = t("premium.faq.items", { returnObjects: true });

  return (
    <div className="premium-page">

      <div className="premium-header">

        <span className="premium-eyebrow"><PremiumDiamond size={14} /> {t("premium.eyebrow")}</span>

        <h1>{t("premium.title")}</h1>

        <p>
          {t("premium.subtitle")}
        </p>

        <div className="billing-toggle">

          <span className={!yearly ? "active" : ""}>{t("premium.monthly")}</span>

          <button
            className={`toggle-switch ${yearly ? "on" : ""}`}
            onClick={() => setYearly(!yearly)}
          >
            <span className="toggle-knob"></span>
          </button>

          <span className={yearly ? "active" : ""}>
            {t("premium.yearly")} <span className="save-badge">{t("premium.saveBadge")}</span>
          </span>

        </div>

      </div>

      <div className="plans-grid">

        {plans.map((plan) => {
          const name = t(`premium.plans.${plan.key}.name`);
          const featureTexts = t(`premium.plans.${plan.key}.features`, { returnObjects: true });

          return (
            <div
              key={plan.key}
              className={`plan-card ${plan.highlight ? "plan-highlight" : ""}`}
            >

              {plan.highlight && (
                <span className="plan-tag">{t("premium.mostPopular")}</span>
              )}

              <div className="plan-icon">
                {plan.key === "vip" ? <VipDiamond size={38} /> : plan.icon}
              </div>

              <h2>{name}</h2>

              <div className="plan-price">

                {plan.monthlyPrice === 0 ? (
                  <span className="price-amount">$0</span>
                ) : (
                  <>
                    <span className="price-amount">
                      ${yearly ? (plan.yearlyPrice / 12).toFixed(2) : plan.monthlyPrice}
                    </span>
                    <span className="price-period">{t("premium.pricePerMonth")}</span>
                  </>
                )}

              </div>

              {plan.monthlyPrice > 0 && yearly && (
                <p className="price-billed">
                  {t("premium.billedYearly", { price: plan.yearlyPrice })}
                </p>
              )}

              <ul className="plan-features">

                {plan.features.map((feature, i) => (
                  <li key={i} className={feature.included ? "" : "not-included"}>
                    <span className="feature-icon">
                      {feature.included ? "✓" : "✕"}
                    </span>
                    {featureTexts[i]}
                  </li>
                ))}

              </ul>

              {plan.monthlyPrice === 0 ? (
                <button className="plan-btn" disabled>
                  {t("premium.currentPlan")}
                </button>
              ) : (
                <Link
                  to={`/checkout/${plan.key}`}
                  className={`plan-btn ${plan.highlight ? "plan-btn-highlight" : ""}`}
                >
                  {t("premium.choosePlan", { plan: name })}
                </Link>
              )}

            </div>
          );
        })}

      </div>

      <div className="premium-faq">

        <h2>{t("premium.faq.title")}</h2>

        {faqItems.map((item, i) => (
          <div className="faq-item" key={i}>
            <h3>{item.q}</h3>
            <p>{item.a}</p>
          </div>
        ))}

      </div>

    </div>
  );
}

export default Premium;
