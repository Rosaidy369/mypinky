import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import "../styles/Settings.css";
import "../styles/BackButton.css";

function Settings() {
  const { i18n } = useTranslation();

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [hasPassword, setHasPassword] = useState(true);
  const [showRemoveCardConfirm, setShowRemoveCardConfirm] = useState(false);
  const [cardRemovedSuccess, setCardRemovedSuccess] = useState(false);
  const cardRemoved = localStorage.getItem("mypinky_card_removed") === "true";
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const { logout } = useAuth();
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

    const { data, error } = await supabase
      .from("profiles")
      .select("id, plan, plan_expires_at, plan_cancelled, is_invisible, search_gender, age_min, age_max, default_distance, notify_matches, notify_messages, notify_likes")
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

  const changeLanguage = (value) => {
    i18n.changeLanguage(value);
    if (profile) commitProfileField("preferred_language", value);
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
        setDeleteError("Ingresa tu contraseña para confirmar.");
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
        setDeleteError("Contraseña incorrecta.");
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
      setDeleteError("No se pudo eliminar tu cuenta. Intenta de nuevo.");
      console.error(error?.message || data?.error);
      return;
    }

    setDeletingAccount(false);
    logout();
    navigate("/");
  }

  if (loadingProfile) {
    return <div style={{ padding: "140px", textAlign: "center" }}>Cargando configuración...</div>;
  }

  return (
    <div className="settings-page">

      <div className="settings-bg-decor">
        <span className="blob blob-1"></span>
        <span className="blob blob-2"></span>
      </div>

      <div className="settings-content">

        <BackButton />

        <h1>Configuración</h1>
        <p className="settings-subtitle">Personaliza tu experiencia en MyPinky</p>

        {/* ===== PREFERENCIAS DE BÚSQUEDA ===== */}

        <div className="settings-section">

          <h2>Preferencias de búsqueda</h2>

          <div className="settings-row">

            <span>Mostrar</span>

            <div className="settings-pills">
              {["Todos", "Mujer", "Hombre"].map((option) => (
                <button
                  key={option}
                  className={`settings-pill ${profile?.search_gender === option ? "selected" : ""}`}
                  onClick={() => {
                    updateProfileField("search_gender", option);
                    commitProfileField("search_gender", option);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>

          </div>

          <div className="settings-row">
            <span>Rango de edad</span>
            <span className="settings-value">{profile?.age_min} - {profile?.age_max} años</span>
          </div>

          <input
            type="range"
            min="18"
            max="90"
            value={profile?.age_min ?? 18}
            onChange={(e) => updateProfileField("age_min", Number(e.target.value))}
            onMouseUp={(e) => commitProfileField("age_min", Number(e.target.value))}
            onTouchEnd={(e) => commitProfileField("age_min", Number(e.target.value))}
            className="settings-slider"
          />

          <input
            type="range"
            min="18"
            max="90"
            value={profile?.age_max ?? 45}
            onChange={(e) => updateProfileField("age_max", Number(e.target.value))}
            onMouseUp={(e) => commitProfileField("age_max", Number(e.target.value))}
            onTouchEnd={(e) => commitProfileField("age_max", Number(e.target.value))}
            className="settings-slider"
          />

          <div className="settings-row">
            <span>Distancia por defecto</span>
            <span className="settings-value">{profile?.default_distance} km</span>
          </div>

          <input
            type="range"
            min="1"
            max="100"
            value={profile?.default_distance ?? 50}
            onChange={(e) => updateProfileField("default_distance", Number(e.target.value))}
            onMouseUp={(e) => commitProfileField("default_distance", Number(e.target.value))}
            onTouchEnd={(e) => commitProfileField("default_distance", Number(e.target.value))}
            className="settings-slider"
          />

        </div>

        {/* ===== PRIVACIDAD ===== */}

        <div className="settings-section">

          <h2><LockIcon size={18} /> Privacidad</h2>

          <div className="settings-toggle-row">

            <div>
              <span className="toggle-title">Modo invisible</span>
              <p className="toggle-desc">Navega sin aparecer en Explorar hasta que des like</p>
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
                <PremiumDiamond size={14} /> Premium
              </button>
            )}

          </div>

        </div>

        {/* ===== NOTIFICACIONES ===== */}

        <div className="settings-section">

          <h2><BellIcon size={18} /> Notificaciones</h2>

          <div className="settings-toggle-row">
            <span className="toggle-title">Nuevos matches</span>
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
            <span className="toggle-title">Mensajes nuevos</span>
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
            <span className="toggle-title">Alguien te dio like</span>
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

          <h2><GlobeIcon size={18} /> Idioma</h2>

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

            <h2><CardIcon size={18} /> Suscripción y pago</h2>

            <p className="plan-status">
              Plan actual: <strong className="plan-status-inline">
                {planName === "vip" ? (
                  <>
                    <VipDiamond size={22} /> VIP
                  </>
                ) : (
                  <>
                    <PremiumDiamond size={20} /> Premium
                  </>
                )}
              </strong>
              {isCancelled ? (
                <span className="plan-cancelled-tag">
                  Cancelado · activo {daysLeft} {daysLeft === 1 ? "día" : "días"} más
                </span>
              ) : (
                <span className="plan-active-tag">Renovación en {daysLeft} días</span>
              )}
            </p>

            {cardRemoved ? (
              <p className="card-removed-note">
                <CheckIcon size={14} /> No tienes ningún método de pago guardado.
              </p>
            ) : (
              <button className="neutral-btn" onClick={() => setShowRemoveCardConfirm(true)}>
                Eliminar método de pago
              </button>
            )}

            {!isCancelled && (
              <button className="neutral-btn" onClick={() => setShowCancelConfirm(true)}>
                Cancelar membresía
              </button>
            )}

          </div>

        )}

        {/* ===== CUENTA ===== */}

        <div className="settings-section danger-section">

          <h2><WarningIcon size={18} /> Cuenta</h2>

          <button className="deactivate-btn" onClick={handleDeactivate}>
            Cerrar sesión
          </button>

          <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
            Eliminar mi cuenta
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

            <h2>¿Eliminar tu cuenta?</h2>
            <p>Esta acción es permanente: se borrarán tu perfil, matches, mensajes y toda tu información. No se puede deshacer.</p>

            {hasPassword && (
              <input
                type="password"
                className="settings-select"
                placeholder="Confirma tu contraseña"
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
                Cancelar
              </button>
              <button className="confirm-delete-btn" onClick={handleDeleteAccount} disabled={deletingAccount}>
                {deletingAccount ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>

          </div>
        </div>
      )}

      {showRemoveCardConfirm && (
        <div className="delete-modal-backdrop" onClick={() => setShowRemoveCardConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <h2>¿Eliminar método de pago?</h2>
            <p>Tendrás que agregar una tarjeta nueva la próxima vez que quieras pagar algo.</p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setShowRemoveCardConfirm(false)}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={handleRemoveCard}>
                Sí, eliminar
              </button>
            </div>

          </div>
        </div>
      )}

      {cardRemovedSuccess && (
        <div className="delete-modal-backdrop" onClick={() => setCardRemovedSuccess(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>Método de pago eliminado</h2>
            <p>Se eliminó correctamente. Podrás agregar uno nuevo cuando lo necesites.</p>

            <button className="confirm-btn" onClick={() => setCardRemovedSuccess(false)}>
              Entendido
            </button>

          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="delete-modal-backdrop" onClick={() => setShowCancelConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <h2>¿Cancelar tu membresía?</h2>
            <p>
              Seguirás disfrutando de tus beneficios {planName === "vip" ? "VIP" : "Premium"} durante {daysLeft} días más,
              hasta el final de tu periodo ya pagado. Después volverás al plan gratis.
            </p>

            <div className="delete-modal-actions">
              <button className="cancel-btn" onClick={() => setShowCancelConfirm(false)}>
                Volver
              </button>
              <button className="confirm-btn" onClick={handleCancelMembership}>
                Sí, cancelar
              </button>
            </div>

          </div>
        </div>
      )}

      {cancelSuccess && (
        <div className="delete-modal-backdrop" onClick={() => setCancelSuccess(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>

            <div className="success-icon"><SuccessCheck size={48} /></div>
            <h2>Membresía cancelada</h2>
            <p>
              Seguirás teniendo tus beneficios hasta dentro de {daysLeft} días. No se te cobrará de nuevo.
            </p>

            <button className="confirm-btn" onClick={() => setCancelSuccess(false)}>
              Entendido
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

export default Settings;
