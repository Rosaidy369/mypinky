import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabaseClient";
import { pickRandomPose } from "../data/verificationPoses";
import { loadPaypalSdk } from "../lib/paypalSdk";
import { pollPurchaseIntent } from "../lib/purchaseIntents";
import SelfieCapture from "../components/verification/SelfieCapture";
import SuccessCheck from "../components/ui/SuccessCheck";
import VerifiedIcon from "../components/ui/VerifiedIcon";
import "../styles/Checkout.css";
import "../styles/Verification.css";

const EXPRESS_PRICE = 3.99;

function verificationErrorMessage(t, reason) {
  switch (reason) {
    case "already_pending":
      return t("verification.errorAlreadyPending");
    case "already_verified":
      return t("verification.errorAlreadyVerified");
    default:
      return t("verification.errorGeneric");
  }
}

function VerifyAccount() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [pose] = useState(pickRandomPose);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [step, setStep] = useState("form"); // form -> processing -> success | pending
  const [wasExpress, setWasExpress] = useState(false);
  const [error, setError] = useState("");
  const [submittingFree, setSubmittingFree] = useState(false);

  const paypalContainerRef = useRef(null);
  const purchaseIntentIdRef = useRef(null);

  // Sube la selfie a un bucket PRIVADO (verification-photos) apenas se
  // captura, no hasta enviar -- asi el camino Express puede meter la
  // ruta en el metadata de la orden de PayPal antes de cobrar, igual
  // que el mensaje de Toque Especial.
  const uploadSelfie = async (blob) => {
    const { data: { user } } = await supabase.auth.getUser();
    const path = `${user.id}/selfie-${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("verification-photos")
      .upload(path, blob, { contentType: "image/jpeg" });

    if (uploadError) throw new Error(uploadError.message);

    return path;
  };

  const handleCapture = async (blob) => {
    if (!blob) {
      setPhotoBlob(null);
      return;
    }

    setError("");
    try {
      const path = await uploadSelfie(blob);
      setPhotoBlob(path);
    } catch (err) {
      console.error("Error subiendo selfie:", err.message);
      setError(t("verification.errorGeneric"));
    }
  };

  const handleSubmitFree = async () => {
    if (!photoBlob) {
      setError(t("verification.errorNoPhoto"));
      return;
    }

    setSubmittingFree(true);
    setError("");

    const { data, error: rpcError } = await supabase.rpc("submit_verification_request", {
      p_photo_url: photoBlob,
      p_pose_requested: pose,
    });

    setSubmittingFree(false);

    const result = Array.isArray(data) ? data[0] : data;

    if (rpcError || !result?.submitted) {
      setError(verificationErrorMessage(t, result?.reason));
      return;
    }

    setWasExpress(false);
    setStep("success");
  };

  // Los botones de PayPal para "priorizar" solo se renderizan una vez
  // que ya hay una selfie subida (photoBlob = la ruta en Storage).
  useEffect(() => {
    if (step !== "form" || !photoBlob) return;

    let cancelled = false;

    loadPaypalSdk("capture").then((paypal) => {
      if (cancelled || !paypalContainerRef.current) return;
      paypalContainerRef.current.innerHTML = "";

      paypal.Buttons({
        style: { layout: "vertical", color: "gold", label: "pay", height: 40 },

        createOrder: async () => {
          const { data: { session } } = await supabase.auth.getSession();

          const { data, error: fnError } = await supabase.functions.invoke("create-purchase-order", {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: {
              purchase_type: "verification_express",
              metadata: { photo_url: photoBlob, pose_requested: pose },
            },
          });

          if (fnError || !data?.orderID) {
            throw new Error(data?.error || fnError?.message || "order_creation_failed");
          }

          purchaseIntentIdRef.current = data.purchaseIntentId;
          return data.orderID;
        },

        onApprove: async (data) => {
          setStep("processing");

          const { data: { session } } = await supabase.auth.getSession();

          const { data: captureData, error: captureError } = await supabase.functions.invoke(
            "capture-purchase-order",
            {
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: { orderID: data.orderID },
            }
          );

          if (captureError || captureData?.error) {
            setStep("form");
            setError(t("verification.errorGeneric"));
            return;
          }

          const result = await pollPurchaseIntent(purchaseIntentIdRef.current);

          if (result.outcome === "fulfilled") {
            setWasExpress(true);
            setStep("success");
          } else if (result.outcome === "failed") {
            setStep("form");
            setError(verificationErrorMessage(t, result.reason));
          } else {
            setWasExpress(true);
            setStep("pending");
          }
        },

        onError: (err) => {
          console.error("Error de PayPal:", err);
          setStep("form");
          setError(t("checkout.form.paypalError"));
        },
      }).render(paypalContainerRef.current);
    });

    return () => { cancelled = true; };
  }, [step, photoBlob, pose, t]);

  return (
    <div className="checkout-page">

      <div className="checkout-card">

        {step === "form" && (

          <>
            <h2>{t("verification.title")}</h2>
            <p>{t("verification.subtitle")}</p>

            <div className="verification-pose-box">
              <p className="verification-pose-label">{t("verification.poseInstruction")}</p>
              <p className="verification-pose-text">{t(`verification.poses.${pose}`)}</p>
            </div>

            <SelfieCapture onCapture={handleCapture} />

            {error && <p className="checkout-error">{error}</p>}

            {photoBlob && (
              <div className="verification-actions">

                <button
                  type="button"
                  className="checkout-continue-btn"
                  onClick={handleSubmitFree}
                  disabled={submittingFree}
                >
                  {submittingFree ? t("verification.submitting") : t("verification.submitFree")}
                </button>

                <p className="verification-or">
                  {t("verification.submitExpress", { price: EXPRESS_PRICE })}
                </p>

                <div ref={paypalContainerRef} className="paypal-buttons-container"></div>

              </div>
            )}
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
            <button className="checkout-continue-btn" onClick={() => navigate("/swipe")}>
              {t("verification.continueBtn")}
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="checkout-success">
            <div className="success-icon"><VerifiedIcon size={44} /></div>
            <h2>{t("verification.successTitle")}</h2>
            <p>{wasExpress ? t("verification.successBodyExpress") : t("verification.successBody")}</p>
            <button className="checkout-continue-btn" onClick={() => navigate("/swipe")}>
              {t("verification.continueBtn")}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}

export default VerifyAccount;
