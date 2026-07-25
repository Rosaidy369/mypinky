import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import BackButton from "../components/ui/BackButton";
import SuccessCheck from "../components/ui/SuccessCheck";
import LockIcon from "../components/ui/LockIcon";
import "../styles/Checkout.css";
import "../styles/BackButton.css";

const MESSAGE_PRICE = 2.99;

function PremiumMessageCheckout() {
  const { profileId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState("form");
  const [cardData, setCardData] = useState({ name: "", number: "", expiry: "", cvv: "" });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();
      setProfile(data || null);
      setLoading(false);
    };
    loadProfile();
  }, [profileId]);

  const [matchId, setMatchId] = useState(null);
  const [payError, setPayError] = useState("");

  const updateField = (field, value) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

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

      const { data: newMatch, error } = await supabase
        .from("matches")
        .insert({ user_id: user.id, matched_profile_id: profile.id, created_via: "premium_message" })
        .select()
        .single();

      if (!error) {
        setMatchId(newMatch.id);
        setStep("success");
        return;
      }

      // Unique constraint violation: a match with this person already exists.
      if (error.code === "23505") {
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .or(`and(user_id.eq.${user.id},matched_profile_id.eq.${profile.id}),and(user_id.eq.${profile.id},matched_profile_id.eq.${user.id})`)
          .maybeSingle();

        if (existingMatch) {
          // Someone paid to skip the match requirement, so still flag it as
          // a premium message even though a normal match beat it to it.
          await supabase
            .from("matches")
            .update({ created_via: "premium_message" })
            .eq("id", existingMatch.id);

          setMatchId(existingMatch.id);
          setStep("success");
          return;
        }
      }

      console.error("Error creando el match premium:", error.message);
      setPayError("No se pudo procesar el pago. Intenta de nuevo.");
      setStep("form");
    }, 1800);
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="checkout-page">
        <p>Perfil no encontrado.</p>
      </div>
    );
  }

  return (
    <div className="checkout-page">

      <div className="checkout-back-wrapper">
        <BackButton fallback={`/profile/${profile.id}`} />
      </div>

      <div className="checkout-card">

        {step === "form" && (

          <>
            <div className="checkout-summary">

              <img
                src={profile.photos?.[0] || "https://via.placeholder.com/100"}
                alt={profile.name}
                className="checkout-profile-avatar"
              />

              <div>
                <h2>Mensaje a {profile.name}</h2>
                <p>${MESSAGE_PRICE} · Pago único, sin suscripción</p>
              </div>

            </div>

            <form className="checkout-form" onSubmit={handlePay}>

              <label className="field-label">Nombre en la tarjeta</label>
              <input
                type="text"
                required
                value={cardData.name}
                onChange={(e) => updateField("name", e.target.value)}
              />

              <label className="field-label">Número de tarjeta</label>
              <input
                type="text"
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
                    required
                    maxLength={3}
                    value={cardData.cvv}
                    onChange={(e) => updateField("cvv", e.target.value)}
                  />
                </div>

              </div>

              {payError && <p className="checkout-error">{payError}</p>}

              <button type="submit" className="checkout-pay-btn">
                Pagar ${MESSAGE_PRICE}
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
            <h2>¡Listo!</h2>
            <p>Ya puedes enviarle un mensaje directo a {profile.name}.</p>
            <button
              className="checkout-continue-btn"
              onClick={() => navigate(`/chat/${matchId}`)}
            >
              Ir al chat
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default PremiumMessageCheckout;