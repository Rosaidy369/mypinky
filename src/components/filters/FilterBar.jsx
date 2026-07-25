import { Link } from "react-router-dom";

function FilterBar({ filters, onChange, isPremium }) {
  return (
    <div className="filter-bar">

      <div className="select-wrapper">
        <select
          value={filters.gender}
          onChange={(e) => onChange("gender", e.target.value)}
        >
          <option value="Todos">🧑 Todos los géneros</option>
          <option value="Mujer">Mujeres</option>
          <option value="Hombre">Hombres</option>
        </select>
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

          <input
            type="text"
            placeholder="🔒 Buscar por país o ciudad"
            disabled
            className="premium-locked-input"
          />

          <Link to="/premium" className="unlock-badge">
            💎 Premium
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