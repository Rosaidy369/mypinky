import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabaseClient";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import SuccessCheck from "../ui/SuccessCheck";

// `code` is what actually gets stored in reports.reason -- kept as the
// original Spanish text regardless of UI language, since the admin app
// reads this column and wasn't part of this i18n pass. Only the on-screen
// label is translated.
const REPORT_REASONS = [
  { code: "Perfil falso", labelKey: "report.reasons.fakeProfile" },
  { code: "Acoso", labelKey: "report.reasons.harassment" },
  { code: "Contenido inapropiado", labelKey: "report.reasons.inappropriateContent" },
  { code: "Spam", labelKey: "report.reasons.spam" },
];

function ReportModal({ profileId, reporterId, onClose }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useLockBodyScroll();

  const handleSubmit = async () => {
    if (!reason) {
      setError(t("report.errorReasonRequired"));
      return;
    }

    setSubmitting(true);
    setError("");

    const { error: insertError } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      reported_profile_id: profileId,
      reason,
      details: details.trim() || null,
    });

    if (insertError) {
      console.error("Error enviando reporte:", insertError.message);
      setError(t("report.errorGeneric"));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="delete-modal-backdrop" onClick={onClose}>
      <div className="delete-modal report-modal" onClick={(e) => e.stopPropagation()}>

        {submitted ? (
          <>
            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>{t("report.successTitle")}</h2>
            <p>{t("report.successBody")}</p>
            <button className="confirm-btn" onClick={onClose}>
              {t("report.understood")}
            </button>
          </>
        ) : (
          <>
            <h2>{t("report.title")}</h2>
            <p>{t("report.subtitle")}</p>

            <div className="report-reason-options">
              {REPORT_REASONS.map((option) => (
                <button
                  type="button"
                  key={option.code}
                  className={`report-reason-pill ${reason === option.code ? "selected" : ""}`}
                  onClick={() => {
                    setReason(option.code);
                    setError("");
                  }}
                >
                  {t(option.labelKey)}
                </button>
              ))}
            </div>

            <textarea
              className="report-details-input"
              placeholder={t("report.detailsPlaceholder")}
              rows={3}
              maxLength={500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            {error && <p className="report-error">{error}</p>}

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={onClose} disabled={submitting}>
                {t("report.cancel")}
              </button>
              <button className="confirm-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? t("report.sending") : t("report.submit")}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default ReportModal;
