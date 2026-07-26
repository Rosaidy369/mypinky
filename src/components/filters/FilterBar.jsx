import { Link } from "react-router-dom";
import LockIcon from "../ui/LockIcon";
import PremiumDiamond from "../ui/PremiumDiamond";

const GENDER_OPTIONS = [
  { value: "Todos", label: "Todos" },
  { value: "Mujer", label: "Mujeres" },
  { value: "Hombre", label: "Hombres" },
];

function FilterBar({ filters, onChange, isPremium }) {
  return (
    <div className="filter-bar">

      <div className="filter-gender-pills">
        {GENDER_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`filter-gender-pill ${filters.gender === option.value ? "selected" : ""}`}
            onClick={() => onChange("gender", option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="distance-filter">

        <span className="distance-label">
          📍 Hasta {filters.maxDistance} km
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
          {filters.ageMin} - {filters.ageMax} años
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
            placeholder="🌍 Buscar por país o ciudad"
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
            placeholder="Buscar por país o ciudad"
            disabled
            className="premium-locked-input"
          />

          <Link to="/premium" className="unlock-badge">
            <PremiumDiamond size={13} /> Premium
          </Link>

        </div>

      )}

      <label className="online-filter">

        <input
          type="checkbox"
          checked={filters.onlineOnly}
          onChange={(e) => onChange("onlineOnly", e.target.checked)}
        />
        <span className="toggle-track"></span>
        <span className="toggle-label">🟢 Solo conectados</span>

      </label>

    </div>
  );
}

export default FilterBar;