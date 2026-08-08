import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LockIcon from "../ui/LockIcon";
import PremiumDiamond from "../ui/PremiumDiamond";
import VipDiamond from "../ui/VipDiamond";
import { GENDER_FILTER_GENDERS, GENDER_FILTER_ALL } from "../../data/profileOptions";
import { genderLabel } from "../../lib/profileLabels";

const GENDER_OPTIONS = [GENDER_FILTER_ALL, ...GENDER_FILTER_GENDERS];

function FilterBar({ filters, onChange, isPremium, isVip }) {
  const { t } = useTranslation();

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

      <div className="distance-filter">

        <span className="distance-label">
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

        <div className="select-wrapper">
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