import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/CookieConsent.css";

const STORAGE_KEY = "mypinky_cookie_consent";

function loadStoredConsent() {
  return localStorage.getItem(STORAGE_KEY);
}

function CookieConsent() {
  const { t } = useTranslation();
  const [choice, setChoice] = useState(loadStoredConsent);

  // A returning visitor who already granted consent gets denied-by-default
  // again on every fresh page load (that's Consent Mode working as intended)
  // -- this restores their earlier choice instead of asking again.
  useEffect(() => {
    if (loadStoredConsent() === "granted" && typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "granted");
    setChoice("granted");

    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, "denied");
    setChoice("denied");
  };

  if (choice) return null;

  return (
    <div className="cookie-consent">
      <p>
        {t("cookieConsent.message")}
      </p>

      <div className="cookie-consent-actions">
        <button className="cookie-consent-reject" onClick={reject}>
          {t("cookieConsent.reject")}
        </button>
        <button className="cookie-consent-accept" onClick={accept}>
          {t("cookieConsent.accept")}
        </button>
      </div>
    </div>
  );
}

export default CookieConsent;
