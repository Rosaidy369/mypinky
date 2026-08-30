import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabaseClient";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import { loadPaypalSdk } from "../../lib/paypalSdk";
import { pollPurchaseIntent } from "../../lib/purchaseIntents";
import SuccessCheck from "../ui/SuccessCheck";
import BoostIcon from "../ui/BoostIcon";

const BOOST_PRICE = 1.99;

function BoostPurchaseModal({ onClose, onFulfilled }) {
  const { t } = useTranslation();
  useLockBodyScroll();

  // step: form -> processing (esperando captura+webhook) -> success | pending
  const [step, setStep] = useState("form");
  const [error, setError] = useState("");
  const paypalContainerRef = useRef(null);
  const purchaseIntentIdRef = useRef(null);

  useEffect(() => {
    if (step !== "form") return;

    let cancelled = false;

    loadPaypalSdk("capture").then((paypal) => {
      if (cancelled || !paypalContainerRef.current) return;
      paypalContainerRef.current.innerHTML = "";

      paypal.Buttons({
        style: { layout: "vertical", color: "gold", label: "pay", height: 45 },

        createOrder: async () => {
          const { data: { session } } = await supabase.auth.getSession();

          const { data, error: fnError } = await supabase.functions.invoke("create-purchase-order", {
            headers: { Authorization: `Bearer ${session.access_token}` },
            body: { purchase_type: "boost" },
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
            setError(t("myProfile.boost.buyError"));
            return;
          }

          const result = await pollPurchaseIntent(purchaseIntentIdRef.current);

          if (result.outcome === "fulfilled") {
            setStep("success");
            onFulfilled?.();
          } else if (result.outcome === "failed") {
            setStep("form");
            setError(t("myProfile.boost.buyError"));
          } else {
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
  }, [step, t, onFulfilled]);

  return (
    <div className="delete-modal-backdrop" onClick={step === "form" ? onClose : undefined}>
      <div className="delete-modal boost-modal" onClick={(e) => e.stopPropagation()}>

        {step === "form" && (
          <>
            <div className="boost-modal-icon"><BoostIcon size={32} /></div>
            <h2>{t("myProfile.boost.buyTitle")}</h2>
            <p>{t("myProfile.boost.buySubtitle", { price: BOOST_PRICE })}</p>

            {error && <p className="report-error">{error}</p>}

            <div ref={paypalContainerRef} className="paypal-buttons-container"></div>

            <button className="cancel-btn" onClick={onClose}>
              {t("myProfile.boost.cancel")}
            </button>
          </>
        )}

        {step === "processing" && (
          <div className="checkout-processing">
            <div className="checkout-spinner"></div>
            <p>{t("checkout.form.processing")}</p>
          </div>
        )}

        {step === "success" && (
          <>
            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>{t("myProfile.boost.buySuccessTitle")}</h2>
            <p>{t("myProfile.boost.buySuccessBody")}</p>
            <button className="confirm-btn" onClick={onClose}>
              {t("myProfile.boost.understood")}
            </button>
          </>
        )}

        {step === "pending" && (
          <>
            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>{t("checkout.form.pendingTitle")}</h2>
            <p>{t("checkout.form.pendingBody")}</p>
            <button className="confirm-btn" onClick={onClose}>
              {t("myProfile.boost.understood")}
            </button>
          </>
        )}

      </div>
    </div>
  );
}

export default BoostPurchaseModal;
