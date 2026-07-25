import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import SuccessCheck from "../components/ui/SuccessCheck";
import LockIcon from "../components/ui/LockIcon";
import "../styles/Checkout.css";
import "../styles/BackButton.css";

const PLAN_INFO = {
  premium: { name: "Premium", price: 9.99, icon: "💎" },
  vip: { name: "VIP", price: 19.99, icon: null },
};

function Checkout() {
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
        setPayError("No se pudo activar tu plan. Intenta de nuevo.");
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
                <h2>Plan {info.name}</h2>
                <p>${info.price}/mes · Cancela cuando quieras</p>
              </div>

            </div>

            <form className="checkout-form" onSubmit={handlePay}>

              <label className="field-label">Nombre en la tarjeta</label>
              <input
                type="text"
                placeholder="Como aparece en tu tarjeta"
                required
                value={cardData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />

              <label className="field-label">Número de tarjeta</label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                required
                maxLength={19}
                value={cardData.number}
                onChange={(e) => updateField("number", e.target.value)}
              />

              <div className="checkout-row">

                <div className="checkout-col">
                  <label className="field-label">Vencimiento</label>
                  <input
                    type="text"
                    placeholder="MM/AA"
                    required
                    maxLength={5}
                    value={cardData.expiry}
                    onChange={(e) => updateField("expiry", e.target.value)}
                  />
                </div>

                <div className="checkout-col">
                  <label className="field-label">CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    required
                    maxLength={3}
                    value={cardData.cvv}
                    onChange={(e) => updateField("cvv", e.target.value)}
                  />
                </div>

              </div>

              {payError && <p className="checkout-error">{payError}</p>}

              <button type="submit" className="checkout-pay-btn">
                Pagar ${info.price}
              </button>

              <p className="checkout-secure-note">
                <LockIcon size={12} /> Pago simulado, no se realiza ningún cargo real.
              </p>

            </form>
          </>

        )}

        {step === "processing" && (

          <div className="checkout-processing">
            <div className="checkout-spinner"></div>
            <p>Procesando tu pago...</p>
          </div>

        )}

        {step === "success" && (

          <div className="checkout-success">
            <div className="success-icon"><SuccessCheck /></div>
            <h2>¡Bienvenido a {info.name}!</h2>

            <p>Tu suscripción está activa. Disfruta de todos los beneficios.</p>

            <button
              className="checkout-continue-btn"
              onClick={() => navigate("/dashboard")}
            >
              Ir a la app
            </button>

          </div>

        )}

      </div>

    </div>
  );
}

export default Checkout;