import { useState } from "react";
import { useTranslation } from "react-i18next";
import { requestLocation } from "../../lib/geolocation";
import { GENDERS } from "../../data/profileOptions";
import { genderLabel } from "../../lib/profileLabels";
import PinIcon from "../ui/PinIcon";
import CheckIcon from "../ui/CheckIcon";

const LOCATION_ERROR_KEYS = {
  unsupported: "onboarding.basicInfo.locationErrorUnsupported",
  denied: "onboarding.basicInfo.locationErrorDenied",
  failed: "onboarding.basicInfo.locationErrorFailed",
};

function StepBasicInfo({ data, onChange }) {
  const { t } = useTranslation();
  const [locationStatus, setLocationStatus] = useState("idle");
  const [locationError, setLocationError] = useState("");

  const handleShareLocation = async () => {
    setLocationStatus("loading");
    setLocationError("");

    try {
      const { latitude, longitude } = await requestLocation();
      onChange("latitude", latitude);
      onChange("longitude", longitude);
      setLocationStatus("granted");
    } catch (err) {
      setLocationStatus("idle");
      setLocationError(t(LOCATION_ERROR_KEYS[err.code] || LOCATION_ERROR_KEYS.failed));
    }
  };

  return (
    <div className="step-content">

      <h2>{t("onboarding.basicInfo.heading")}</h2>
      <p className="step-subtitle">{t("onboarding.basicInfo.subtitle")}</p>

      <label className="field-label">{t("onboarding.basicInfo.nameLabel")}</label>
      <input
        type="text"
        placeholder={t("onboarding.basicInfo.namePlaceholder")}
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
      />

      <label className="field-label">{t("onboarding.basicInfo.ageLabel")}</label>
      <input
        type="number"
        placeholder={t("onboarding.basicInfo.agePlaceholder")}
        min="18"
        value={data.age}
        onChange={(e) => onChange("age", e.target.value)}
      />

      <label className="field-label">{t("onboarding.basicInfo.genderLabel")}</label>
      <div className="option-pills">

        {GENDERS.map((code) => (
          <button
            type="button"
            key={code}
            className={`option-pill ${data.gender === code ? "selected" : ""}`}
            onClick={() => onChange("gender", code)}
          >
            {genderLabel(t, code)}
          </button>
        ))}

      </div>

      <label className="field-label">{t("onboarding.basicInfo.cityLabel")}</label>
      <input
        type="text"
        placeholder={t("onboarding.basicInfo.cityPlaceholder")}
        value={data.city}
        onChange={(e) => onChange("city", e.target.value)}
      />

      <div className="location-share-row">

        <button
          type="button"
          className={`location-share-btn ${data.latitude ? "granted" : ""}`}
          onClick={handleShareLocation}
          disabled={locationStatus === "loading"}
        >
          {data.latitude ? (
            <><CheckIcon size={15} /> {t("onboarding.basicInfo.locationGranted")}</>
          ) : (
            <><PinIcon size={15} /> {locationStatus === "loading" ? t("onboarding.basicInfo.locationLoading") : t("onboarding.basicInfo.locationShare")}</>
          )}
        </button>

        <p className="location-share-hint">
          {t("onboarding.basicInfo.locationHint")}
        </p>

        {locationError && <p className="location-share-error">{locationError}</p>}

      </div>

    </div>
  );
}

export default StepBasicInfo;
