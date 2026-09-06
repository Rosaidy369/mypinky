import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LockIcon from "../ui/LockIcon";
import PinIcon from "../ui/PinIcon";
import GlobeIcon from "../ui/GlobeIcon";
import PremiumDiamond from "../ui/PremiumDiamond";
import VipDiamond from "../ui/VipDiamond";
import { GENDER_FILTER_GENDERS, GENDER_FILTER_ALL, DATING_INTENTS, INTERESTS } from "../../data/profileOptions";
import { genderLabel, datingIntentLabel, interestLabel } from "../../lib/profileLabels";

const GENDER_OPTIONS = [GENDER_FILTER_ALL, ...GENDER_FILTER_GENDERS];
const DATING_INTENT_FILTER_ALL = null;

function FilterBar({ filters, onChange, isPremium, isVip }) {
  const { t } = useTranslation();

  const toggleInterestFilter = (code) => {
    const already = filters.interests.includes(code);
    onChange(
      "interests",
      already ? filters.interests.filter((i) => i !== code) : [...filters.interests, code]
    );
  };

  return (
    <div className="filter-bar">

      <div className="filter-gender-pills">
        {GENDER_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            className={`filter-gender-pill ${filters.gender === option ? "selected" : ""}`}
            onClick={() => onChange("gender", option)}
          >
            {option === GENDER_FILTER_ALL ? t("profileOptions.genderFilterAll") : genderLabel(t, option)}
          </button>
        ))}
      </div>

      <div className="filter-gender-pills">

        <button
          type="button"
          className={`filter-gender-pill ${filters.datingIntent === DATING_INTENT_FILTER_ALL ? "selected" : ""}`}
          onClick={() => onChange("datingIntent", DATING_INTENT_FILTER_ALL)}
        >
          {t("filters.datingIntent.all")}
        </button>

        {DATING_INTENTS.map(({ code }) => (
          <button
            key={code}
            type="button"
            className={`filter-gender-pill ${filters.datingIntent === code ? "selected" : ""}`}
            onClick={() => onChange("datingIntent", code)}
          >
            {datingIntentLabel(t, code)}
          </button>
        ))}

      </div>

      <div className="interest-grid">
        {INTERESTS.map(({ code }) => (
          <button
            type="button"
            key={code}
            className={`interest-chip ${filters.interests.includes(code) ? "selected" : ""}`}
            onClick={() => toggleInterestFilter(code)}
          >
            {interestLabel(t, code)}
          </button>
        ))}
      </div>

      <div className="distance-filter">

        <span className="distance-label">
          <PinIcon size={13} className="distance-label-icon" />
          {t("filters.maxDistance", { km: filters.maxDistance })}
        </span>

        <input
          type="range"
          min="1"
          max="100"
          value={filters.maxDistance}
          onChange={(e) => onChange("maxDistance", Number(e.target.value))}
          className="distance-slider"
        />

      </div>

      <div className="distance-filter age-range-filter">

        <span className="distance-label">
          {t("filters.ageRange", { min: filters.ageMin, max: filters.ageMax })}
        </span>

        <input
          type="range"
          min="18"
          max="90"
          value={filters.ageMin}
          onChange={(e) => onChange("ageMin", Math.min(Number(e.target.value), filters.ageMax))}
          className="distance-slider"
        />

        <input
          type="range"
          min="18"
          max="90"
          value={filters.ageMax}
          onChange={(e) => onChange("ageMax", Math.max(Number(e.target.value), filters.ageMin))}
          className="distance-slider"
        />

      </div>

      {isPremium ? (

        <div className="location-search-wrapper">
          <span className="location-search-icon"><GlobeIcon size={14} /></span>
          <input
            type="text"
            placeholder={t("filters.locationSearchPlaceholder")}
            value={filters.locationSearch}
            onChange={(e) => onChange("locationSearch", e.target.value)}
            className="location-search-input"
          />
        </div>

      ) : (

        <div className="premium-search-wrapper">

          <span className="premium-locked-icon"><LockIcon size={14} /></span>

          <input
            type="text"
            placeholder={t("filters.locationSearchPlaceholderLocked")}
            disabled
            className="premium-locked-input"
          />

          <Link to="/premium" className="unlock-badge">
            <PremiumDiamond size={13} /> {t("nav.premium")}
          </Link>

        </div>

      )}

      {isVip ? (

        <label className="online-filter">

          <input
            type="checkbox"
            checked={filters.onlineOnly}
            onChange={(e) => onChange("onlineOnly", e.target.checked)}
          />
          <span className="toggle-track"></span>
          <span className="toggle-label">{t("filters.onlineOnly")}</span>

        </label>

      ) : (

        <Link to="/premium" className="online-filter online-filter-locked">
          <span className="online-filter-lock-icon"><LockIcon size={13} /></span>
          <span className="toggle-label">{t("filters.onlineOnly")}</span>
          <span className="online-filter-badge"><VipDiamond size={13} /> {t("filters.vip")}</span>
        </Link>

      )}

    </div>
  );
}

export default FilterBar;