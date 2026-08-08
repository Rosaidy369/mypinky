import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabaseClient";
import { isPlanActive } from "../lib/plan";
import BackButton from "../components/ui/BackButton";
import VipDiamond from "../components/ui/VipDiamond";
import LockIcon from "../components/ui/LockIcon";
import BellIcon from "../components/ui/BellIcon";
import SuccessCheck from "../components/ui/SuccessCheck";
import CheckIcon from "../components/ui/CheckIcon";
import WarningIcon from "../components/ui/WarningIcon";
import GlobeIcon from "../components/ui/GlobeIcon";
import CardIcon from "../components/ui/CardIcon";
import PremiumDiamond from "../components/ui/PremiumDiamond";
import ShieldIcon from "../components/ui/ShieldIcon";
import MessageIcon from "../components/ui/MessageIcon";
import "../styles/Settings.css";
import "../styles/BackButton.css";

function Settings() {
  const { t, i18n } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [hasPassword, setHasPassword] = useState(true);
  const [linkedAccounts, setLinkedAccounts] = useState({ google: false, email: "" });
  const [showRemoveCardConfirm, setShowRemoveCardConfirm] = useState(false);
  const [cardRemovedSuccess, setCardRemovedSuccess] = useState(false);
  const cardRemoved = localStorage.getItem("mypinky_card_removed") === "true";
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const { logout, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoadingProfile(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    // Google/OAuth-only accounts never have a password on file, so the
    // delete-account confirmation can't ask for one — it would always
    // fail. "email" among the linked providers means a password exists.
    const providers = user.identities?.map((i) => i.provider) ?? [user.app_metadata?.provider];
    setHasPassword(providers.includes("email"));
    setLinkedAccounts({ google: providers.includes("google"), email: user.email || "" });

    const { data, error } = await supabase
      .from("profiles")
      .select("id, plan, plan_expires_at, plan_cancelled, is_invisible, notify_matches, notify_messages, notify_likes")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Error cargando configuración:", error.message);
    } else {
      setProfile(data);
    }

    setLoadingProfile(false);
  };

  const isPremium = isPlanActive(profile);
  const planName = profile?.plan;
  const isCancelled = !!profile?.plan_cancelled;
  const expiresAt = profile?.plan_expires_at ? new Date(profile.plan_expires_at).getTime() : 0;
  const daysLeft = Math.max(0, Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24)));

  // Writes straight off the session's user id instead of gating on
  // `profile` -- this page's own profile fetch can still be in flight when
  // someone touches the selector, and the previous `if (profile)` guard
  // made the save silently no-op in that window (i18n still switched
  // visually, so nothing looked wrong, but nothing was ever persisted).
  const changeLanguage = (value) => {
    i18n.changeLanguage(value);

    const userId = session?.user?.id;
    if (!userId) return;

    supabase
      .from("profiles")
      .update({ preferred_language: value })
      .eq("id", userId)
      .then(({ error }) => {
        if (error) console.error("Error guardando preferred_language:", error.message);
      });
  };

  // Discrete controls (pills, checkboxes) commit to Supabase right away.
  // Range sliders only update local state on drag and commit on release,
  // so dragging doesn't fire a write on every pixel of movement.
  const updateProfileField = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const commitProfileField = async (field, value) => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ [field]: value })
      .eq("id", profile.id);

    if (error) {
      console.error(`Error guardando ${field}:`, error.message);
    }
  };

  const handleDeactivate = () => {
    logout();
    navigate("/");
  };

  const handleRemoveCard = () => {
    localStorage.setItem("mypinky_card_removed", "true");
    setShowRemoveCardConfirm(false);
    setCardRemovedSuccess(true);
  };

  const handleCancelMembership = async () => {
    updateProfileField("plan_cancelled", true);
    await commitProfileField("plan_cancelled", true);
    setShowCancelConfirm(false);
    setCancelSuccess(true);
  };

  async function handleDeleteAccount() {
    setDeleteError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (hasPassword) {
      if (!deletePassword) {
        setDeleteError(t("settings.deleteModal.errorPasswordRequired"));
        return;
      }

      setDeletingAccount(true);

      // Reauthentication gate: proves whoever is at this device right now
      // still knows the password, so a shared/left-open session can't be
      // used to permanently delete the account.
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: deletePassword,
      });

      if (reauthError) {
        setDeletingAccount(false);
        setDeleteError(t("settings.deleteModal.errorWrongPassword"));
        return;
      }
    } else {
      // Accounts that only ever signed in with Google have no password to
      // check — the active OAuth session itself is the identity proof, so
      // the explicit "Sí, eliminar" click is the confirmation gate here.
      setDeletingAccount(true);
    }

    const { data: { session } } = await supabase.auth.getSession();

    const { data, error } = await supabase.functions.invoke("delete-account", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (error || data?.error) {
      setDeletingAccount(false);
      setDeleteError(t("settings.deleteModal.errorGeneric"));
      console.error(error?.message || data?.error);
      return;
    }

    setDeletingAccount(false);
    logout();
    navigate("/");
  }

  if (loadingProfile) {
    return <div style={{ padding: "140px", textAlign: "center" }}>{t("settings.loading")}</div>;
  }

  return (
    <div className="settings-page">

      <div className="settings-bg-decor">
        <span className="blob blob-1"></span>
        <span className="blob blob-2"></span>
      </div>

      <div className="settings-content">

        <BackButton />

        <h1>{t("settings.title")}</h1>
        <p className="settings-subtitle">{t("settings.subtitle")}</p>

        {/* ===== CUENTAS VINCULADAS ===== */}

        <div className="settings-section">

          <h2><ShieldIcon size={18} /> {t("settings.linkedAccounts.title")}</h2>

          <div className="settings-row">
            <span>{t("settings.linkedAccounts.google")}</span>
            <span className="settings-value">
              {linkedAccounts.google
                ? t("settings.linkedAccounts.connected", { email: linkedAccounts.email })
                : t("settings.linkedAccounts.notConnected")}
            </span>
          </div>

        </div>

        {/* ===== AYUDA Y SOPORTE ===== */}

        <div className="settings-section">

          <h2><MessageIcon size={18} /> {t("settings.help.title")}</h2>

          <Link to="/soporte" className="neutral-btn">
            {t("settings.help.cta")}
          </Link>

        </div>

        {/* ===== PRIVACIDAD ===== */}

        <div className="settings-section">

          <h2><LockIcon size={18} /> {t("settings.privacy.title")}</h2>

          <div className="settings-toggle-row">

            <div>
              <span className="toggle-title">{t("settings.privacy.invisibleMode")}</span>
              <p className="toggle-desc">{t("settings.privacy.invisibleModeDesc")}</p>
            </div>

            {isPremium ? (
              <label className="settings-toggle">
                <input
                  type="checkbox"
                  checked={!!profile?.is_invisible}
                  onChange={(e) => {
                    updateProfileField("is_invisible", e.target.checked);
                    commitProfileField("is_invisible", e.target.checked);
                  }}
                />
                <span className="settings-toggle-track"></span>
              </label>
            ) : (
              <button className="premium-lock-btn" onClick={() => navigate("/premium")}>
                <PremiumDiamond size={14} /> {t("settings.premium")}
              </button>
            )}

          </div>

        </div>

        {/* ===== NOTIFICACIONES ===== */}

        <div className="settings-section">

          <h2><BellIcon size={18} /> {t("settings.notifications.title")}</h2>

          <div className="settings-toggle-row">
            <span className="toggle-title">{t("settings.notifications.newMatches")}</span>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={profile?.notify_matches ?? true}
                onChange={(e) => {
                  updateProfileField("notify_matches", e.target.checked);
                  commitProfileField("notify_matches", e.target.checked);
                }}
              />
              <span className="settings-toggle-track"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <span className="toggle-title">{t("settings.notifications.newMessages")}</span>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={profile?.notify_messages ?? true}
                onChange={(e) => {
                  updateProfileField("notify_messages", e.target.checked);
                  commitProfileField("notify_messages", e.target.checked);
                }}
              />
              <span className="settings-toggle-track"></span>
            </label>
          </div>

          <div className="settings-toggle-row">
            <span className="toggle-title">{t("settings.notifications.someoneLikedYou")}</span>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={profile?.notify_likes ?? false}
                onChange={(e) => {
                  updateProfileField("notify_likes", e.target.checked);
                  commitProfileField("notify_likes", e.target.checked);
                }}
              />
              <span className="settings-toggle-track"></span>
            </label>
          </div>

        </div>

        {/* ===== IDIOMA ===== */}

        <div className="settings-section">

          <h2><GlobeIcon size={18} /> {t("settings.language.title")}</h2>

          <select
            className="settings-select"
            value={i18n.language}
            onChange={(e) => changeLanguage(e.target.value)}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>

        </div>

        {/* ===== SUSCRIPCIÓN Y PAGO ===== */}

        {isPremium && (

          <div className="settings-section">

            <h2><CardIcon size={18} /> {t("settings.subscription.title")}</h2>

            <p className="plan-status">
              {t("settings.subscription.currentPlanLabel")} <strong className="plan-status-inline">
                {planName === "vip" ? (
                  <>
                    <VipDiamond size={22} /> {t("settings.vip")}
                  </>
                ) : (
                  <>
                    <PremiumDiamond size={20} /> {t("settings.premium")}
                  </>
                )}
              </strong>
              {isCancelled ? (
                <span className="plan-cancelled-tag">
                  {t("settings.subscription.cancelledTag", { count: daysLeft })}
                </span>
              ) : (
                <span className="plan-active-tag">{t("settings.subscription.activeTag", { count: daysLeft })}</span>
              )}
            </p>

            {cardRemoved ? (
              <p className="card-removed-note">
                <CheckIcon size={14} /> {t("settings.subscription.noPaymentMethod")}
              </p>
            ) : (
              <button className="neutral-btn" onClick={() => setShowRemoveCardConfirm(true)}>
                {t("settings.subscription.removeCardButton")}
              </button>
            )}

            {!isCancelled && (
              <button className="neutral-btn" onClick={() => setShowCancelConfirm(true)}>
                {t("settings.subscription.cancelMembershipButton")}
              </button>
            )}

          </div>

        )}

        {/* ===== CUENTA ===== */}

        <div className="settings-section danger-section">

          <h2><WarningIcon size={18} /> {t("settings.account.title")}</h2>

          <button className="deactivate-btn" onClick={handleDeactivate}>
            {t("settings.account.logout")}
          </button>

          <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
            {t("settings.account.deleteAccount")}
          </button>

        </div>

      </div>

      {showDeleteConfirm && (
        <div
          className="delete-modal-backdrop"
          onClick={() => {
            setShowDeleteConfirm(false);
            setDeletePassword("");
            setDeleteError("");
          }}
        >
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <h2>{t("settings.deleteModal.title")}</h2>
            <p>{t("settings.deleteModal.body")}</p>

            {hasPassword && (
              <input
                type="password"
                className="settings-select"
                placeholder={t("settings.deleteModal.passwordPlaceholder")}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                autoComplete="current-password"
              />
            )}

            {deleteError && <p className="onboarding-error">{deleteError}</p>}

            <div className="delete-modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                  setDeleteError("");
                }}
              >
                {t("settings.deleteModal.cancel")}
              </button>
              <button className="confirm-delete-btn" onClick={handleDeleteAccount} disabled={deletingAccount}>
                {deletingAccount ? t("settings.deleteModal.confirming") : t("settings.deleteModal.confirm")}
              </button>
            </div>

          </div>
        </div>
      )}

      {showRemoveCardConfirm && (
        <div className="delete-modal-backdrop" onClick={() => setShowRemoveCardConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <h2>{t("settings.removeCardModal.title")}</h2>
            <p>{t("settings.removeCardModal.body")}</p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setShowRemoveCardConfirm(false)}>
                {t("settings.removeCardModal.cancel")}
              </button>
              <button className="confirm-btn" onClick={handleRemoveCard}>
                {t("settings.removeCardModal.confirm")}
              </button>
            </div>

          </div>
        </div>
      )}

      {cardRemovedSuccess && (
        <div className="delete-modal-backdrop" onClick={() => setCardRemovedSuccess(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>{t("settings.cardRemovedModal.title")}</h2>
            <p>{t("settings.cardRemovedModal.body")}</p>

            <button className="confirm-btn" onClick={() => setCardRemovedSuccess(false)}>
              {t("settings.cardRemovedModal.understood")}
            </button>

          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="delete-modal-backdrop" onClick={() => setShowCancelConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <h2>{t("settings.cancelModal.title")}</h2>
            <p>
              {t("settings.cancelModal.body", { plan: planName === "vip" ? t("settings.vip") : t("settings.premium"), count: daysLeft })}
            </p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setShowCancelConfirm(false)}>
                {t("settings.cancelModal.back")}
              </button>
              <button className="confirm-btn" onClick={handleCancelMembership}>
                {t("settings.cancelModal.confirm")}
              </button>
            </div>

          </div>
        </div>
      )}

      {cancelSuccess && (
        <div className="delete-modal-backdrop" onClick={() => setCancelSuccess(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>{t("settings.cancelSuccessModal.title")}</h2>
            <p>
              {t("settings.cancelSuccessModal.body", { count: daysLeft })}
            </p>

            <button className="confirm-btn" onClick={() => setCancelSuccess(false)}>
              {t("settings.cancelSuccessModal.understood")}
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;
