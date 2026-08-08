import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Legal.css";

function Support() {
  const { t } = useTranslation();
  const faqs = t("support.faqs", { returnObjects: true });

  return (
    <div className="legal-page">

      <div className="legal-content">

        <h1>{t("support.title")}</h1>
        <p className="legal-updated">{t("support.subtitle")}</p>

        <div className="support-faqs">

          {faqs.map((item, i) => (
            <div className="support-faq-item" key={i}>
              <h3>{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}

        </div>

        <div className="support-cta">
          <p>{t("support.noAnswerText")}</p>
          <Link to="/contacto" className="support-cta-btn">
            {t("support.contactCta")}
          </Link>
        </div>

      </div>

    </div>
  );
}

export default Support;
