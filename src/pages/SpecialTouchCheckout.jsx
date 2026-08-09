import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { sharedInterestCount } from "../lib/profileLabels";
import BackButton from "../components/ui/BackButton";
import SuccessCheck from "../components/ui/SuccessCheck";
import LockIcon from "../components/ui/LockIcon";
import SpecialTouchHeart from "../components/ui/SpecialTouchHeart";
import "../styles/Checkout.css";
import "../styles/BackButton.css";
import "../styles/Swipe.css";

const TOUCH_PRICE = 2.99;
const MESSAGE_MAX_LENGTH = 350;
const WEEKLY_LIMIT = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function specialTouchErrorMessage(t, reason) {
  switch (reason) {
    case "already_matched":
      return t("checkout.specialTouch.errorAlreadyMatched");
    case "already_pending":
      return t("checkout.specialTouch.errorAlreadyPending");
    case "weekly_limit":
      return t("checkout.specialTouch.errorWeeklyLimit");
    case "invalid_message_length":
      return t("checkout.specialTouch.errorInvalidMessage");
    default:
      return t("checkout.specialTouch.errorGeneric");
  }
}

function SpecialTouchCheckout() {
  const { t, i18n } = useTranslation();
  const { profileId } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [myInterests, setMyInterests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [weeklyUsed, setWeeklyUsed] = useState(0);
  const [nextOpensAt, setNextOpensAt] = useState(null);

  const [step, setStep] = useState("form");
  const [message, setMessage] = useState("");
  const [cardData, setCardData] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [payError, setPayError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const weekAgo = new Date(Date.now() - WEEK_MS).toISOString();

      const [{ data: myProfile }, { data: profileData }, { data: recentTouches }] = await Promise.all([
        supabase.from("profiles").select("interests").eq("id", user.id).single(),
        supabase.from("profiles").select("*").eq("id", profileId).single(),
        supabase
          .from("special_touches")
          .select("created_at")
          .eq("sender_id", user.id)
          .gt("created_at", weekAgo)
          .order("created_at", { ascending: true }),
      ]);

      setMyInterests(myProfile?.interests || []);
      setProfile(profileData || null);
      setNotFound(!profileData);

      const touches = recentTouches || [];
      setWeeklyUsed(touches.length);
      if (touches.length >= WEEKLY_LIMIT) {
        setNextOpensAt(new Date(new Date(touches[0].created_at).getTime() + WEEK_MS));
      }

      setLoading(false);
    };

    loadData();
  }, [profileId, navigate]);

  const updateField = (field, value) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
  };

  const weeklyLimitReached = weeklyUsed >= WEEKLY_LIMIT;
  const sharedCount = profile ? sharedInterestCount(profile.interests || [], myInterests) : 0;

  const handlePay = (e) => {
    e.preventDefault();

    const trimmed = message.trim();
    if (trimmed.length < 1 || trimmed.length > MESSAGE_MAX_LENGTH) {
      setPayError(t("checkout.specialTouch.errorInvalidMessage"));
      return;
    }

    setStep("processing");
    setPayError("");

    setTimeout(async () => {
      const { data, error } = await supabase.rpc("send_special_touch", {
        p_recipient_id: profile.id,
        p_message: trimmed,
      });

      const result = Array.isArray(data) ? data[0] : data;

      if (error || !result?.sent) {
        if (error) console.error("Error enviando Toque Especial:", error.message);
        setPayError(specialTouchErrorMessage(t, result?.reason));
        setStep("form");
        return;
      }

      setStep("success");
    }, 1800);
  };

  if (loading) {
    return (
      <div className="checkout-page">
        <p>{t("checkout.specialTouch.loading")}</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="checkout-page">
        <p>{t("checkout.specialTouch.notFound")}</p>
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
                <h2>{t("checkout.specialTouch.title", { name: profile.name })}</h2>
                <p>{t("checkout.specialTouch.priceNote", { price: TOUCH_PRICE })}</p>
                {sharedCount > 0 && (
                  <p className="special-touch-checkout-shared">
                    ✨ {t("swipe.detail.sharedInterests", { count: sharedCount })}
                  </p>
                )}
              </div>

            </div>

            {weeklyLimitReached ? (

              <div className="special-touch-blocked">
                <SpecialTouchHeart size={28} />
                <h3>{t("checkout.specialTouch.blockedTitle")}</h3>
                <p>
                  {nextOpensAt
                    ? t("checkout.specialTouch.blockedBody", {
                        date: nextOpensAt.toLocaleDateString(i18n.language, { day: "numeric", month: "long" }),
                      })
                    : null}
                </p>
              </div>

            ) : (

              <>
                <div className="special-touch-preview">
                  <p className="special-touch-preview-label">{t("checkout.specialTouch.previewHeading")}</p>
                  <div
                    className="special-touch-preview-card"
                    style={{ backgroundImage: `url(${profile.photos?.[0] || "https://via.placeholder.com/300"})` }}
                  >
                    <span className="pinky-ribbon special-touch-ribbon">
                      <SpecialTouchHeart size={13} /> {t("swipe.card.specialTouchRibbon")}
                    </span>
                    <div className="special-touch-bubble">
                      <p>{message.trim() || t("checkout.specialTouch.messagePlaceholder")}</p>
                    </div>
                  </div>
                </div>

                <form className="checkout-form" onSubmit={handlePay}>

                  <label className="field-label">{t("checkout.specialTouch.messageLabel")}</label>
                  <textarea
                    rows={4}
                    maxLength={MESSAGE_MAX_LENGTH}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("checkout.specialTouch.messagePlaceholder")}
                  />
                  <p className="special-touch-counter">
                    {t("checkout.specialTouch.messageCounter", { count: message.length, max: MESSAGE_MAX_LENGTH })}
                  </p>

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

                  <p className="special-touch-weekly-note">
                    {t("checkout.specialTouch.weeklyUsage", { used: weeklyUsed, total: WEEKLY_LIMIT })}
                  </p>

                  {payError && <p className="checkout-error">{payError}</p>}

                  <button type="submit" className="checkout-pay-btn">
                    {t("checkout.form.payButton", { price: TOUCH_PRICE })}
                  </button>

                  <p className="checkout-secure-note">
                    <LockIcon size={12} /> {t("checkout.form.secureNote")}
                  </p>

                  <p className="special-touch-no-refund">
                    {t("checkout.specialTouch.noRefundNote")}
                  </p>

                </form>
              </>

            )}
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
            <h2>{t("checkout.specialTouch.successTitle")}</h2>
            <p>{t("checkout.specialTouch.successBody")}</p>
            <button
              className="checkout-continue-btn"
              onClick={() => navigate("/swipe")}
            >
              {t("checkout.specialTouch.continueBtn")}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default SpecialTouchCheckout;
