import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { loadPaypalSdk } from "../lib/paypalSdk";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import SuccessCheck from "../components/ui/SuccessCheck";
import LockIcon from "../components/ui/LockIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import "../styles/Checkout.css";
import "../styles/BackButton.css";

const PLAN_INFO = {
  premium: {
    name: "Premium",
    icon: <PremiumDiamond size={32} />,
    prices: { monthly: 9.99, annual: 79.99 },
    planIds: {
      monthly: import.meta.env.VITE_PAYPAL_PLAN_ID_PREMIUM_MONTHLY,
      annual: import.meta.env.VITE_PAYPAL_PLAN_ID_PREMIUM_ANNUAL,
    },
  },
  vip: {
    name: "VIP",
    icon: null,
    prices: { monthly: 19.99, annual: 149.99 },
    planIds: {
      monthly: import.meta.env.VITE_PAYPAL_PLAN_ID_VIP_MONTHLY,
      annual: import.meta.env.VITE_PAYPAL_PLAN_ID_VIP_ANNUAL,
    },
  },
};

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS = 14; // ~20s -- el webhook suele llegar en 1-5s, esto deja margen amplio

// El webhook (BILLING.SUBSCRIPTION.ACTIVATED) es la unica fuente de
// verdad que activa el plan -- este polling solo espera a que ese
// resultado llegue, nunca lo decide por su cuenta. Se compara contra
// el subscriptionID real, no solo "profile.plan cambio", para no dar
// un falso positivo si el usuario ya tenia otro plan activo antes.
async function pollSubscriptionActivation(userId, subscriptionId) {
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const { data } = await supabase
      .from("profiles")
      .select("paypal_subscription_id")
      .eq("id", userId)
      .single();

    if (data?.paypal_subscription_id === subscriptionId) {
      return true;
    }
  }

  return false;
}

function Checkout() {
  const { t } = useTranslation();
  const { plan, cycle: rawCycle } = useParams();
  const navigate = useNavigate();

  const info = PLAN_INFO[plan] || PLAN_INFO.premium;
  const cycle = rawCycle === "annual" ? "annual" : "monthly";
  const price = info.prices[cycle];
  const planId = info.planIds[cycle];

  const [step, setStep] = useState("form");
  const [payError, setPayError] = useState("");
  const paypalContainerRef = useRef(null);

  useEffect(() => {
    if (step !== "form") return;

    let cancelled = false;

    loadPaypalSdk("subscription").then((paypal) => {
      if (cancelled || !paypalContainerRef.current) return;
      paypalContainerRef.current.innerHTML = "";

      paypal.Buttons({
        style: { layout: "vertical", color: "gold", label: "subscribe", height: 45 },

        createSubscription: async (data, actions) => {
          const { data: { user } } = await supabase.auth.getUser();
          return actions.subscription.create({
            plan_id: planId,
            custom_id: user.id,
          });
        },

        onApprove: async (data) => {
          setStep("processing");

          const { data: { user } } = await supabase.auth.getUser();
          const activated = await pollSubscriptionActivation(user.id, data.subscriptionID);
          setStep(activated ? "success" : "pending");
        },

        onError: (err) => {
          console.error("Error de PayPal:", err);
          setStep("form");
          setPayError(t("checkout.form.paypalError"));
        },
      }).render(paypalContainerRef.current);
    });

    return () => { cancelled = true; };
  }, [step, planId, t]);

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
                <p>
                  {cycle === "annual"
                    ? t("checkout.plan.priceNoteAnnual", { price })
                    : t("checkout.plan.priceNote", { price })}
                </p>
              </div>

            </div>

            <div className="checkout-form">

              {payError && <p className="checkout-error">{payError}</p>}

              <div ref={paypalContainerRef} className="paypal-buttons-container"></div>

              <p className="checkout-secure-note">
                <LockIcon size={12} /> {t("checkout.form.secureNote")}
              </p>
            </div>
          </>

        )}

        {step === "processing" && (

          <div className="checkout-processing">
            <div className="checkout-spinner"></div>
            <p>{t("checkout.form.processing")}</p>
          </div>

        )}

        {step === "pending" && (

          <div className="checkout-success">
            <div className="success-icon"><SuccessCheck /></div>
            <h2>{t("checkout.form.pendingTitle")}</h2>
            <p>{t("checkout.form.pendingBody")}</p>
            <button
              className="checkout-continue-btn"
              onClick={() => navigate("/dashboard")}
            >
              {t("checkout.plan.continueBtn")}
            </button>
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
