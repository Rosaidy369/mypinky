import { useState } from "react";
import { requestLocation } from "../../lib/geolocation";
import PinIcon from "../ui/PinIcon";
import CheckIcon from "../ui/CheckIcon";

function StepBasicInfo({ data, onChange }) {
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
      setLocationError(err.message);
    }
  };

  return (
    <div className="step-content">

      <h2>Cuéntanos sobre ti</h2>
      <p className="step-subtitle">Esta información aparecerá en tu perfil.</p>

      <label className="field-label">Nombre</label>
      <input
        type="text"
        placeholder="Tu nombre"
        value={data.name}
        onChange={(e) => onChange("name", e.target.value)}
      />

      <label className="field-label">Edad</label>
      <input
        type="number"
        placeholder="Tu edad"
        min="18"
        value={data.age}
        onChange={(e) => onChange("age", e.target.value)}
      />

      <label className="field-label">Género</label>
      <div className="option-pills">

        {["Mujer", "Hombre", "No binario"].map((option) => (
          <button
            type="button"
            key={option}
            className={`option-pill ${data.gender === option ? "selected" : ""}`}
            onClick={() => onChange("gender", option)}
          >
            {option}
          </button>
        ))}

      </div>

      <label className="field-label">Ciudad</label>
      <input
        type="text"
        placeholder="¿Dónde vives?"
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
            <><CheckIcon size={15} /> Ubicación compartida</>
          ) : (
            <><PinIcon size={15} /> {locationStatus === "loading" ? "Obteniendo ubicación..." : "Compartir mi ubicación (opcional)"}</>
          )}
        </button>

        <p className="location-share-hint">
          Nos ayuda a mostrarte la distancia real con otras personas. Es opcional — si no la compartes, seguirás viendo tu ciudad con normalidad.
        </p>

        {locationError && <p className="location-share-error">{locationError}</p>}

      </div>

    </div>
  );
}

export default StepBasicInfo;