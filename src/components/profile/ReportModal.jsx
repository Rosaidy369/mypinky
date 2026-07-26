import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import useLockBodyScroll from "../../hooks/useLockBodyScroll";
import SuccessCheck from "../ui/SuccessCheck";

const REPORT_REASONS = ["Perfil falso", "Acoso", "Contenido inapropiado", "Spam"];

function ReportModal({ profileId, reporterId, onClose }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useLockBodyScroll();

  const handleSubmit = async () => {
    if (!reason) {
      setError("Elige un motivo para continuar.");
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
      setError("No se pudo enviar el reporte. Intenta de nuevo.");
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
            <h2>Reporte enviado</h2>
            <p>Gracias por avisarnos. Lo vamos a revisar.</p>
            <button className="confirm-btn" onClick={onClose}>
              Entendido
            </button>
          </>
        ) : (
          <>
            <h2>Reportar perfil</h2>
            <p>Cuéntanos qué está pasando. Revisamos cada reporte manualmente.</p>

            <div className="report-reason-options">
              {REPORT_REASONS.map((option) => (
                <button
                  type="button"
                  key={option}
                  className={`report-reason-pill ${reason === option ? "selected" : ""}`}
                  onClick={() => {
                    setReason(option);
                    setError("");
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

            <textarea
              className="report-details-input"
              placeholder="Detalles adicionales (opcional)"
              rows={3}
              maxLength={500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />

            {error && <p className="report-error">{error}</p>}

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={onClose} disabled={submitting}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar reporte"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

export default ReportModal;
