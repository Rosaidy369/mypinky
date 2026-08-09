import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import SuccessCheck from "../components/ui/SuccessCheck";
import LockIcon from "../components/ui/LockIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/Checkout.css";
import "../styles/BackButton.css";

const PLAN_INFO = {
  premium: { name: "Premium", price: 9.99, icon: <PremiumDiamond size={32} /> },
  vip: { name: "VIP", price: 19.99, icon: null },
};

function Checkout() {
  const { t } = useTranslation();
  const { plan } = useParams();
  const navigate = useNavigate();
  const info = PLAN_INFO[plan] || PLAN_INFO.premium;

  const [step, setStep] = useState("form");
  const [cardData, setCardData] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });

  const updateField = (field, value) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const [payError, setPayError] = useState("");

  const handlePay = (e) => {
    e.preventDefault();
    setStep("processing");
    setPayError("");

    setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días

      const { error } = await supabase
        .from("profiles")
        .update({
          plan,
          plan_expires_at: expiresAt.toISOString(),
          plan_cancelled: false,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error activando el plan:", error.message);
        setPayError(t("checkout.plan.payError"));
        setStep("form");
        return;
      }

      setStep("success");
    }, 1800);
  };

  return (
    <div className="checkout-page">

      <BackButton fallback="/premium" />

      <div className="checkout-card">

        {step === "form" && (

          <>
            <div className="checkout-summary">

              <span className="checkout-icon">
                {plan === "vip" ? <VipDiamond size={32} /> : info.icon}
              </span>

              <div>
                <h2>{t("checkout.plan.title", { name: info.name })}</h2>
                <p>{t("checkout.plan.priceNote", { price: info.price })}</p>
              </div>

            </div>

            <form className="checkout-form" onSubmit={handlePay}>

              <label className="field-label">{t("checkout.form.nameLabel")}</label>
              <input
                type="text"
                placeholder={t("checkout.form.namePlaceholder")}
                required
                value={cardData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />

              <label className="field-label">{t("checkout.form.numberLabel")}</label>
              <input
                type="text"
                placeholder={t("checkout.form.numberPlaceholder")}
                required
                maxLength={19}
                value={cardData.number}
                onChange={(e) => updateField("number", e.target.value)}
              />

              <div className="checkout-row">

                <div className="checkout-col">
                  <label className="field-label">{t("checkout.form.expiryLabel")}</label>
                  <input
                    type="text"
                    placeholder={t("checkout.form.expiryPlaceholder")}
                    required
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) => updateField("expiry", e.target.value)}
                  />
                </div>

                <div className="checkout-col">
                  <label className="field-label">{t("checkout.form.cvvLabel")}</label>
                  <input
                    type="text"
                    placeholder={t("checkout.form.cvvPlaceholder")}
                    required
                    maxLength={3}
                    value={cardData.cvv}
                    onChange={(e) => updateField("cvv", e.target.value)}
                  />
                </div>

              </div>

              {payError && <p className="checkout-error">{payError}</p>}

              <button type="submit" className="checkout-pay-btn">
                {t("checkout.form.payButton", { price: info.price })}
              </button>

              <p className="checkout-secure-note">
                <LockIcon size={12} /> {t("checkout.form.secureNote")}
              </p>

            </form>
          </>

        )}

        {step === "processing" && (

          <div className="checkout-processing">
            <div className="checkout-spinner"></div>
            <p>{t("checkout.form.processing")}</p>
          </div>

        )}

        {step === "success" && (

          <div className="checkout-success">
            <div className="success-icon"><SuccessCheck /></div>
            <h2>{t("checkout.plan.successTitle", { name: info.name })}</h2>

            <p>{t("checkout.plan.successBody")}</p>

            <button
              className="checkout-continue-btn"
              onClick={() => navigate("/dashboard")}
            >
              {t("checkout.plan.continueBtn")}
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

export default Checkout;