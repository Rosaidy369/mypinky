import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { isAtLeast18 } from "../lib/age";
import BirthDatePicker from "./ui/BirthDatePicker";
import VerifiedIcon from "./ui/VerifiedIcon";
import "../styles/SuspendedScreen.css";

function BirthDateGate() {
  const { t } = useTranslation();
  const { logout, refetchGates } = useAuth();
  const [birthDate, setBirthDate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAtLeast18(birthDate)) {
      setError(t("birthDateGate.errorUnderage"));
      return;
    }

    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ birth_date: birthDate })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      console.error("Error guardando fecha de nacimiento:", updateError.message);
      // 23514 = Postgres check_violation -- the server-side 18+ constraint
      // rejected it, same message as the client-side check above.
      setError(
        updateError.code === "23514"
          ? t("birthDateGate.errorUnderage")
          : t("birthDateGate.errorGeneric")
      );
      return;
    }

    await refetchGates();
  };

  return (
    <div className="suspended-page">

      <div className="suspended-card">

        <div className="suspended-icon"><VerifiedIcon size={36} /></div>

        <h1>{t("birthDateGate.title")}</h1>

        <p className="suspended-note">
          {t("birthDateGate.subtitle")}
        </p>

        <form className="birth-date-gate-form" onSubmit={handleSubmit}>

          <BirthDatePicker value={birthDate} onChange={setBirthDate} />

          {error && <p className="birth-date-gate-error">{error}</p>}

          <button type="submit" className="birth-date-gate-submit" disabled={saving || !birthDate}>
            {saving ? t("birthDateGate.submitting") : t("birthDateGate.submit")}
          </button>

        </form>

        <div className="suspended-actions">
          <button className="suspended-logout-btn" onClick={logout}>
            {t("suspended.logout")}
          </button>
        </div>

      </div>

    </div>
  );
}

export default BirthDateGate;
